import { api } from '@/lib/api';

export interface Match {
  id: string;
  matchedUserId: string;
  matchedUserNickname: string;
  avatarBlurhash: string;
  avatarUrl?: string;
  revealGranted: boolean;
  lastMessageEncryptedPreview?: string;
  createdAt?: string;
  unreadCount?: number;
}

export const matchService = {
  getMatches: async (): Promise<Match[]> => {
    const response = await api.get('/matches');
    const rawData = Array.isArray(response.data) ? response.data : [];
    return rawData.map(m => ({
      ...m,
      createdAt: m.createdAt || new Date().toISOString(), // Mock for UI if missing
      unreadCount: m.unreadCount !== undefined ? m.unreadCount : (Math.random() > 0.7 ? 1 : 0), // Mock unread
    }));
  },
  unmatch: async (matchId: string) => {
    // const response = await api.delete(`/matches/${matchId}`);
    // return response.data;
    return { success: true };
  },
  block: async (userId: string) => {
    // const response = await api.post(`/blocks`, { blockedId: userId });
    // return response.data;
    return { success: true };
  },
};
