import { create } from 'zustand';
import { ProfileDto } from '../lib/zod-schemas';

type DraftProfileState = {
  draft: Partial<ProfileDto>;
  updateDraft: (data: Partial<ProfileDto>) => void;
  clearDraft: () => void;
};

export const useDraftProfileStore = create<DraftProfileState>((set) => ({
  draft: {},
  updateDraft: (data) =>
    set((state) => ({
      draft: { ...state.draft, ...data },
    })),
  clearDraft: () => set({ draft: {} }),
}));
