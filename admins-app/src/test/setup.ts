import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.URL for SecureDocumentViewer Blob URL testing
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn((blob: Blob) => `blob:http://localhost:5173/${Math.random()}`);
  window.URL.revokeObjectURL = vi.fn();
}
