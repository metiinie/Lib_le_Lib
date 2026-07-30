import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SecureDocumentViewer } from '../components/ui/SecureDocumentViewer';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('SecureDocumentViewer Component', () => {
  it('creates Blob Object URL and revokes it on unmount', async () => {
    const fakeBlob = new Blob(['dummy content'], { type: 'image/jpeg' });
    (api.get as any).mockResolvedValueOnce({
      data: fakeBlob,
      headers: { 'content-type': 'image/jpeg' },
    });

    const mockStaffUser = { id: 'staff-1', email: 'officer@libr.org', role: 'verification_officer' as const, status: 'active' as const, createdAt: '', updatedAt: '' };

    const { unmount } = render(
      <SecureDocumentViewer url="https://bucket.s3.amazonaws.com/doc.jpg" alt="ID Front Document" staffUser={mockStaffUser} />
    );

    await waitFor(() => {
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(fakeBlob);
    });

    expect(screen.getByText(/CONFIDENTIAL • LIB LE LIB STAFF/i)).toBeInTheDocument();

    unmount();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
  });
});
