'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/TimeboxPlanner.jsx
// '타임박스' 탭. 널리 쓰이는 타임박스 플래너 양식(브레인 덤프 → Top 3 →
// 30분 단위 시간표 → 회고)을 따릅니다.
//  1) 브레인 덤프: 오늘 떠오르는 할 일을 모두 적습니다. 자주·매일 하는 일은
//     즐겨찾기에 등록해 두고 팝업에서 골라 넣습니다.
//  2) Top 3: 그중 오늘 반드시 끝낼 세 가지를 ⭐로 고릅니다.
//  3) 타임박스: Top 3부터 30분 칸에 배치하고, 남는 칸에 나머지를 채웁니다.
//  4) 회고 + 끝내지 못한 항목은 다음 날로 넘깁니다.
// 일정(날짜·시간이 정해진 일, 미래 날짜 할 일)은 그날의 브레인 덤프와 칸으로 바로
// 넣고, 루틴(요일 반복)은 해당 요일에 자동으로 펼쳐집니다. 월간 캘린더로 날짜를 오갑니다.
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
  NotebookPen, GripVertical, Bookmark, X, CalendarDays, CalendarPlus, Repeat, Pencil,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useTimebox, slotKeys, currentSlotKey, toggleBlockDone, isRoutineItem } from '@/hooks/useTimebox';
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

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 월요일부터 표시

function dateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = DOW[new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 (${dow})`;
}

function weekdaysLabel(weekdays) {
  if (weekdays.length === 7) return '매일';
  const key = [...weekdays].sort().join();
  if (key === '1,2,3,4,5') return '평일';
  if (key === '0,6') return '주말';
  return WEEK_ORDER.filter((d) => weekdays.includes(d)).map((d) => DOW[d]).join('·');
}

const lengthLabel = (n) => (n >= 2 ? `${n / 2}시간` : '30분');

const fieldCls = (lm) =>
  `w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900' : 'bg-gray-800 border-gray-700 focus:border-violet-500 text-white'}`;

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

// 'HH:MM' 바로 앞 30분 칸 키
function prevSlotKey(key) {
  const [h, m] = key.split(':').map(Number);
  return m === 30 ? `${String(h).padStart(2, '0')}:00` : `${String(h - 1).padStart(2, '0')}:30`;
}

// 할 일 텍스트별로 타임박스에 배치되거나 Top 3로 지정된 횟수.
// 한 번에 여러 칸을 채운 경우(연속된 같은 텍스트)는 1회로 셉니다.
function countPicks(days) {
  const counts = new Map();
  const add = (text) => counts.set(text, (counts.get(text) || 0) + 1);
  Object.values(days).forEach(({ blocks = {}, brainDump = [], top3 = [] }) => {
    Object.entries(blocks).forEach(([key, block]) => {
      if (blocks[prevSlotKey(key)]?.text === block.text) return;
      add(block.text);
    });
    top3.forEach((id) => {
      const item = id && brainDump.find((i) => i.id === id);
      if (item) add(item.text);
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

function DumpItem({ item, isTop, topFull, isFav, lm, muted, onToggle, onTop, onFav, onDelete, dragHandle }) {
  return (
    <>
      {dragHandle}
      <CheckBox done={item.done} onClick={onToggle} lm={lm} className={`min-w-11 min-h-11 ${dragHandle ? '-mx-1' : '-ml-2'}`} />
      {item.time && (
        <span className={`text-[11px] font-semibold tabular-nums shrink-0 ${lm ? 'text-indigo-500' : 'text-violet-400'}`}>{item.time}</span>
      )}
      {isRoutineItem(item) && <Repeat className={`w-3 h-3 shrink-0 ${muted}`} aria-label="루틴" />}
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
      <IconButton
        icon={Bookmark}
        label={isFav ? '즐겨찾기에서 빼기' : '즐겨찾기에 추가'}
        tone={isFav ? 'active' : 'default'}
        filled={isFav}
        onClick={onFav}
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

function SlotEditor({ open, slot, day, slots, favorites, pickCount, lm, onClose, onSave, onClear }) {
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
  const pendingTexts = new Set(pending.map((i) => i.text));
  const favs = favorites.filter((t) => !pendingTexts.has(t));

  // 즐겨찾기 칩은 브레인 덤프 항목이 아니므로 id 없이 텍스트만 넣습니다.
  const chip = (item) => {
    const id = item.id ?? null;
    const sel = itemId === id && text === item.text;
    return (
      <button
        key={item.id ?? item.text}
        onClick={() => { setItemId(id); setText(item.text); }}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          sel
            ? lm ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-violet-600 border-violet-600 text-white'
            : lm ? 'border-slate-200 text-slate-600' : 'border-gray-700 text-gray-300'
        }`}
      >
        {topIds.includes(item.id) && '⭐ '}{item.text}
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
        {favs.length > 0 && (
          <div>
            <p className={`text-xs mb-2 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>즐겨찾기</p>
            <div className="flex flex-wrap gap-2">{favs.map((t) => chip({ text: t }))}</div>
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

// 자주·매일 하는 할 일 목록 팝업. 누르면 이 날 브레인 덤프에 추가됩니다.
function FavoritesSheet({ open, favorites, addedTexts, lm, onClose, onPick, onAdd, onRemove }) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => { if (!open) setEditing(false); }, [open]);

  const muted = lm ? 'text-slate-400' : 'text-gray-500';
  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft('');
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="즐겨찾기">
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) add(); }}
            placeholder="자주 하는 일·매일 루틴 등록"
            className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl border text-sm outline-none ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900' : 'bg-gray-800 border-gray-700 focus:border-violet-500 text-white'}`}
          />
          <IconButton icon={Plus} label="즐겨찾기 등록" onClick={add} />
        </div>
        {favorites.length === 0 ? (
          <p className={`text-xs text-center py-3 ${muted}`}>등록해 두면 매일 적지 않고 골라 넣을 수 있어요</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className={`text-[11px] ${muted}`}>{editing ? '누르면 즐겨찾기에서 빠져요' : '누르면 브레인 덤프에 추가돼요'}</p>
              <button
                onClick={() => setEditing((v) => !v)}
                className={`text-xs font-semibold px-2.5 min-h-11 ${editing ? (lm ? 'text-indigo-600' : 'text-violet-400') : muted}`}
              >
                {editing ? '완료' : '편집'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {favorites.map((text) => {
                const added = addedTexts.has(text);
                return (
                  <button
                    key={text}
                    onClick={() => (editing ? onRemove(text) : onPick(text))}
                    disabled={!editing && added}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border disabled:opacity-40 ${lm ? 'border-slate-200 text-slate-600' : 'border-gray-700 text-gray-300'}`}
                  >
                    {editing ? <X className="w-3 h-3" /> : added && <Check className="w-3 h-3" />}
                    {text}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

// 시간(30분 단위, 선택)과 길이. 일정·루틴 시트가 함께 씁니다.
function TimeFields({ slots, time, length, lm, onTime, onLength }) {
  const muted = lm ? 'text-slate-400' : 'text-gray-500';
  const maxLen = time ? slots.length - slots.indexOf(time) : 0;
  return (
    <>
      <div>
        <p className={`text-xs mb-2 ${muted}`}>시간</p>
        <select value={time} onChange={(e) => onTime(e.target.value)} className={fieldCls(lm)}>
          <option value="">시간 없음 (그날 할 일로만)</option>
          {slots.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      {time && (
        <div>
          <p className={`text-xs mb-2 ${muted}`}>길이</p>
          <div className="flex gap-2">
            {DURATIONS.filter((n) => n <= maxLen).map((n) => (
              <button
                key={n}
                onClick={() => onLength(n)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                  length === n
                    ? lm ? 'bg-indigo-50 border-indigo-400 text-indigo-600' : 'bg-gray-800 border-violet-500 text-violet-400'
                    : lm ? 'border-slate-200 text-slate-500' : 'border-gray-700 text-gray-400'
                }`}
              >
                {lengthLabel(n)}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// 일정 추가: 고른 날짜의 브레인 덤프에 넣고, 시간이 있으면 그 칸들도 채웁니다.
function EventSheet({ open, defaultDate, slots, getDay, lm, onClose, onSave }) {
  const [text, setText] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('');
  const [length, setLength] = useState(2);

  useEffect(() => {
    if (!open) return;
    setText('');
    setDate(defaultDate);
    setTime('');
    setLength(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const start = slots.indexOf(time);
  const keys = time ? slots.slice(start, start + Math.min(length, slots.length - start)) : [];
  const busy = date && keys.some((k) => getDay(date).blocks[k]);

  return (
    <BottomSheet open={open} onClose={onClose} title="일정 추가">
      <div className="p-5 space-y-4">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="예: 치과, 보고서 제출" className={fieldCls(lm)} />
        <div>
          <p className={`text-xs mb-2 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>날짜</p>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls(lm)} />
        </div>
        <TimeFields slots={slots} time={time} length={length} lm={lm} onTime={setTime} onLength={setLength} />
        {busy && <p className="text-xs text-rose-500">이 시간에 이미 채워진 칸이 있어요. 시간을 바꾸거나 칸을 먼저 비워 주세요.</p>}
        <Button
          className="w-full"
          disabled={!text.trim() || !date || busy}
          onClick={() => onSave({ text: text.trim(), date, time: time || null, keys })}
        >
          추가
        </Button>
      </div>
    </BottomSheet>
  );
}

// 루틴: 요일마다 반복되는 할 일. 해당 요일 브레인 덤프(+시간이 있으면 칸)에 자동으로 들어갑니다.
function RoutinesSheet({ open, routines, slots, today, lm, onClose, onSave }) {
  const empty = { text: '', weekdays: [0, 1, 2, 3, 4, 5, 6], time: '', length: 1 };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const reset = () => { setForm(empty); setEditingId(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) reset(); }, [open]);

  const muted = lm ? 'text-slate-400' : 'text-gray-500';
  const toggleDay = (d) =>
    setForm((f) => ({ ...f, weekdays: f.weekdays.includes(d) ? f.weekdays.filter((x) => x !== d) : [...f.weekdays, d] }));

  const submit = () => {
    const data = { text: form.text.trim(), weekdays: form.weekdays, time: form.time || null, length: form.length };
    onSave(
      editingId
        ? routines.map((r) => (r.id === editingId ? { ...r, ...data } : r))
        : [...routines, { id: newId(), startDate: today, ...data }]
    );
    reset();
  };

  const edit = (r) => {
    setEditingId(r.id);
    setForm({ text: r.text, weekdays: r.weekdays, time: r.time || '', length: r.length });
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="루틴">
      <div className="p-5 space-y-4">
        <input
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          placeholder="예: 아침 운동, 영양제 먹기"
          className={fieldCls(lm)}
        />
        <div>
          <p className={`text-xs mb-2 ${muted}`}>반복 요일</p>
          <div className="flex gap-1.5">
            {WEEK_ORDER.map((d) => {
              const on = form.weekdays.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  aria-pressed={on}
                  className={`flex-1 min-h-11 rounded-xl text-xs font-bold border ${
                    on
                      ? lm ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-violet-600 border-violet-600 text-white'
                      : lm ? 'border-slate-200 text-slate-500' : 'border-gray-700 text-gray-400'
                  }`}
                >
                  {DOW[d]}
                </button>
              );
            })}
          </div>
        </div>
        <TimeFields
          slots={slots}
          time={form.time}
          length={form.length}
          lm={lm}
          onTime={(time) => setForm((f) => ({ ...f, time, length: 1 }))}
          onLength={(length) => setForm((f) => ({ ...f, length }))}
        />
        <div className="flex gap-2">
          {editingId && <Button variant="secondary" className="flex-1" onClick={reset}>취소</Button>}
          <Button className="flex-1" disabled={!form.text.trim() || form.weekdays.length === 0} onClick={submit}>
            {editingId ? '수정' : '루틴 추가'}
          </Button>
        </div>
        {routines.length > 0 && (
          <ul className={`border-t pt-2 ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
            {routines.map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <Repeat className={`w-4 h-4 shrink-0 ${muted}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${lm ? 'text-slate-700' : 'text-gray-200'}`}>{r.text}</p>
                  <p className={`text-[11px] ${muted}`}>
                    {weekdaysLabel(r.weekdays)}{r.time && ` · ${r.time} (${lengthLabel(r.length)})`}
                  </p>
                </div>
                <IconButton icon={Pencil} label="수정" onClick={() => edit(r)} />
                <IconButton icon={Trash2} label="삭제" tone="danger" onClick={() => onSave(routines.filter((x) => x.id !== r.id))} />
              </li>
            ))}
          </ul>
        )}
        <p className={`text-[11px] ${muted}`}>바꾼 내용은 아직 손대지 않은 날부터 반영돼요.</p>
      </div>
    </BottomSheet>
  );
}

// 월간 캘린더: 날짜마다 남은 할 일·일정 수를 보여 주고, 누르면 그날로 이동합니다.
// 루틴 항목은 매일 있어 점이 의미 없으므로 세지 않습니다.
function MonthSheet({ open, date, today, days, lm, onClose, onPick }) {
  const [month, setMonth] = useState(date.slice(0, 7));
  useEffect(() => { if (open) setMonth(date.slice(0, 7)); }, [open, date]);

  const [y, m] = month.split('-').map(Number);
  const startDow = new Date(y, m - 1, 1).getDay();
  const lastDay = new Date(y, m, 0).getDate();
  const shiftMonth = (n) => setMonth(toDateStr(new Date(y, m - 1 + n, 1)).slice(0, 7));
  const muted = lm ? 'text-slate-400' : 'text-gray-500';

  return (
    <BottomSheet open={open} onClose={onClose} title="캘린더">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <IconButton icon={ChevronLeft} label="이전 달" onClick={() => shiftMonth(-1)} />
          <p className={`text-sm font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>{y}년 {m}월</p>
          <IconButton icon={ChevronRight} label="다음 달" onClick={() => shiftMonth(1)} />
        </div>
        <div className={`grid grid-cols-7 text-center text-[11px] font-bold mb-1 ${muted}`}>
          {DOW.map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDow }, (_, i) => <span key={`b${i}`} />)}
          {Array.from({ length: lastDay }, (_, i) => {
            const ds = `${month}-${String(i + 1).padStart(2, '0')}`;
            const items = (days[ds]?.brainDump || []).filter((it) => !isRoutineItem(it));
            const left = items.filter((it) => !it.done).length;
            const hasTimed = items.some((it) => it.time && !it.done);
            const selected = ds === date;
            return (
              <button
                key={ds}
                onClick={() => onPick(ds)}
                className={`flex flex-col items-center justify-start pt-1.5 h-12 rounded-xl text-sm ${
                  selected
                    ? lm ? 'bg-indigo-600 text-white' : 'bg-violet-600 text-white'
                    : ds === today
                      ? lm ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-gray-800 text-violet-300 font-bold'
                      : lm ? 'text-slate-700 hover:bg-slate-50' : 'text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                {i + 1}
                {left > 0 && (
                  <span className={`mt-0.5 text-[10px] font-bold leading-none ${selected ? 'text-white/90' : hasTimed ? 'text-amber-500' : muted}`}>
                    {hasTimed ? '●' : '·'}{left}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className={`text-[11px] mt-3 ${muted}`}>숫자는 남은 할 일 수, <span className="text-amber-500">●</span>은 시간이 정해진 일정이 있는 날이에요.</p>
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
  const [showFavorites, setShowFavorites] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [showRoutines, setShowRoutines] = useState(false);
  const [showMonth, setShowMonth] = useState(false);

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

  // 즐겨찾기(자주·매일 하는 할 일 텍스트)는 타임박스 설정에 함께 저장합니다(기기 간 동기화).
  const favorites = settings.favorites || [];
  const setFavorite = (text, on) => {
    const rest = favorites.filter((t) => t !== text);
    saveSettings({ ...settings, favorites: on ? [...rest, text] : rest });
  };

  // 즐겨찾기를 이 날 브레인 덤프에 추가합니다(같은 텍스트가 이미 있으면 건너뜀).
  const addFavoriteToDump = (text) =>
    updateDay(date, (d) =>
      d.brainDump.some((i) => i.text === text)
        ? d
        : { ...d, brainDump: [...d.brainDump, { id: newId(), text, done: false }] }
    );

  const routines = settings.routines || [];
  const saveRoutines = (next) => saveSettings({ ...settings, routines: next });

  // 일정은 그날 브레인 덤프 항목으로 넣고, 시간이 있으면 칸에도 배치한 뒤 그날로 이동합니다.
  const addEvent = ({ text, date: target, time, keys }) => {
    const id = newId();
    updateDay(target, (d) => {
      const blocks = { ...d.blocks };
      keys.forEach((k) => { blocks[k] = { text, itemId: id, done: false }; });
      return { ...d, brainDump: [...d.brainDump, { id, text, done: false, ...(time && { time }) }], blocks };
    });
    setShowEvent(false);
    setDate(target);
  };

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

  const toggleSlotDone = (key) => updateDay(date, (d) => toggleBlockDone(d, key));

  // 끝내지 못한 브레인 덤프 항목을 다음 날로 복사합니다(Top 3 지정도 유지).
  // 오늘 기록은 그대로 남기고, 다음 날에 같은 내용이 이미 있으면 건너뜁니다.
  // 루틴 항목은 다음 날 루틴이 따로 생기므로 넘기지 않습니다.
  const carryOver = () => {
    const pending = day.brainDump.filter((i) => !i.done && !isRoutineItem(i));
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
  const pendingCount = pendingItems.filter((i) => !isRoutineItem(i)).length;
  const topFull = topIds.length >= 3;
  const dumpItemProps = (item) => ({
    item,
    isTop: topIds.includes(item.id),
    topFull,
    isFav: favorites.includes(item.text),
    muted,
    onToggle: () => toggleItem(item.id),
    onTop: () => toggleTop(item.id),
    onFav: () => setFavorite(item.text, !favorites.includes(item.text)),
    onDelete: () => deleteItem(item.id),
  });

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-4 space-y-3">
      {/* 날짜 */}
      <div className="flex items-center justify-between">
        <div className="flex">
          <IconButton icon={ChevronLeft} label="이전 날" onClick={() => setDate(shiftDate(date, -1))} />
          <IconButton icon={CalendarDays} label="캘린더" onClick={() => setShowMonth(true)} />
        </div>
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
        <SectionTitle
          icon={Brain}
          lm={lm}
          right={
            <div className={`flex -my-2 -mr-1.5 text-xs font-semibold ${lm ? 'text-indigo-600' : 'text-violet-400'}`}>
              {[
                { icon: Bookmark, label: '즐겨찾기', onClick: () => setShowFavorites(true) },
                { icon: CalendarPlus, label: '일정', onClick: () => setShowEvent(true) },
                { icon: Repeat, label: '루틴', onClick: () => setShowRoutines(true) },
              ].map(({ icon: Icon, label, onClick }) => (
                <button key={label} onClick={onClick} className="flex items-center gap-1 px-1.5 min-h-11">
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          }
        >
          브레인 덤프
        </SectionTitle>
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
        favorites={favorites}
        pickCount={pickCount}
        lm={lm}
        onClose={() => setEditingSlot(null)}
        onSave={saveSlots}
        onClear={() => clearSlot(editingSlot)}
      />

      <FavoritesSheet
        open={showFavorites}
        favorites={favorites}
        addedTexts={new Set(day.brainDump.map((i) => i.text))}
        lm={lm}
        onClose={() => setShowFavorites(false)}
        onPick={addFavoriteToDump}
        onAdd={(text) => setFavorite(text, true)}
        onRemove={(text) => setFavorite(text, false)}
      />

      <EventSheet
        open={showEvent}
        defaultDate={date}
        slots={slots}
        getDay={getDay}
        lm={lm}
        onClose={() => setShowEvent(false)}
        onSave={addEvent}
      />

      <RoutinesSheet
        open={showRoutines}
        routines={routines}
        slots={slots}
        today={today}
        lm={lm}
        onClose={() => setShowRoutines(false)}
        onSave={saveRoutines}
      />

      <MonthSheet
        open={showMonth}
        date={date}
        today={today}
        days={days}
        lm={lm}
        onClose={() => setShowMonth(false)}
        onPick={(d) => { setDate(d); setShowMonth(false); }}
      />
    </div>
  );
}
