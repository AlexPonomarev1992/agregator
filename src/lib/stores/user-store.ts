'use client';

import { create } from 'zustand';
import type { User, UserCredits, Subscription } from '@/types';

interface UserState {
  user: User | null;
  credits: UserCredits | null;
  subscription: Subscription | null;
  setUser: (user: User | null) => void;
  setCredits: (credits: UserCredits | null) => void;
  deductCredits: (amount: number) => void;
  setSubscription: (subscription: Subscription | null) => void;
  clearAll: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  credits: null,
  subscription: null,

  setUser: (user) => set({ user }),

  setCredits: (credits) => set({ credits }),

  deductCredits: (amount) =>
    set((state) => {
      if (!state.credits) return state;
      return {
        credits: {
          ...state.credits,
          balance: Math.max(0, state.credits.balance - amount),
          total_spent: state.credits.total_spent + amount,
        },
      };
    }),

  setSubscription: (subscription) => set({ subscription }),

  clearAll: () => set({ user: null, credits: null, subscription: null }),
}));
