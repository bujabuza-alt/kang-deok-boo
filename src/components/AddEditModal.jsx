'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/AddEditModal.jsx
// 노트 추가·편집 모달 컴포넌트.
//
// 변경 사항:
// ① 슬라이더 정렬 CSS Grid 적용 → 라벨·슬라이더·값이 완벽하게 정렬됨
// ② 포스터 이미지 검색 패널 추가 (PosterSearch 컴포넌트 통합)
// ③ note.posterUrl 필드 저장 지원
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react';
import { X, Tag, Plus, BarChart2, Hexagon, Pencil, Trash2, Crown } from 'lucide-react';
import { useGenres } from '@/hooks/useGenres';
import { StarRating } from './StarRating';
import { ScoreVisualization } from './ScoreVisualization';

// 기본 폼 상태 (장르 ID 자리는 아래에서 동적으로 채움)
const makeDefaultForm = (firstGenreId) => ({
  title: '',
  genre: firstGenreId,
  rating: 0,
  date: new Date().toISOString().split('T')[0],
  memo: '',
  tags: [],
  scores: {},
  vizType: 'radar',
  evalItems: null,
  namuwikiUrl: '',
  masterpiece: false,
});

// ─── 세부 평가 항목 편집 행 ────────────────────────────────────────────────────
function EvalItemRow({ item, index, onRename, onDelete, total, color }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item);

  // 외부에서 item이 바뀌면 내부 값도 업데이트
  useEffect(() => { setVal(item); }, [item]);

  const commit = () => {
    const trimmed = val.trim();
    if (trimmed && trimmed !== item) onRename(index, trimmed);
    else setVal(item);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 group">
      {editing ? (
        <>
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setVal(item); setEditing(false); }
            }}
            className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="button" onClick={commit}
            className="p-1 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-xs font-medium px-2">
            확인
          </button>
        </>
      ) : (
        <>
          <span
            onClick={() => setEditing(true)}
            className="flex-1 text-xs text-slate-600 text-right w-14 shrink-0 cursor-pointer hover:text-indigo-600 transition-colors truncate"
            title={`클릭하여 '${item}' 이름 수정`}
          >
            {item}
          </span>
        </>
      )}

      {!editing && (
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button type="button" onClick={() => setEditing(true)}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors"
            aria-label="이름 수정">
            <Pencil className="w-3 h-3" />
          </button>
          <button type="button" onClick={() => onDelete(index)} disabled={total <= 1}
            className="p-1 rounded-md hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="항목 삭제">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 메인 모달 ────────────────────────────────────────────────────────────────
export function AddEditModal({ note, onSave, onClose }) {
  const { genres, getGenreById } = useGenres();

  // 첫 번째 장르 ID (동적)
  const firstGenreId = genres[0]?.id || 'other';

  const [form, setForm] = useState(makeDefaultForm(firstGenreId));
  const [tagInput, setTagInput] = useState('');
  const [newItemInput, setNewItemInput] = useState('');
  const [showItemEdit, setShowItemEdit] = useState(false);

  // note prop이 바뀔 때 폼 초기화
  useEffect(() => {
    if (note) {
      // 구버전 노트는 category, 신버전은 genre 필드 사용
      const genreId = note.genre || note.category || firstGenreId;
      const genre = getGenreById(genreId);
      setForm({
        title: note.title || '',
        genre: genreId,
        rating: note.rating || 0,
        date: note.date || new Date().toISOString().split('T')[0],
        memo: note.memo || '',
        tags: note.tags || [],
        scores: note.scores || {},
        vizType: note.vizType || 'radar',
        evalItems: note.evalItems || [...(genre.defaultItems || [])],
        namuwikiUrl: note.namuwikiUrl || '',
        masterpiece: note.masterpiece || false,
      });
    } else {
      const defaultGenre = getGenreById(firstGenreId);
      setForm({
        ...makeDefaultForm(firstGenreId),
        date: new Date().toISOString().split('T')[0],
        evalItems: [...(defaultGenre.defaultItems || [])],
      });
    }
    setTagInput('');
    setNewItemInput('');
    setShowItemEdit(false);
  }, [note, firstGenreId]);

  // 폼 값 업데이트 헬퍼
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // 현재 선택된 장르 객체
  const currentGenre = useMemo(
    () => getGenreById(form.genre),
    [form.genre, getGenreById]
  );

  // 현재 유효한 evalItems (폼에 있는 값 우선, 없으면 장르 기본값)
  const evalItems = useMemo(
    () => form.evalItems || currentGenre.defaultItems || [],
    [form.evalItems, currentGenre.defaultItems]
  );

  // 장르 변경 시: 새 장르의 기본 evalItems를 폼에 적용
  const handleGenreChange = (genreId) => {
    const newGenre = getGenreById(genreId);
    set('genre', genreId);
    // 장르가 바뀌면 새 장르의 defaultItems를 초기값으로 설정
    // (기존에 입력한 점수도 초기화하여 혼선 방지)
    setForm((f) => ({
      ...f,
      genre: genreId,
      evalItems: [...(newGenre.defaultItems || [])],
      scores: {}, // 항목이 달라지면 점수도 초기화
    }));
  };

  // 세부 평가 평균 점수
  const avgScore = useMemo(() => {
    const values = evalItems.map((item) => form.scores?.[item] ?? 0);
    const filled = values.filter((v) => v > 0);
    if (!filled.length) return null;
    return (values.reduce((s, v) => s + v, 0) / values.length).toFixed(1);
  }, [evalItems, form.scores]);

  const setScore = (item, value) => {
    set('scores', { ...form.scores, [item]: Number(value) });
  };

  // ─── 태그 관리 ────────────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !form.tags.includes(t)) {
      set('tags', [...form.tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => set('tags', form.tags.filter((t) => t !== tag));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // ─── 세부 평가 항목 관리 ──────────────────────────────────────────────────
  const handleAddEvalItem = () => {
    const trimmed = newItemInput.trim();
    if (!trimmed || evalItems.includes(trimmed)) return;
    set('evalItems', [...evalItems, trimmed]);
    setNewItemInput('');
  };

  const handleRenameEvalItem = (index, newName) => {
    const updated = evalItems.map((it, i) => (i === index ? newName : it));
    // 이름이 바뀐 항목의 점수도 이전 이름에서 새 이름으로 이전
    const oldName = evalItems[index];
    const oldScore = form.scores?.[oldName];
    const newScores = { ...form.scores };
    if (oldScore !== undefined) {
      delete newScores[oldName];
      newScores[newName] = oldScore;
    }
    setForm((f) => ({ ...f, evalItems: updated, scores: newScores }));
  };

  const handleDeleteEvalItem = (index) => {
    const removed = evalItems[index];
    const updated = evalItems.filter((_, i) => i !== index);
    const newScores = { ...form.scores };
    delete newScores[removed]; // 삭제된 항목의 점수도 제거
    setForm((f) => ({ ...f, evalItems: updated, scores: newScores }));
  };

  // ─── 제출 ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    // genre 필드와 하위 호환을 위한 category 필드 모두 저장
    onSave({ ...form, category: form.genre });
    onClose();
  };

  const isEdit = Boolean(note?.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 패널 */}
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? '노트 수정' : '새 노트 추가'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 스크롤 가능한 폼 */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex flex-col gap-5 p-6">

          {/* ── 제목 ────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              이름 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="무엇을 기록할까요?"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* ── 나무위키 링크 ──────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">나무위키 링크</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.namuwikiUrl}
                onChange={(e) => set('namuwikiUrl', e.target.value)}
                placeholder="나무위키 링크를 입력해 주세요."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder:text-slate-400 text-sm"
              />
              <button
                type="button"
                onClick={() => { if (form.namuwikiUrl) navigator.clipboard?.writeText(form.namuwikiUrl); }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 text-sm font-medium transition-colors shrink-0"
              >
                복사
              </button>
            </div>
          </div>

          {/* ── 장르 선택 (구 '카테고리') ─────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">장르</label>
            <div className="grid grid-cols-4 gap-2">
              {genres.map((genre) => {
                const isSelected = form.genre === genre.id;
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => handleGenreChange(genre.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 text-xs font-medium transition-all duration-150 ${
                      isSelected
                        ? `${genre.activeBg} ${genre.activeText} ${genre.activeBorder} shadow-md scale-[1.04]`
                        : `bg-white text-slate-500 border-slate-200 ${genre.hoverBg} ${genre.hoverBorder} hover:text-slate-700 hover:scale-[1.02]`
                    }`}
                  >
                    <span className="text-xl leading-none">{genre.emoji}</span>
                    <span className="truncate w-full text-center">{genre.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 종합 평점 ───────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              종합 평점
              {form.rating > 0 && (
                <span className="ml-2 text-amber-500 font-semibold">{form.rating}점</span>
              )}
            </label>
            <StarRating value={form.rating} onChange={(v) => set('rating', v)} size="lg" />
          </div>

          {/* ── 명작 표시 ───────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => set('masterpiece', !form.masterpiece)}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Crown className="w-4 h-4 text-yellow-500" />
              명작 등록
              <span className="text-xs text-slate-400 font-normal">명예의 전당에 등록</span>
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); set('masterpiece', !form.masterpiece); }}
              role="switch"
              aria-checked={form.masterpiece}
              className={`relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 ${
                form.masterpiece ? 'bg-yellow-400' : 'bg-slate-200'
              }`}
              aria-label="명작 토글"
            >
              <span
                className={`absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  form.masterpiece ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* ── 세부 평가 ───────────────────────────────────────────────── */}
          <div>
            {/* 섹션 헤더: 평균 + 차트 타입 토글 */}
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm font-medium text-slate-700">세부 평가</label>
                {avgScore !== null && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: currentGenre.chartColor + '22', color: currentGenre.chartColor }}
                  >
                    평균 {avgScore} / 10
                  </span>
                )}
                {/* 세부 항목 편집 토글 버튼 */}
                <button
                  type="button"
                  onClick={() => setShowItemEdit((v) => !v)}
                  className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-colors ${
                    showItemEdit
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                  }`}
                  title="세부 평가 항목 편집"
                >
                  <Pencil className="w-3 h-3" />
                  항목 편집
                </button>
              </div>

              {/* 차트 타입 토글 */}
              <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => set('vizType', 'radar')}
                  title="레이더 차트"
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all duration-150 ${
                    form.vizType === 'radar'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Hexagon className="w-3.5 h-3.5" />
                  레이더
                </button>
                <button
                  type="button"
                  onClick={() => set('vizType', 'bars')}
                  title="막대 그래프"
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all duration-150 ${
                    form.vizType === 'bars'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  막대
                </button>
              </div>
            </div>

            {/* 항목 편집 패널 (토글) */}
            {showItemEdit && (
              <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-2 font-medium">
                  세부 평가 항목 편집 — 항목 이름을 클릭해 수정하세요
                </p>
                <div className="flex flex-col gap-1.5 mb-3">
                  {evalItems.map((item, i) => (
                    <EvalItemRow
                      key={`${item}-${i}`}
                      item={item}
                      index={i}
                      onRename={handleRenameEvalItem}
                      onDelete={handleDeleteEvalItem}
                      total={evalItems.length}
                      color={currentGenre.chartColor}
                    />
                  ))}
                </div>
                {/* 새 항목 추가 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItemInput}
                    onChange={(e) => setNewItemInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEvalItem(); } }}
                    placeholder="새 항목 이름..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddEvalItem}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    추가
                  </button>
                </div>
              </div>
            )}

            {/* 라이브 프리뷰 (평균 점수가 있을 때만 표시) */}
            {avgScore !== null && (
              <div className="mb-4 p-3 bg-slate-50 rounded-xl flex justify-center">
                <ScoreVisualization
                  items={evalItems}
                  scores={form.scores}
                  vizType={form.vizType}
                  color={currentGenre.chartColor}
                  size={160}
                  compact={false}
                  showAvg={false}
                />
              </div>
            )}

            {/* 점수 슬라이더 — CSS Grid로 완벽 정렬 */}
            <div className="flex flex-col gap-2.5">
              {evalItems.map((item) => {
                const score = form.scores?.[item] ?? 0;
                return (
                  <div
                    key={item}
                    className="grid items-center gap-3"
                    style={{ gridTemplateColumns: '5rem 1fr 1.75rem' }}
                  >
                    {/* 항목 이름 — 오른쪽 정렬, 고정 너비 */}
                    <span
                      className="text-xs text-slate-600 text-right truncate leading-none"
                      title={item}
                    >
                      {item}
                    </span>
                    {/* 슬라이더 — 나머지 공간 전부 */}
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={score}
                      onChange={(e) => setScore(item, e.target.value)}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer block"
                      style={{ accentColor: currentGenre.chartColor }}
                    />
                    {/* 점수 — 고정 너비, 오른쪽 정렬 */}
                    <span
                      className="text-sm font-bold text-right tabular-nums leading-none"
                      style={{ color: score > 0 ? currentGenre.chartColor : '#94a3b8' }}
                    >
                      {score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 날짜 ────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">날짜</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
            />
          </div>

          {/* ── 메모 ────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => set('memo', e.target.value)}
              placeholder="느낌, 특징, 다음에 기억할 것들..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* ── 태그 ────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">태그</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="태그 입력 후 Enter"
                  className="flex-1 focus:outline-none text-sm text-slate-800 placeholder:text-slate-400 min-w-0"
                />
              </div>
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {/* 태그 목록: 추가·삭제 시 즉시 갱신 */}
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-indigo-900 transition-colors"
                      aria-label={`태그 ${tag} 제거`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── 저장·취소 버튼 ──────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {isEdit ? '저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
