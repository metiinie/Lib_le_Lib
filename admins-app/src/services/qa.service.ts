import { api } from './api';
import { QAThread } from '../types';

export const qaService = {
  getThreads: async (status?: string): Promise<QAThread[]> => {
    const params = status && status !== 'all' ? `?status=${status}` : '';
    const res = await api.get(`/qa/threads${params}`);
    return res.data;
  },

  replyToThread: async (threadId: string, message: string) => {
    const res = await api.post(`/qa/threads/${threadId}/reply`, { message });
    return res.data;
  },

  assignThread: async (threadId: string) => {
    const res = await api.post(`/qa/threads/${threadId}/assign`);
    return res.data;
  },

  // Legacy alias for backward compat
  answerThread: async (threadId: string, answer: string) => {
    const res = await api.post(`/qa/threads/${threadId}/reply`, { message: answer });
    return res.data;
  },
};
