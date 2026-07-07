import { api } from '@/lib/api';

export interface Match {
  id: string;
  matchedUserId: string;
  matchedUserNickname: string;
  avatarBlurhash: string;
  avatarUrl?: string;
  revealGranted: boolean;
  lastMessageEncryptedPreview?: string; 
}

export const matchService = {
  getMatches: async (): Promise<Match[]> => {
    const response = await api.get('/matches');
    return response.data;
  },
};
