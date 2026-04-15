/**
 * Cart store — lightweight client-side mirror of the server cart.
 * Source of truth is the API; this store caches data for instant UI updates
 * and optimistic rendering. Use use-cart.ts hooks for actual API operations.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/services/cart.service";

/** Legacy shape used by course-detail-sidebar before API integration */
export interface LegacyCartItem {
  courseId: string;
  title: string;
  price: number;
  thumbnail: string;
  instructorName: string;
}

interface CartState {
  /** Cached items from last API response */
  items: CartItem[];
  total: number;
  item_count: number;

  /** Sync store from API response */
  syncFromApi: (cart: { items: CartItem[]; total: number; item_count: number }) => void;

  /** Optimistic add — replaced on next API sync */
  optimisticAdd: (item: CartItem) => void;

  /** Optimistic remove — replaced on next API sync */
  optimisticRemove: (courseId: string) => void;

  /**
   * Legacy addItem — adapts old shape to CartItem for backward compat.
   * Use useAddToCart() hook for real API-backed adds.
   */
  addItem: (item: LegacyCartItem) => void;

  /**
   * Legacy removeItem — alias for optimisticRemove.
   * Use useRemoveFromCart() hook for real API-backed removes.
   */
  removeItem: (courseId: string) => void;

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
      item_count: 0,

      syncFromApi: (cart) =>
        set({ items: cart.items ?? [], total: cart.total ?? 0, item_count: cart.item_count ?? 0 }),

      optimisticAdd: (item) => {
        if (get().isInCart(item.course_id)) return;
        set((s) => ({
          items: [...(s.items ?? []), item],
          item_count: (s.item_count ?? 0) + 1,
          total: (s.total ?? 0) + (item.course?.price ?? 0),
        }));
      },

      optimisticRemove: (courseId) => {
        const items = get().items ?? [];
        const existing = items.find((i) => i.course_id === courseId);
        set((s) => ({
          items: (s.items ?? []).filter((i) => i.course_id !== courseId),
          item_count: Math.max(0, (s.item_count ?? 0) - 1),
          total: Math.max(0, (s.total ?? 0) - (existing?.course?.price ?? 0)),
        }));
      },

      addItem: (legacy) => {
        if (get().isInCart(legacy.courseId)) return;
        const item: CartItem = {
          id: legacy.courseId,
          course_id: legacy.courseId,
          course: {
            id: legacy.courseId,
            title: legacy.title,
            price: legacy.price,
            thumbnail: legacy.thumbnail,
          },
          added_at: new Date().toISOString(),
        };
        set((s) => ({
          items: [...(s.items ?? []), item],
          item_count: (s.item_count ?? 0) + 1,
          total: (s.total ?? 0) + legacy.price,
        }));
      },

      removeItem: (courseId) => get().optimisticRemove(courseId),

      clearCache: () => set({ items: [], total: 0, item_count: 0 }),

      isInCart: (courseId) => (get().items ?? []).some((i) => i.course_id === courseId),
    }),
    {
      name: "cart-storage",
      // Only persist item list for instant hydration; totals recomputed on sync
      partialize: (s) => ({ items: s.items ?? [], total: s.total ?? 0, item_count: s.item_count ?? 0 }),
      // Ensure items is always an array on hydration
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<CartState>),
        items: (persisted as Partial<CartState>)?.items ?? [],
      }),
    }
  )
);
