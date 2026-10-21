'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/TimeboxPlanner.jsx
// '타임박스' 탭. 널리 쓰이는 타임박스 플래너 양식(브레인 덤프 → Top 3 →
// 30분 단위 시간표 → 회고)을 따릅니다.
//  1) 브레인 덤프: 오늘 떠오르는 할 일을 모두 적습니다.
//  2) Top 3: 그중 오늘 반드시 끝낼 세 가지를 ⭐로 고릅니다.
//  3) 타임박스: Top 3부터 30분 칸에 배치하고, 남는 칸에 나머지를 채웁니다.
//  4) 회고 + 끝내지 못한 항목은 다음 날로 넘깁니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronLeft, ChevronRight, ChevronDown, Plus, Star, Trash2, Check, Settings2, ArrowRightToLine, Brain, Target, Clock,
  NotebookPen, GripVertical,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useTimebox, slotKeys, currentSlotKey } from '@/hooks/useTimebox';
import { Card } from './ui/Card';
import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { TimeboxNotifySettings } from './TimeboxNotifySettings';

const DURATIONS = [1, 2, 3, 4]; // 30분 단위 칸 수

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDate(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toDateStr(new Date(y, m - 1, d + days));
}

function dateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = ['일', '월', '화', '수', '목', '금', '토'][new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 (${dow})`;
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

// 'HH:MM' 바로 앞 30분 칸 키
function prevSlotKey(key) {
  const [h, m] = key.split(':').map(Number);
  return m === 30 ? `${String(h).padStart(2, '0')}:00` : `${String(h - 1).padStart(2, '0')}:30`;
}

// 할 일 텍스트별로 타임박스에 배치된 횟수. 한 번에 여러 칸을 채운 경우(연속된 같은 텍스트)는 1회로 셉니다.
function countPicks(days) {
  const counts = new Map();
  Object.values(days).forEach(({ blocks = {} }) => {
    Object.entries(blocks).forEach(([key, block]) => {
      if (blocks[prevSlotKey(key)]?.text === block.text) return;
      counts.set(block.text, (counts.get(block.text) || 0) + 1);
    });
  });
  return counts;
}

function SectionTitle({ icon: Icon, children, lm, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className={`flex items-center gap-2 text-sm font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>
        <Icon className={`w-4 h-4 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
        {children}
      </h3>
      {right}
    </div>
  );
}

// 완료 체크박스. 보이는 박스는 작아도 터치 영역은 44px로 넓혀, 옆의 할 일이나
// 타임박스 칸이 대신 눌리지 않게 합니다.
function CheckBox({ done, onClick, lm, className = 'min-w-11 min-h-11 -ml-2', boxClassName = 'w-6 h-6' }) {
  return (
    <button
      onClick={onClick}
      aria-label={done ? '완료 취소' : '완료'}
      className={`flex items-center justify-center shrink-0 ${className}`}
    >
      <span
        className={`${boxClassName} rounded-md border-2 flex items-center justify-center ${
          done ? 'bg-emerald-500 border-emerald-500 text-white' : lm ? 'bg-white border-slate-300' : 'bg-gray-900 border-gray-600'
        }`}
      >
        {done && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

function DumpItem({ item, isTop, topFull, lm, muted, onToggle, onTop, onDelete, dragHandle }) {
  return (
    <>
      {dragHandle}
      <CheckBox done={item.done} onClick={onToggle} lm={lm} className={`min-w-11 min-h-11 ${dragHandle ? '-mx-1' : '-ml-2'}`} />
      <span className={`flex-1 text-sm truncate ${item.done ? `line-through ${muted}` : lm ? 'text-slate-700' : 'text-gray-200'}`}>{item.text}</span>
      <IconButton
        icon={Star}
        label={isTop ? 'Top 3에서 빼기' : 'Top 3로 지정'}
        tone={isTop ? 'active' : 'default'}
        filled={isTop}
        disabled={!isTop && topFull}
        className="disabled:opacity-30"
        onClick={onTop}
      />
      <IconButton icon={Trash2} label="삭제" tone="danger" onClick={onDelete} />
    </>
  );
}

// 미완료 항목은 왼쪽 손잡이를 끌어 순서를 바꿉니다(손잡이에서만 드래그 → 스크롤과 충돌 없음).
function SortableDumpItem({ lm, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }}
      className={`relative flex items-center gap-1 rounded-xl ${isDragging ? (lm ? 'bg-white shadow-lg' : 'bg-gray-800 shadow-lg') : ''}`}
    >
      <DumpItem
        lm={lm}
        {...props}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            className={`flex items-center justify-center w-6 min-h-11 -ml-1 touch-none cursor-grab active:cursor-grabbing ${lm ? 'text-slate-300' : 'text-gray-600'}`}
            aria-label="드래그하여 순서 변경"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        }
      />
    </li>
  );
}

function SlotEditor({ open, slot, day, slots, otherPending, pickCount, lm, onClose, onSave, onClear }) {
  const block = day.blocks[slot] || {};
  const [text, setText] = useState('');
  const [itemId, setItemId] = useState(null);
  const [length, setLength] = useState(1);

  useEffect(() => {
    if (!open) return;
    setText(block.text || '');
    setItemId(block.itemId || null);
    setLength(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slot]);

  const startIdx = slots.indexOf(slot);
  const maxLen = slots.length - startIdx;
  const endKey = slots[startIdx + length] ?? '24:00';
  const pending = day.brainDump.filter((i) => !i.done);
  const topIds = day.top3.filter(Boolean);
  const picks = (item) => pickCount.get(item.text) || 0;
  const sorted = [...pending].sort((a, b) => topIds.includes(b.id) - topIds.includes(a.id) || picks(b) - picks(a));

  const chip = (item, suffix) => {
    const sel = itemId === item.id;
    return (
      <button
        key={item.id}
        onClick={() => { setItemId(item.id); setText(item.text); }}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          sel
            ? lm ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-violet-600 border-violet-600 text-white'
            : lm ? 'border-slate-200 text-slate-600' : 'border-gray-700 text-gray-300'
        }`}
      >
        {topIds.includes(item.id) && '⭐ '}{item.text}
        {suffix && <span className="ml-1 opacity-60">{suffix}</span>}
      </button>
    );
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={`${slot} – ${endKey}`}>
      <div className="p-5 space-y-4">
        {sorted.length > 0 && (
          <div>
            <p className={`text-xs mb-2 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>브레인 덤프에서 고르기</p>
            <div className="flex flex-wrap gap-2">{sorted.map((item) => chip(item))}</div>
          </div>
        )}
        {otherPending.length > 0 && (
          <div>
            <p className={`text-xs mb-2 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>다른 날 할 일</p>
            <div className="flex flex-wrap gap-2">
              {otherPending.map((item) => {
                const [, m, d] = item.date.split('-').map(Number);
                return chip(item, `${m}/${d}`);
              })}
            </div>
          </div>
        )}
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); setItemId(null); }}
          placeholder="직접 입력"
          className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900' : 'bg-gray-800 border-gray-700 focus:border-violet-500 text-white'}`}
        />
        <div>
          <p className={`text-xs mb-2 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>길이</p>
          <div className="flex gap-2">
            {DURATIONS.filter((n) => n <= maxLen).map((n) => (
              <button
                key={n}
                onClick={() => setLength(n)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                  length === n
                    ? lm ? 'bg-indigo-50 border-indigo-400 text-indigo-600' : 'bg-gray-800 border-violet-500 text-violet-400'
                    : lm ? 'border-slate-200 text-slate-500' : 'border-gray-700 text-gray-400'
                }`}
              >
                {n * 30 >= 60 ? `${n / 2}시간` : '30분'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {block.text && (
            <Button variant="secondary" className="flex-1" onClick={onClear}>비우기</Button>
          )}
          <Button
            className="flex-1"
            disabled={!text.trim()}
            onClick={() => onSave(slots.slice(startIdx, startIdx + length), { text: text.trim(), itemId })}
          >
            저장
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

export function TimeboxPlanner() {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const { loaded, settings, days, getDay, updateDay, saveSettings } = useTimebox();

  const today = toDateStr(new Date());
  const [date, setDate] = useState(today);
  const [draft, setDraft] = useState('');
  const [editingSlot, setEditingSlot] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [reflection, setReflection] = useState('');
  const [nowSlot, setNowSlot] = useState(currentSlotKey());
  const [showDone, setShowDone] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const day = getDay(date);
  const slots = useMemo(() => slotKeys(settings), [settings]);
  const itemById = useMemo(() => Object.fromEntries(day.brainDump.map((i) => [i.id, i])), [day.brainDump]);
  const topIds = day.top3.filter(Boolean);
  const isToday = date === today;

  const pickCount = useMemo(() => countPicks(days), [days]);

  // 다른 날짜의 미완료 브레인 덤프 항목(같은 텍스트는 최신 날짜 것 하나만). 많이 고른 순 → 최신 날짜 순.
  const otherPending = useMemo(() => {
    const seen = new Set(day.brainDump.map((i) => i.text));
    const items = [];
    Object.keys(days)
      .filter((d) => d !== date)
      .sort()
      .reverse()
      .forEach((d) => {
        (days[d].brainDump || []).forEach((i) => {
          if (i.done || seen.has(i.text)) return;
          seen.add(i.text);
          items.push({ ...i, date: d });
        });
      });
    return items.sort((a, b) => (pickCount.get(b.text) || 0) - (pickCount.get(a.text) || 0));
  }, [days, date, day.brainDump, pickCount]);

  useEffect(() => { setReflection(day.reflection || ''); }, [date, day.reflection]);

  useEffect(() => {
    const t = setInterval(() => setNowSlot(currentSlotKey()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const addItem = () => {
    const text = draft.trim();
    if (!text) return;
    updateDay(date, (d) => ({ ...d, brainDump: [...d.brainDump, { id: newId(), text, done: false }] }));
    setDraft('');
  };

  const toggleItem = (id) =>
    updateDay(date, (d) => ({ ...d, brainDump: d.brainDump.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) }));

  const deleteItem = (id) =>
    updateDay(date, (d) => ({
      ...d,
      brainDump: d.brainDump.filter((i) => i.id !== id),
      top3: d.top3.map((t) => (t === id ? null : t)),
    }));

  const reorderItems = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    updateDay(date, (d) => {
      const ids = d.brainDump.map((i) => i.id);
      return { ...d, brainDump: arrayMove(d.brainDump, ids.indexOf(active.id), ids.indexOf(over.id)) };
    });
  };

  const toggleTop = (id) =>
    updateDay(date, (d) => {
      if (d.top3.includes(id)) return { ...d, top3: d.top3.map((t) => (t === id ? null : t)) };
      const empty = d.top3.indexOf(null);
      if (empty === -1) return d;
      const top3 = [...d.top3];
      top3[empty] = id;
      return { ...d, top3 };
    });

  const saveSlots = (keys, block) => {
    updateDay(date, (d) => {
      const blocks = { ...d.blocks };
      keys.forEach((k) => { blocks[k] = { ...block, done: false }; });
      return { ...d, blocks };
    });
    setEditingSlot(null);
  };

  const clearSlot = (key) => {
    updateDay(date, (d) => {
      const blocks = { ...d.blocks };
      delete blocks[key];
      return { ...d, blocks };
    });
    setEditingSlot(null);
  };

  const toggleSlotDone = (key) =>
    updateDay(date, (d) => ({ ...d, blocks: { ...d.blocks, [key]: { ...d.blocks[key], done: !d.blocks[key].done } } }));

  // 끝내지 못한 브레인 덤프 항목을 다음 날로 복사합니다(Top 3 지정도 유지).
  // 오늘 기록은 그대로 남기고, 다음 날에 같은 내용이 이미 있으면 건너뜁니다.
  const carryOver = () => {
    const pending = day.brainDump.filter((i) => !i.done);
    if (pending.length === 0) return;
    const nextDate = shiftDate(date, 1);
    updateDay(nextDate, (next) => {
      const existing = new Set(next.brainDump.map((i) => i.text));
      const top3 = [...next.top3];
      const copied = pending
        .filter((i) => !existing.has(i.text))
        .map((i) => {
          const copy = { id: newId(), text: i.text, done: false };
          const empty = top3.indexOf(null);
          if (topIds.includes(i.id) && empty !== -1) top3[empty] = copy.id;
          return copy;
        });
      return { ...next, brainDump: [...next.brainDump, ...copied], top3 };
    });
    setDate(nextDate);
  };

  if (!loaded) return null;

  const muted = lm ? 'text-slate-400' : 'text-gray-500';
  const hours = [];
  for (let i = 0; i < slots.length; i += 2) hours.push([slots[i], slots[i + 1]]);
  const pendingItems = day.brainDump.filter((i) => !i.done);
  const doneItems = day.brainDump.filter((i) => i.done);
  const pendingCount = pendingItems.length;
  const dumpItemProps = (item) => ({
    item,
    isTop: topIds.includes(item.id),
    topFull: topIds.length >= 3,
    muted,
    onToggle: () => toggleItem(item.id),
    onTop: () => toggleTop(item.id),
    onDelete: () => deleteItem(item.id),
  });

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-4 space-y-3">
      {/* 날짜 */}
      <div className="flex items-center justify-between">
        <IconButton icon={ChevronLeft} label="이전 날" onClick={() => setDate(shiftDate(date, -1))} />
        <button onClick={() => setDate(today)} className="text-center">
          <p className={`text-base font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>{dateLabel(date)}</p>
          {!isToday && <p className={`text-[11px] ${lm ? 'text-indigo-500' : 'text-violet-400'}`}>오늘로 이동</p>}
        </button>
        <div className="flex">
          <IconButton icon={Settings2} label="시간 범위 설정" onClick={() => setShowSettings((v) => !v)} />
          <IconButton icon={ChevronRight} label="다음 날" onClick={() => setDate(shiftDate(date, 1))} />
        </div>
      </div>

      {showSettings && (
        <Card>
          <div className="flex items-center gap-2 text-sm">
            <span className={muted}>표시 시간</span>
            <select
              value={settings.startHour}
              onChange={(e) => saveSettings({ ...settings, startHour: Number(e.target.value) })}
              className={`rounded-lg px-2 py-1 border ${lm ? 'bg-white border-slate-200' : 'bg-gray-800 border-gray-700 text-white'}`}
            >
              {Array.from({ length: 24 }, (_, h) => h).filter((h) => h < settings.endHour).map((h) => (
                <option key={h} value={h}>{h}시</option>
              ))}
            </select>
            <span className={muted}>~</span>
            <select
              value={settings.endHour}
              onChange={(e) => saveSettings({ ...settings, endHour: Number(e.target.value) })}
              className={`rounded-lg px-2 py-1 border ${lm ? 'bg-white border-slate-200' : 'bg-gray-800 border-gray-700 text-white'}`}
            >
              {Array.from({ length: 24 }, (_, h) => h + 1).filter((h) => h > settings.startHour).map((h) => (
                <option key={h} value={h}>{h}시</option>
              ))}
            </select>
          </div>
          <TimeboxNotifySettings settings={settings} saveSettings={saveSettings} lm={lm} />
        </Card>
      )}

      {/* Top 3 */}
      <Card>
        <SectionTitle icon={Target} lm={lm}>오늘의 Top 3</SectionTitle>
        <ol className="space-y-2">
          {day.top3.map((id, idx) => {
            const item = id && itemById[id];
            return (
              <li key={idx} className={`flex items-center gap-3 px-3 py-1 min-h-[3.25rem] rounded-xl ${lm ? 'bg-amber-50/60' : 'bg-amber-950/20'}`}>
                <span className="text-sm font-black text-amber-500 w-4">{idx + 1}</span>
                {item ? (
                  <>
                    <CheckBox done={item.done} onClick={() => toggleItem(item.id)} lm={lm} />
                    <span className={`flex-1 text-sm ${item.done ? `line-through ${muted}` : lm ? 'text-slate-800' : 'text-gray-100'}`}>{item.text}</span>
                  </>
                ) : (
                  <span className={`text-xs ${muted}`}>브레인 덤프에서 ⭐를 눌러 지정하세요</span>
                )}
              </li>
            );
          })}
        </ol>
      </Card>

      {/* 브레인 덤프 */}
      <Card>
        <SectionTitle icon={Brain} lm={lm}>브레인 덤프</SectionTitle>
        <div className="flex gap-2 mb-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) addItem(); }}
            placeholder="오늘 해야 할 일을 모두 적어보세요"
            className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl border text-sm outline-none ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900' : 'bg-gray-800 border-gray-700 focus:border-violet-500 text-white'}`}
          />
          <IconButton icon={Plus} label="추가" onClick={addItem} />
        </div>
        {day.brainDump.length === 0 ? (
          <p className={`text-xs text-center py-3 ${muted}`}>머릿속에 있는 일을 전부 꺼내 적는 것부터 시작해요</p>
        ) : (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderItems}>
              <SortableContext items={pendingItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <ul>
                  {pendingItems.map((item) => (
                    <SortableDumpItem key={item.id} lm={lm} {...dumpItemProps(item)} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
            {doneItems.length > 0 && (
              <>
                <button
                  onClick={() => setShowDone((v) => !v)}
                  aria-expanded={showDone}
                  className={`flex items-center gap-1 min-h-11 text-xs font-medium ${muted}`}
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showDone ? '' : '-rotate-90'}`} />
                  완료 {doneItems.length}개
                </button>
                {showDone && (
                  <ul>
                    {doneItems.map((item) => (
                      <li key={item.id} className="flex items-center gap-1 pl-5">
                        <DumpItem lm={lm} {...dumpItemProps(item)} />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </Card>

      {/* 타임박스 */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-4 pt-4">
          <SectionTitle icon={Clock} lm={lm}>타임박스 <span className={`text-[11px] font-normal ${muted}`}>30분 단위 · 칸을 눌러 배치</span></SectionTitle>
        </div>
        <div className={`grid grid-cols-[3rem_1fr_1fr] text-[10px] font-bold px-2 pb-1 ${muted}`}>
          <span />
          <span className="px-1">:00</span>
          <span className="px-1">:30</span>
        </div>
        <div className={`border-t ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
          {hours.map(([a, b]) => (
            <div key={a} className={`grid grid-cols-[3rem_1fr_1fr] border-b ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
              <span className={`text-xs font-bold flex items-start justify-center pt-2 ${muted}`}>{a.slice(0, 2)}</span>
              {[a, b].map((key) => {
                const block = day.blocks[key];
                const isNow = isToday && key === nowSlot;
                const isTopBlock = block?.itemId && topIds.includes(block.itemId);
                return (
                  <div
                    key={key}
                    className={`relative min-h-11 border-l ${lm ? 'border-slate-100' : 'border-gray-800'} ${isNow ? (lm ? 'ring-2 ring-inset ring-indigo-400' : 'ring-2 ring-inset ring-violet-500') : ''}`}
                  >
                    <button
                      onClick={() => setEditingSlot(key)}
                      aria-label={`${key} ${block?.text || '비어 있음'}`}
                      className={`w-full h-full min-h-11 text-left pl-2 ${block ? 'pr-10' : 'pr-2'} py-1.5 text-xs ${
                        block
                          ? isTopBlock
                            ? lm ? 'bg-amber-50 text-amber-800' : 'bg-amber-950/30 text-amber-200'
                            : lm ? 'bg-indigo-50 text-indigo-800' : 'bg-violet-950/40 text-violet-200'
                          : lm ? 'hover:bg-slate-50' : 'hover:bg-gray-800/50'
                      } ${block?.done ? 'line-through opacity-50' : ''}`}
                    >
                      {block?.text}
                    </button>
                    {block && (
                      <CheckBox
                        done={block.done}
                        onClick={() => toggleSlotDone(key)}
                        lm={lm}
                        className="absolute top-0 right-0 w-10 h-11"
                        boxClassName="w-5 h-5"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      {/* 회고 */}
      <Card>
        <SectionTitle icon={NotebookPen} lm={lm}>하루 회고</SectionTitle>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          onBlur={() => reflection !== (day.reflection || '') && updateDay(date, (d) => ({ ...d, reflection }))}
          rows={3}
          placeholder="잘한 점, 아쉬운 점, 내일 바꿀 점"
          className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900' : 'bg-gray-800 border-gray-700 focus:border-violet-500 text-white'}`}
        />
        <Button variant="secondary" className="w-full mt-3 flex items-center justify-center gap-1.5" disabled={pendingCount === 0} onClick={carryOver}>
          <ArrowRightToLine className="w-4 h-4" />
          미완료 {pendingCount}개 내일로 넘기기
        </Button>
      </Card>

      <SlotEditor
        open={editingSlot !== null}
        slot={editingSlot}
        day={day}
        slots={slots}
        otherPending={otherPending}
        pickCount={pickCount}
        lm={lm}
        onClose={() => setEditingSlot(null)}
        onSave={saveSlots}
        onClear={() => clearSlot(editingSlot)}
      />
    </div>
  );
}
