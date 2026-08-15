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

export interface DmRequest {
  id: string;
  senderId: string;
  nickname: string;
  avatarUrl?: string;
  message: string;
  createdAt: string;
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
  getDmRequests: async (): Promise<DmRequest[]> => {
    const response = await api.get('/dm-requests');
    return Array.isArray(response.data) ? response.data : [];
  },
  acceptDmRequest: async (requestId: string) => {
    const response = await api.patch(`/dm-requests/${requestId}/accept`);
    return response.data;
  }
};
