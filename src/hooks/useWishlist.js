'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useWishlist.js
// '위시리스트' 탭의 쇼핑 위시리스트 항목을 localStorage에 저장하고 CRUD를 제공합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { pushKey } from '@/lib/sync';
import { useSyncListener } from '@/hooks/useSyncListener';

const STORAGE_KEY = 'kang-deok-boo-wishlist';

export function useWishlist() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setItems(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error('Failed to load wishlist:', e);
    }
  }, []);

  useEffect(() => {
    reload();
    setLoaded(true);
  }, [reload]);

  useSyncListener(STORAGE_KEY, reload);

  const persist = useCallback((next) => {
    setItems(next);
    try {
      const json = JSON.stringify(next);
      localStorage.setItem(STORAGE_KEY, json);
      pushKey(STORAGE_KEY, json);
    } catch (e) {
      console.error('Failed to save wishlist:', e);
    }
  }, []);

  const addItem = useCallback(
    (data) => {
      const item = {
        name: '',
        price: null,
        url: '',
        memo: '',
        priority: 'medium',
        purchased: false,
        purchasedAt: null,
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
      };
      persist([item, ...items]);
      return item;
    },
    [items, persist]
  );

  const updateItem = useCallback(
    (id, data) => {
      persist(items.map((it) => (it.id === id ? { ...it, ...data } : it)));
    },
    [items, persist]
  );

  const deleteItem = useCallback(
    (id) => {
      persist(items.filter((it) => it.id !== id));
    },
    [items, persist]
  );

  const togglePurchased = useCallback(
    (id) => {
      persist(
        items.map((it) =>
          it.id === id ? { ...it, purchased: !it.purchased, purchasedAt: !it.purchased ? new Date().toISOString() : null } : it
        )
      );
    },
    [items, persist]
  );

  return { items, loaded, addItem, updateItem, deleteItem, togglePurchased };
}
