import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SecureDocumentViewer } from '../components/ui/SecureDocumentViewer';

describe('SecureDocumentViewer Component', () => {
  it('creates Blob Object URL and revokes it on unmount', async () => {
    const fakeBlob = new Blob(['dummy content'], { type: 'image/jpeg' });

    // jsdom doesn't support `new Response(blob)`, so mock fetch
    // with a plain object that satisfies the component's usage.
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(fakeBlob),
    } as any);

    const mockStaffUser = { id: 'staff-1', email: 'officer@libr.org', role: 'verification_officer' as const, status: 'active' as const, createdAt: '', updatedAt: '' };

    const { unmount } = render(
      <SecureDocumentViewer url="https://bucket.s3.amazonaws.com/doc.jpg" alt="ID Front Document" staffUser={mockStaffUser} />
    );

    await waitFor(() => {
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });

    expect(fetchSpy).toHaveBeenCalledWith('https://bucket.s3.amazonaws.com/doc.jpg');
    expect(screen.getByText(/CONFIDENTIAL • LIB LE LIB STAFF/i)).toBeInTheDocument();

    unmount();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
