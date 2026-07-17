'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, SlidersHorizontal, Star, BookOpen,
  Settings2, LayoutGrid, Clock, Crown, Sparkles,
  Download, FileJson, FileText, Utensils, Calculator,
  ChevronRight, Wallet, GripVertical, X, ListTodo,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MealMenu } from '@/components/MealMenu';
import { Calculator as CalculatorView } from '@/components/Calculator';
import { TodoApp } from '@/components/TodoApp';
import { useNotes } from '@/hooks/useNotes';
import { useExport } from '@/hooks/useExport';
import { NoteCard } from '@/components/NoteCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { AddEditModal } from '@/components/AddEditModal';
import { EmptyState } from '@/components/EmptyState';
import { GenreManager } from '@/components/GenreManager';
import { TimelineView } from '@/components/TimelineView';
import { HallOfFame } from '@/components/HallOfFame';
import { Recommendations } from '@/components/Recommendations';
import { GenresProvider, useGenres } from '@/hooks/useGenres';

const SORT_OPTIONS = [
  { value: 'newest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'rating_desc', label: '평점 높은순' },
  { value: 'rating_asc', label: '평점 낮은순' },
  { value: 'title', label: '이름순' },
];

const VIEW_MODES = [
  { id: 'grid', label: '카드', icon: LayoutGrid },
  { id: 'timeline', label: '타임라인', icon: Clock },
  { id: 'hall', label: '명예의 전당', icon: Crown },
  { id: 'recs', label: '추천', icon: Sparkles },
];

const TOP_SECTIONS = [
  { id: 'eval',    label: '평가',    icon: Star },
  { id: 'todo',    label: '일정',    icon: ListTodo },
  { id: 'meal',    label: '식사메뉴', icon: Utensils },
  { id: 'calc',    label: '계산기',  icon: Calculator },
  { id: 'expense', label: '지출',    icon: Wallet },
];

// 상단 탭 순서를 기기에 저장해 다음 방문 시에도 동일한 순서로 보여주기 위한 키.
const SECTION_ORDER_KEY = 'kang-deok-boo-section-order';

// 마지막으로 선택한 장르(카테고리) 필터를 저장해 다음 실행 시 기본값으로 사용하기 위한 키.
const LAST_GENRE_KEY = 'kang-deok-boo-last-genre';

// 저장된 순서(id 배열)를 기준으로 TOP_SECTIONS를 재배열합니다.
// 새 탭이 추가된 경우를 대비해, 저장된 목록에 없는 항목은 뒤에 그대로 붙입니다.
function loadSectionOrder() {
  try {
    const stored = localStorage.getItem(SECTION_ORDER_KEY);
    if (stored) {
      const ids = JSON.parse(stored);
      if (Array.isArray(ids)) {
        const ordered = ids.map((id) => TOP_SECTIONS.find((s) => s.id === id)).filter(Boolean);
        const missing = TOP_SECTIONS.filter((s) => !ids.includes(s.id));
        return [...ordered, ...missing];
      }
    }
  } catch (e) {
    console.error('탭 순서 불러오기 실패:', e);
  }
  return TOP_SECTIONS;
}

// ─── 드래그 가능한 탭 아이템 ────────────────────────────────────────────────────
function SortableTab({ section, isActive, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const Icon = section.icon;

  const grip = (
    <span
      {...listeners}
      {...attributes}
      className="p-1 cursor-grab active:cursor-grabbing touch-none text-slate-300 hover:text-slate-400 shrink-0"
      aria-label="탭 순서 변경"
    >
      <GripVertical className="w-3 h-3" />
    </span>
  );

  if (section.id === 'expense') {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center">
        {grip}
        <Link
          href="/expense"
          className="flex items-center gap-1 px-2 py-2 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-all duration-150 -mb-px"
        >
          <Icon className="w-3.5 h-3.5" />
          {section.label}
        </Link>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      {grip}
      <button
        onClick={onClick}
        className={`flex items-center gap-1 px-2 py-2 text-sm font-semibold border-b-2 transition-all duration-150 -mb-px ${
          isActive
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        {section.label}
      </button>
    </div>
  );
}

// ─── 업데이트 내역 박스 ──────────────────────────────────────────────────────────
function UpdateHistoryBox() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="fixed bottom-[92px] right-3 sm:bottom-3 sm:right-3 z-20 max-w-[210px]">
      <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-xl shadow-md p-2.5 relative">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-1 right-1 p-0.5 rounded-md hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors"
          aria-label="닫기"
        >
          <X className="w-3 h-3" />
        </button>
        <p className="text-[10px] font-bold text-slate-700 mb-1 pr-4">[업데이트 내역]</p>
        <ul className="text-[10px] text-slate-500 space-y-0.5 leading-relaxed">
          <li>• '일정' 탭 추가: 할 일 목록/캘린더 뷰 지원.</li>
          <li>• 할 일 카테고리 직접 추가·수정·삭제 가능.</li>
          <li>• 카테고리 순서 변경 기능 추가.</li>
          <li>• 하단 '+' 버튼 평가 전용 변경.</li>
          <li>• 수정 화면에서 포스터 삭제 및 나무위키 링크 추가.</li>
          <li>• 헤더 평점 요약 정보, '평가' 탭에서만 노출.</li>
          <li>• 탭 순서 변경 시 기기에 저장되어 재방문 시에도 유지.</li>
          <li>• 할 일을 일일·주간·월간 유형으로 구분해 관리.</li>
        </ul>
      </div>
    </div>
  );
}

// ─── 실제 페이지 내용 (GenresProvider 안에서 useGenres 사용) ────────────────────
function HomeContent() {
  const { notes, loaded, addNote, updateNote, deleteNote } = useNotes();
  const { genres } = useGenres();
  const { exportJSON, exportCSV } = useExport(notes);

  const [topSection, setTopSection] = useState('eval');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showSort, setShowSort] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [genreManagerOpen, setGenreManagerOpen] = useState(false);
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [mealTriggerAdd, setMealTriggerAdd] = useState(false);
  const [todoTriggerAdd, setTodoTriggerAdd] = useState(false);
  const [topSections, setTopSections] = useState(TOP_SECTIONS);

  // 최초 마운트 시 저장된 탭 순서와 마지막 선택 장르를 불러옵니다 (localStorage는 클라이언트에서만 접근 가능).
  useEffect(() => {
    setTopSections(loadSectionOrder());
    try {
      const storedGenre = localStorage.getItem(LAST_GENRE_KEY);
      if (storedGenre) setSelectedGenre(storedGenre);
    } catch (e) {
      console.error('마지막 선택 장르 불러오기 실패:', e);
    }
  }, []);

  const handleSelectGenre = useCallback((genreId) => {
    setSelectedGenre(genreId);
    try {
      localStorage.setItem(LAST_GENRE_KEY, genreId);
    } catch (e) {
      console.error('마지막 선택 장르 저장 실패:', e);
    }
  }, []);

  const persistSectionOrder = useCallback((sections) => {
    try {
      localStorage.setItem(SECTION_ORDER_KEY, JSON.stringify(sections.map((s) => s.id)));
    } catch (e) {
      console.error('탭 순서 저장 실패:', e);
    }
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const handleSectionDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      setTopSections((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id);
        const newIndex = prev.findIndex((s) => s.id === over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        persistSectionOrder(next);
        return next;
      });
    }
  };

  const genreCounts = useMemo(() => {
    const counts = {};
    genres.forEach((g) => { counts[g.id] = 0; });
    notes.forEach((n) => {
      if (counts[n.genre] !== undefined) counts[n.genre]++;
      else if (counts[n.category] !== undefined) counts[n.category]++;
    });
    return counts;
  }, [notes, genres]);

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    if (selectedGenre !== 'all') {
      result = result.filter((n) => (n.genre || n.category) === selectedGenre);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.memo && n.memo.toLowerCase().includes(q)) ||
          (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'rating_desc': return (b.rating || 0) - (a.rating || 0);
        case 'rating_asc': return (a.rating || 0) - (b.rating || 0);
        case 'title': return a.title.localeCompare(b.title, 'ko');
        default: return 0;
      }
    });

    return result;
  }, [notes, selectedGenre, searchQuery, sort]);

  const handleOpenAdd = () => setAddPickerOpen(true);
  const handlePickEval = useCallback(() => {
    setAddPickerOpen(false);
    setEditingNote(null);
    setModalOpen(true);
  }, []);
  const handlePickMeal = useCallback(() => {
    setAddPickerOpen(false);
    setTopSection('meal');
    setMealTriggerAdd(true);
  }, []);
  const handlePickTodo = useCallback(() => {
    setAddPickerOpen(false);
    setTopSection('todo');
    setTodoTriggerAdd(true);
  }, []);
  const handleEdit = (note) => { setEditingNote(note); setModalOpen(true); };
  const handleSave = (data) => {
    if (editingNote?.id) updateNote(editingNote.id, data);
    else addNote(data);
  };
  const handleDelete = (id) => setDeleteConfirm(id);
  const confirmDelete = () => {
    if (deleteConfirm) { deleteNote(deleteConfirm); setDeleteConfirm(null); }
  };

  const avgRating = useMemo(() => {
    const rated = notes.filter((n) => n.rating > 0);
    if (!rated.length) return 0;
    return (rated.reduce((s, n) => s + n.rating, 0) / rated.length).toFixed(1);
  }, [notes]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* ─── 헤더 ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-600 shrink-0" />
                강덕부
              </h1>
              {/* 평점 요약 정보는 '평가' 탭 데이터이므로 해당 탭에서만 노출합니다. */}
              {topSection === 'eval' && notes.length > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  총 {notes.length}개 기록 · 평균{' '}
                  <Star className="w-3 h-3 inline fill-amber-400 text-amber-400" /> {avgRating}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* 내보내기 버튼 */}
              <div className="relative">
                <button
                  onClick={() => setShowExport((v) => !v)}
                  title="데이터 내보내기"
                  className={`p-2 rounded-xl border transition-colors ${
                    showExport
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200'
                  }`}
                >
                  <Download className="w-4 h-4" />
                </button>
                {showExport && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-40">
                    <button
                      onClick={() => { exportJSON(); setShowExport(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <FileJson className="w-4 h-4 text-indigo-500" />
                      JSON으로 저장
                    </button>
                    <button
                      onClick={() => { exportCSV(); setShowExport(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-emerald-500" />
                      CSV로 저장
                    </button>
                  </div>
                )}
              </div>

              {/* 장르 관리 버튼 */}
              <button
                onClick={() => setGenreManagerOpen(true)}
                title="장르 관리"
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
              >
                <Settings2 className="w-4 h-4" />
              </button>

              {/* 노트 추가 버튼 */}
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>
          </div>

          {/* 검색 + 정렬 (평가 섹션, 그리드/타임라인 뷰에서만) */}
          {topSection === 'eval' && (viewMode === 'grid' || viewMode === 'timeline') && (
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="검색..."
                  className="flex-1 bg-transparent focus:outline-none text-sm text-slate-700 placeholder:text-slate-400 min-w-0"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowSort((v) => !v)}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    showSort
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                {showSort && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-40">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSort(opt.value); setShowSort(false); }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          sort === opt.value
                            ? 'text-indigo-600 bg-indigo-50 font-medium'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 상단 분류 탭 + 뷰 모드 탭 + 장르 필터 */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex flex-col gap-2">
          {/* 상단 분류 탭 (드래그로 순서 변경 가능) */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={topSections.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-0 border-b border-slate-100 overflow-x-auto">
                {topSections.map((section) => (
                  <SortableTab
                    key={section.id}
                    section={section}
                    isActive={topSection === section.id}
                    onClick={() => setTopSection(section.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* 평가 섹션: 뷰 모드 전환 탭 */}
          {topSection === 'eval' && (
            <div className="flex gap-1 p-0.5 bg-slate-100 rounded-xl self-start">
              {VIEW_MODES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-150 ${
                    viewMode === id
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          )}

          {/* 장르 필터 탭 (평가 섹션, 그리드/타임라인 뷰에서만) */}
          {topSection === 'eval' && (viewMode === 'grid' || viewMode === 'timeline') && (
            <CategoryFilter
              selected={selectedGenre}
              onSelect={handleSelectGenre}
              counts={genreCounts}
            />
          )}
        </div>
      </header>

      {/* ─── 메인 콘텐츠 ──────────────────────────────────────────────────── */}
      <main className="flex-1 w-full">
        {topSection === 'meal' && (
          <MealMenu
            triggerAdd={mealTriggerAdd}
            onTriggerAddDone={() => setMealTriggerAdd(false)}
          />
        )}

        {topSection === 'todo' && (
          <TodoApp
            triggerAdd={todoTriggerAdd}
            onTriggerAddDone={() => setTodoTriggerAdd(false)}
          />
        )}

        {topSection === 'calc' && <CalculatorView />}

        {topSection === 'eval' && viewMode === 'grid' && (
          <div className="max-w-3xl mx-auto w-full px-4 py-6">
            {filteredNotes.length === 0 ? (
              <EmptyState filtered={notes.length > 0} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {topSection === 'eval' && viewMode === 'timeline' && (
          <TimelineView notes={filteredNotes} />
        )}

        {topSection === 'eval' && viewMode === 'hall' && (
          <HallOfFame notes={notes} />
        )}

        {topSection === 'eval' && viewMode === 'recs' && (
          <Recommendations notes={notes} />
        )}
      </main>

      {/* ─── FAB (모바일, '평가' 탭에서만 노출) ──────────────────────────────── */}
      {topSection === 'eval' && (
        <button
          onClick={() => { setEditingNote(null); setModalOpen(true); }}
          className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center z-30"
          aria-label="새 평가 추가"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* ─── 노트 추가·편집 모달 ──────────────────────────────────────────── */}
      {modalOpen && (
        <AddEditModal
          note={editingNote}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingNote(null); }}
        />
      )}

      {/* ─── 장르 관리 모달 ───────────────────────────────────────────────── */}
      {genreManagerOpen && (
        <GenreManager onClose={() => setGenreManagerOpen(false)} />
      )}

      {/* ─── 카테고리 선택 팝업 ───────────────────────────────────────────── */}
      {addPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setAddPickerOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddPickerOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <h3 className="text-base font-bold text-slate-800">어디에 추가할까요?</h3>
              <p className="text-xs text-slate-400 mt-0.5">카테고리를 선택하세요</p>
            </div>
            <div className="px-3 pb-4 flex flex-col gap-1">
              <button
                onClick={handlePickEval}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-indigo-50 text-left transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <Star className="w-4.5 h-4.5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">평가 추가</p>
                  <p className="text-xs text-slate-400">영화·책·애니 등 평가 노트</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
              </button>
              <button
                onClick={handlePickTodo}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-violet-50 text-left transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <ListTodo className="w-4.5 h-4.5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">할 일 추가</p>
                  <p className="text-xs text-slate-400">일정 및 To-Do 항목 등록</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-400 transition-colors" />
              </button>
              <button
                onClick={handlePickMeal}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-orange-50 text-left transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <Utensils className="w-4.5 h-4.5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">식사메뉴 추가</p>
                  <p className="text-xs text-slate-400">커스텀 메뉴 직접 추가</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 업데이트 내역 정보 박스 ──────────────────────────────────────── */}
      <UpdateHistoryBox />

      {/* ─── 노트 삭제 확인 다이얼로그 ────────────────────────────────────── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-800 mb-2">노트 삭제</h3>
            <p className="text-sm text-slate-500 mb-6">이 노트를 삭제할까요? 되돌릴 수 없어요.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 루트 컴포넌트: GenresProvider로 감싸서 Context 제공 ───────────────────────
export default function HomePage() {
  return (
    <GenresProvider>
      <HomeContent />
    </GenresProvider>
  );
}
