import { api } from '@/lib/api';
import axios from 'axios';

export const photoService = {
  getUploadUrl: async (type: 'document' | 'selfie' | 'profile') => {
    const response = await api.post<{ uploadUrl: string }>('/photos/upload-url', { type });
    return response.data.uploadUrl;
  },

  uploadToSignedUrl: async (url: string, fileUri: string, mimeType: string = 'image/jpeg') => {
    // We use standard fetch here to securely PUT the raw binary payload to the signed URL 
    // without passing through the Axios interceptors that might inject the JWT.
    // The bucket URL expects no Authorization header, only the signed query params.
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': mimeType,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to storage bucket');
    }

    return true;
  },
};
