'use client';
import { useState, useMemo } from 'react';
import { Search, X, Trash2, Pencil, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { fmt } from '@/expense/utils';
import { useTheme } from '@/expense/context/ThemeContext';

const toIso = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const monthRange = (monthsAgo) => {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end   = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return { from: toIso(start), to: toIso(end) };
};

const MONTH_PRESETS = [
  { label: '이번 달', ago: 0 },
  { label: '지난 달', ago: 1 },
  { label: '2달 전',  ago: 2 },
  { label: '3달 전',  ago: 3 },
];

const fmtMonth = (key) => {
  const [y, m] = key.split('-');
  return `${y}년 ${parseInt(m)}월`;
};

export default function SearchTab({ expenses, paymentMethods, onDeleteExpense, onEditExpense }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  const [query,        setQuery]        = useState('');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [filterPM,     setFilterPM]     = useState('전체');
  const [activePreset, setActivePreset] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [sortOrder,    setSortOrder]    = useState('desc');

  const applyMonthPreset = (ago) => {
    const { from, to } = monthRange(ago);
    setDateFrom(from);
    setDateTo(to);
    setActivePreset(ago);
  };

  const handleDateFromChange = (val) => { setDateFrom(val); setActivePreset(null); };
  const handleDateToChange   = (val) => { setDateTo(val);   setActivePreset(null); };

  const results = useMemo(() => {
    const q   = query.trim().toLowerCase();
    const pms = filterPM === '전체' ? null : filterPM;

    return expenses
      .filter(e => {
        if (q && !e.name.toLowerCase().includes(q)) return false;
        if (dateFrom && e.date < dateFrom)           return false;
        if (dateTo   && e.date > dateTo)             return false;
        if (pms      && e.paymentMethod !== pms)     return false;
        return true;
      })
      .sort((a, b) =>
        sortOrder === 'desc'
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date)
      );
  }, [expenses, query, dateFrom, dateTo, filterPM, sortOrder]);

  const total = useMemo(() => results.reduce((s, e) => s + e.amount, 0), [results]);

  const groupedResults = useMemo(() => {
    const map = {};
    results.forEach(e => {
      const key = e.date.slice(0, 7);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return Object.entries(map).sort((a, b) =>
      sortOrder === 'desc' ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0])
    );
  }, [results, sortOrder]);

  const hasFilters = Boolean(query || dateFrom || dateTo || filterPM !== '전체');

  const clearFilters = () => {
    setQuery('');
    setDateFrom('');
    setDateTo('');
    setFilterPM('전체');
    setActivePreset(null);
  };

  const cardCls  = `rounded-2xl ${lm ? 'bg-white shadow-sm border border-slate-100' : 'bg-gray-900'}`;
  const inputCls = `block w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors appearance-none ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900 placeholder-slate-300' : 'bg-gray-800 border-gray-700 focus:border-violet-500 text-white placeholder-gray-600'}`;
  const labelCls = `block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${lm ? 'text-slate-400' : 'text-gray-500'}`;
  const itemCls  = `flex items-center justify-between p-3 rounded-xl ${lm ? 'bg-slate-50 border border-slate-100' : 'bg-gray-800'}`;

  return (
    <div className="space-y-4">
      <section className={`${cardCls} overflow-hidden`}>
        <button
          onClick={() => setIsFilterOpen(o => !o)}
          className={`w-full px-4 py-3.5 flex items-center justify-between ${lm ? 'hover:bg-slate-50' : ''}`}
        >
          <h2 className={`text-sm font-bold flex items-center gap-2 ${lm ? 'text-slate-800' : 'text-gray-200'}`}>
            <Search className={`w-4 h-4 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
            지출 검색
          </h2>
          {isFilterOpen
            ? <ChevronUp   className={`w-4 h-4 ${lm ? 'text-slate-400' : 'text-gray-500'}`} />
            : <ChevronDown className={`w-4 h-4 ${lm ? 'text-slate-400' : 'text-gray-500'}`} />}
        </button>

        {isFilterOpen && (
          <div className={`px-4 pb-4 space-y-3 border-t ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
            <div className="pt-3">
              <label className={labelCls}>카테고리</label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="검색어를 입력하세요"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>기간</label>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {MONTH_PRESETS.map(({ label, ago }) => (
                  <button
                    key={ago}
                    onClick={() => applyMonthPreset(ago)}
                    className={`
                      text-[11px] font-semibold px-1 py-1.5 rounded-lg border transition-all text-center
                      ${activePreset === ago
                        ? lm ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-violet-600 border-violet-500 text-white'
                        : lm ? 'bg-white border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-violet-600 hover:text-violet-300'}
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className={`block text-[9px] font-semibold uppercase tracking-wider mb-1 ${lm ? 'text-slate-400' : 'text-gray-600'}`}>
                    시작일
                  </span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => handleDateFromChange(e.target.value)}
                    style={{ colorScheme: lm ? 'light' : 'dark' }}
                    className={inputCls}
                  />
                </div>
                <div>
                  <span className={`block text-[9px] font-semibold uppercase tracking-wider mb-1 ${lm ? 'text-slate-400' : 'text-gray-600'}`}>
                    종료일
                  </span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => handleDateToChange(e.target.value)}
                    style={{ colorScheme: lm ? 'light' : 'dark' }}
                    className={inputCls}
                  />
                </div>
              </div>
              {dateFrom && dateTo && (
                <p className={`text-[10px] mt-1.5 pl-0.5 ${lm ? 'text-slate-400' : 'text-gray-600'}`}>
                  {dateFrom} ~ {dateTo}
                </p>
              )}
            </div>

            <div>
              <label className={labelCls}>결제 수단</label>
              <select
                value={filterPM}
                onChange={e => setFilterPM(e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="전체">전체</option>
                {paymentMethods.map(pm => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className={`flex items-center gap-1.5 text-xs transition-colors ${lm ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <X className="w-3 h-3" />
                필터 초기화
              </button>
            )}
          </div>
        )}
      </section>

      <section className={`${cardCls} p-4 space-y-3`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${lm ? 'text-slate-500' : 'text-gray-400'}`}>
            검색 결과 {results.length}건
          </span>
          <div className="flex items-center gap-3">
            {results.length > 0 && (
              <span className="text-xs font-bold text-rose-500">합계 ₩{fmt(total)}</span>
            )}
            <button
              onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
              className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${lm ? 'text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50' : 'text-gray-400 hover:text-violet-400 bg-gray-800'}`}
            >
              {sortOrder === 'desc'
                ? <><ArrowDown className="w-3 h-3" />느린순</>
                : <><ArrowUp   className="w-3 h-3" />빠른순</>}
            </button>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">🔍</div>
            <p className={`text-sm ${lm ? 'text-slate-400' : 'text-gray-600'}`}>
              {hasFilters ? '검색 결과가 없습니다' : '검색어 또는 필터를 입력하세요'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedResults.map(([monthKey, items]) => (
              <div key={monthKey}>
                <div className={`flex items-center justify-between mb-2 pb-1.5 border-b ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
                  <span className={`text-[11px] font-bold ${lm ? 'text-indigo-600' : 'text-violet-400'}`}>
                    {fmtMonth(monthKey)}
                  </span>
                  <span className={`text-[10px] font-semibold ${lm ? 'text-slate-400' : 'text-gray-500'}`}>
                    ₩{fmt(items.reduce((s, e) => s + e.amount, 0))}
                  </span>
                </div>
                <ul className="space-y-2">
                  {items.map(e => (
                    <li key={e.id} className={itemCls}>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${lm ? 'text-slate-800' : 'text-gray-100'}`}>{e.name}</p>
                        <p className={`text-[10px] mt-0.5 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>
                          {e.date} · {e.paymentMethod}
                        </p>
                        {e.memo && (
                          <p className={`text-[10px] mt-0.5 truncate ${lm ? 'text-slate-300' : 'text-gray-600'}`}>{e.memo}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <span className="text-sm font-bold text-rose-500">₩{fmt(e.amount)}</span>
                        {onEditExpense && (
                          <button
                            onClick={() => onEditExpense(e)}
                            className={`transition-colors ${lm ? 'text-slate-300 hover:text-indigo-600' : 'text-gray-600 hover:text-violet-400'}`}
                            aria-label="편집"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteExpense(e.id)}
                          className={`transition-colors ${lm ? 'text-slate-300 hover:text-red-500' : 'text-gray-700 hover:text-red-400'}`}
                          aria-label="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
