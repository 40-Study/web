/**
 * Cart store — lightweight client-side mirror of the server cart.
 * Source of truth is the API; this store caches data for instant UI updates
 * and optimistic rendering. Use use-cart.ts hooks for actual API operations.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/services/cart.service";
import { getCartItemPrices } from "@/lib/cart-pricing";

interface CartState {
  /** Cached items from last API response */
  items: CartItem[];
  total: number;
  /** Số lượng item — cùng tên trường backend (`Cart.total_item`), xem cart.service.ts. */
  total_item: number;

  /** Sync store from API response */
  syncFromApi: (cart: { items: CartItem[]; total: number; total_item: number }) => void;

  /** Optimistic add — replaced on next API sync */
  optimisticAdd: (item: CartItem) => void;

  /** Optimistic remove — replaced on next API sync */
  optimisticRemove: (courseId: string) => void;

  /** Clear local cache (e.g. on logout) */
  clearCache: () => void;

  /** Check if a course is cached in cart */
  isInCart: (courseId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      total_item: 0,

      syncFromApi: (cart) =>
        set({ items: cart.items ?? [], total: cart.total ?? 0, total_item: cart.total_item ?? 0 }),

      optimisticAdd: (item) => {
        if (get().isInCart(item.course_id)) return;
        set((s) => ({
          items: [...(s.items ?? []), item],
          total_item: (s.total_item ?? 0) + 1,
          total: (s.total ?? 0) + getCartItemPrices(item).price,
        }));
      },

      optimisticRemove: (courseId) => {
        const items = get().items ?? [];
        const existing = items.find((i) => i.course_id === courseId);
        set((s) => ({
          items: (s.items ?? []).filter((i) => i.course_id !== courseId),
          total_item: Math.max(0, (s.total_item ?? 0) - 1),
          total: Math.max(0, (s.total ?? 0) - (existing ? getCartItemPrices(existing).price : 0)),
        }));
      },

      clearCache: () => set({ items: [], total: 0, total_item: 0 }),

      isInCart: (courseId) => (get().items ?? []).some((i) => i.course_id === courseId),
    }),
    {
      name: "cart-storage",
      // Only persist item list for instant hydration; totals recomputed on sync
      partialize: (s) => ({ items: s.items ?? [], total: s.total ?? 0, total_item: s.total_item ?? 0 }),
      // Ensure items is always an array on hydration
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<CartState>),
        items: (persisted as Partial<CartState>)?.items ?? [],
      }),
    }
  )
);
