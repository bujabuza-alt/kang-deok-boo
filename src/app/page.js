'use client';
import { useState, useMemo, useCallback } from 'react';
import {
  Plus, Search, SlidersHorizontal, Star, BookOpen,
  Settings2, LayoutGrid, Clock, Crown, Sparkles,
  Download, FileJson, FileText, Utensils, Calculator,
  ChevronRight,
} from 'lucide-react';
import { MealMenu } from '@/components/MealMenu';
import { Calculator as CalculatorView } from '@/components/Calculator';
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
  { id: 'eval', label: '평가', icon: Star },
  { id: 'meal', label: '식사메뉴', icon: Utensils },
  { id: 'calc', label: '계산기', icon: Calculator },
];

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
              {notes.length > 0 && (
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
          {/* 상단 분류 탭 (평가 / 식사메뉴) */}
          <div className="flex gap-1 border-b border-slate-100">
            {TOP_SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTopSection(id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150 -mb-px ${
                  topSection === id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

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
              onSelect={setSelectedGenre}
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

      {/* ─── FAB (모바일) ─────────────────────────────────────────────────── */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center z-30"
        aria-label="새 노트 추가"
      >
        <Plus className="w-6 h-6" />
      </button>

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
