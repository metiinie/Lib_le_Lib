import { api } from './api';
import { ModerationReport, ReportCategory, ReportSeverity, ReportStatus, UserStatus } from '../types';

export const reportsService = {
  getQueue: async (
    limit = 50,
    offset = 0,
    status?: ReportStatus,
    severity?: ReportSeverity,
    category?: ReportCategory,
  ): Promise<{ data: ModerationReport[]; total: number; limit: number; offset: number }> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    if (category) params.append('category', category);

    const res = await api.get(`/reports?${params.toString()}`);
    return res.data;
  },

  getReportDetails: async (reportId: string): Promise<ModerationReport> => {
    const res = await api.get(`/reports/${reportId}`);
    return res.data;
  },

  updateUserStatus: async (userId: string, status: UserStatus, reason?: string) => {
    const res = await api.patch(`/reports/users/${userId}/status`, { status, reason });
    return res.data;
  },

  performAction: async (
    reportId: string,
    action: 'warn' | 'suspend' | 'ban' | 'request_resubmission' | 'none',
    reason?: string
  ) => {
    const res = await api.post(`/reports/${reportId}/actions`, { action, reason });
    return res.data;
  },

  getUserContent: async (userId: string) => {
    const res = await api.get(`/reports/users/${userId}/content`);
    return res.data;
  },

  resetBio: async (userId: string, reason: string) => {
    const res = await api.patch(`/reports/users/${userId}/bio`, { reason });
    return res.data;
  },

  deletePhoto: async (userId: string, photoId: string, reason: string) => {
    const res = await api.delete(`/reports/users/${userId}/photos/${photoId}`, {
      data: { reason },
    });
    return res.data;
  },
};
