'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useExport.js
// 데이터 내보내기 — CSV 및 JSON 형식으로 전체 노트 다운로드 제공
// ──────────────────────────────────────────────────────────────────────────────
import { useCallback } from 'react';

// CSV 셀 값 이스케이프 (콤마, 줄바꿈, 큰따옴표 처리)
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 파일 다운로드 트리거
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useExport(notes) {
  const exportJSON = useCallback(() => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const content = JSON.stringify(notes, null, 2);
    downloadFile(`kang-deok-boo_${timestamp}.json`, content, 'application/json;charset=utf-8');
  }, [notes]);

  const exportCSV = useCallback(() => {
    if (!notes.length) return;

    // 모든 노트에서 등장하는 evalItem 목록 수집 (헤더용)
    const allEvalItems = [
      ...new Set(notes.flatMap((n) => n.evalItems || [])),
    ];

    // CSV 헤더
    const headers = [
      'ID',
      '제목',
      '장르',
      '별점',
      '날짜',
      '태그',
      '메모',
      '시각화 타입',
      '포스터 URL',
      '명작 여부',
      ...allEvalItems.map((item) => `[평가] ${item}`),
      '생성일',
      '수정일',
    ];

    // CSV 행 생성
    const rows = notes.map((note) => [
      note.id,
      note.title,
      note.genre || note.category || '',
      note.rating || 0,
      note.date || '',
      (note.tags || []).join(' | '),
      note.memo || '',
      note.vizType || 'radar',
      note.posterUrl || '',
      note.masterpiece ? '명작' : '',
      ...allEvalItems.map((item) => note.scores?.[item] ?? ''),
      note.createdAt || '',
      note.updatedAt || '',
    ]);

    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ];

    // BOM 추가 (Excel에서 한글 깨짐 방지)
    const bom = '\uFEFF';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadFile(
      `kang-deok-boo_${timestamp}.csv`,
      bom + csvLines.join('\n'),
      'text/csv;charset=utf-8'
    );
  }, [notes]);

  return { exportJSON, exportCSV };
}
