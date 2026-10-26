// ──────────────────────────────────────────────────────────────────────────────
// components/navItems.js
// 하단 탭바에 올릴 수 있는 모든 화면의 아이콘·이름 목록.
// 주 화면(홈/지출/타임박스) + '더보기' 안의 기능들로 구성됩니다.
// ──────────────────────────────────────────────────────────────────────────────
import {
  Home, Wallet, MoreHorizontal, CalendarClock,
  Utensils, StickyNote, ShoppingBag, Dumbbell, Settings,
} from 'lucide-react';

export const MAIN_TABS = [
  { id: 'home', icon: Home, label: '홈' },
  { id: 'expense', icon: Wallet, label: '지출' },
  { id: 'timebox', icon: CalendarClock, label: '타임박스' },
];

// 홈 대시보드의 바로가기 그리드와 '더보기' 화면도 이 목록을 함께 사용합니다.
export const MORE_FEATURES = [
  { id: 'meal', label: '식사메뉴', icon: Utensils },
  { id: 'memo', label: '메모', icon: StickyNote },
  { id: 'wishlist', label: '위시리스트', icon: ShoppingBag },
  { id: 'workout', label: '운동', icon: Dumbbell },
  { id: 'settings', label: '설정', icon: Settings },
];

export const MORE_TAB = { id: 'more', icon: MoreHorizontal, label: '더보기' };

export const NAV_ITEMS = [...MAIN_TABS, ...MORE_FEATURES];
export const NAV_ITEM_IDS = NAV_ITEMS.map((t) => t.id);
