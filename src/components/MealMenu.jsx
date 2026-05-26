'use client';
import { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Search, Shuffle, X } from 'lucide-react';

const STORAGE_KEY = 'gangdeokbu-meal-menu-custom';

const PRESET_MENUS = [
  '돈까스 김치나베', '콩국수', '오므라이스', '미트볼 토마토 파스타',
  '브런치플레터', '수제칼국수', '불고기', '김치짜글이', '마제덮밥',
  '카츠동', '볶음밥', '된장찌개', '두부부침', '김치찌개', '치킨 리소토',
  '부찌', '치킨마요', '버섯들깨전골', '치킨카레', '애호박 스페셜 파스타',
  '카레우동', '돈까스', '새송이 튀김', '비빔국수', '와사비크림파스타',
  '마파두부', '치즈떡갈비', '잔치국수', '갈치구이', '새우관자 크림 파스타',
  '생선조림', '돼지 불고기', '북엇국', '크림스튜', '미역국', '잡채',
  '들깨미역국', '소고기 버섯크림 리소토', '베이크드 토마토 리소토',
  '콩나물 소고기 뭇국', '계란말이', '베이크드 빈 파스타', '김치찌개 돈까스',
  '김참치 파스타', '오일 육포 샐러드', '뭇국', '여주볶음', '김치볶음밥',
  '카레야끼소바', '스팸 비빔면', '참치크림파스타', '양지 새송이 크림 파스타',
  '오므라이스말이', '육회 비빔밥', '뚝배기 라따뚜이 파스타', '오야코동',
  '영양밥', '치커리 파스타', '김밥', '떡볶이', '부대찌개', '카레',
  '규동', '만둣국', '우동', '국수', '재첩 파스타', '관자 크림 파스타',
  '새우 오일 파스타', '엔초비 파스타', '김 파스타', '설렁탕', '돼지갈비',
  '쫄면', '제육볶음',
];

function useCustomMenus() {
  const [custom, setCustom] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCustom(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, []);

  const persist = useCallback((next) => {
    setCustom(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const add = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    persist([...custom, trimmed]);
  }, [custom, persist]);

  const remove = useCallback((name) => {
    persist(custom.filter((n) => n !== name));
  }, [custom, persist]);

  return { custom, loaded, add, remove };
}

function RandomPicker({ menus }) {
  const [picked, setPicked] = useState(null);
  const [spinning, setSpinning] = useState(false);

  const pick = () => {
    if (spinning || menus.length === 0) return;
    setPicked(null);
    setSpinning(true);
    setTimeout(() => {
      const i = Math.floor(Math.random() * menus.length);
      setPicked(menus[i]);
      setSpinning(false);
    }, 650);
  };

  return (
    <button
      onClick={pick}
      className={`w-full rounded-2xl border-2 p-5 flex flex-col items-center gap-2 transition-all duration-200 select-none ${
        spinning
          ? 'border-indigo-300 bg-indigo-50 cursor-wait'
          : picked
          ? 'border-indigo-500 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
          : 'border-dashed border-slate-300 hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98]'
      }`}
    >
      <div className="flex items-center gap-2">
        <Shuffle
          className={`w-5 h-5 transition-colors ${
            spinning ? 'animate-spin text-indigo-500' : picked ? 'text-white' : 'text-slate-400'
          }`}
        />
        <span
          className={`font-bold text-base transition-colors ${
            spinning ? 'text-indigo-600' : picked ? 'text-white' : 'text-slate-500'
          }`}
        >
          뭐 먹지?
        </span>
      </div>

      {spinning && (
        <span className="text-sm text-indigo-500 animate-pulse">고르는 중...</span>
      )}
      {picked && !spinning && (
        <span className="text-xl font-bold text-white tracking-tight">{picked}</span>
      )}
      {!picked && !spinning && (
        <span className="text-xs text-slate-400">누르면 랜덤으로 골라줘요</span>
      )}
    </button>
  );
}

export function MealMenu() {
  const { custom, loaded, add, remove } = useCustomMenus();
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const allMenus = [
    ...PRESET_MENUS,
    ...custom.filter((c) => !PRESET_MENUS.includes(c)),
  ];

  const filtered = search.trim()
    ? allMenus.filter((m) => m.includes(search.trim()))
    : allMenus;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim() || allMenus.includes(newName.trim())) return;
    add(newName.trim());
    setNewName('');
    setAdding(false);
  };

  if (!loaded) return null;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
      <RandomPicker menus={allMenus} />

      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${allMenus.length}개 메뉴 검색...`}
            className="flex-1 bg-transparent focus:outline-none text-sm text-slate-700 placeholder:text-slate-400 min-w-0"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => { setAdding(true); setSearch(''); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="새 메뉴 이름"
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-300 text-slate-800"
          />
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName(''); }}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={!newName.trim() || allMenus.includes(newName.trim())}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            저장
          </button>
        </form>
      )}

      <div className="text-xs text-slate-400 px-0.5">
        {search.trim() ? `${filtered.length}개 검색됨` : `전체 ${allMenus.length}개`}
        {custom.filter((c) => !PRESET_MENUS.includes(c)).length > 0 &&
          ` · 직접 추가 ${custom.filter((c) => !PRESET_MENUS.includes(c)).length}개`}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-300">
          <Search className="w-10 h-10 mb-3" />
          <p className="text-sm text-slate-400">검색 결과가 없어요</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 pb-4">
          {filtered.map((name) => {
            const isCustom = custom.includes(name) && !PRESET_MENUS.includes(name);
            return (
              <div
                key={name}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  isCustom
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <span>{name}</span>
                {isCustom && (
                  <button
                    onClick={() => remove(name)}
                    className="ml-0.5 text-indigo-300 hover:text-indigo-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
