/**
 * Cart store - persists selected courses before checkout
 * Uses Zustand with localStorage persistence
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  courseId: string;
  title: string;
  price: number;
  thumbnail: string;
  instructorName: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (courseId: string) => void;
  clearCart: () => void;
  isInCart: (courseId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        // Prevent duplicates
        if (get().isInCart(item.courseId)) return;
        set((state) => ({ items: [...state.items, item] }));
      },

      removeItem: (courseId) => {
        set((state) => ({
          items: state.items.filter((i) => i.courseId !== courseId),
        }));
      },

      clearCart: () => set({ items: [] }),

      isInCart: (courseId) => get().items.some((i) => i.courseId === courseId),
    }),
    {
      name: "cart-storage",
    }
  )
);
