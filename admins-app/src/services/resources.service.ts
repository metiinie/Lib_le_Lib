import { api } from './api';
import { ResourceItem, SuccessStory } from '../types';

export const resourcesService = {
  getResources: async (): Promise<ResourceItem[]> => {
    const res = await api.get('/resources');
    return res.data;
  },

  createResource: async (data: Partial<ResourceItem>) => {
    const res = await api.post('/resources', data);
    return res.data;
  },

  deleteResource: async (id: string) => {
    const res = await api.delete(`/resources/${id}`);
    return res.data;
  },

  getSuccessStories: async (): Promise<SuccessStory[]> => {
    const res = await api.get('/success-stories');
    return res.data;
  },

  approveSuccessStory: async (id: string) => {
    const res = await api.post(`/success-stories/${id}/approve`);
    return res.data;
  },
};
