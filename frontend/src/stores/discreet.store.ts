import { create } from 'zustand';

interface DiscreetState {
  isDiscreetMode: boolean;
  toggleDiscreetMode: () => void;
  setDiscreetMode: (active: boolean) => void;
}

export const useDiscreetStore = create<DiscreetState>((set) => ({
  isDiscreetMode: false,
  toggleDiscreetMode: () => set((state) => ({ isDiscreetMode: !state.isDiscreetMode })),
  setDiscreetMode: (active: boolean) => set({ isDiscreetMode: active }),
}));
