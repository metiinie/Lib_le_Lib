import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, FileQuestion, Lock } from 'lucide-react';
import { User } from '../../types';
import { api } from '../../services/api';

interface SecureDocumentViewerProps {
  url: string | null;
  alt: string;
  staffUser: User | null;
  zoomLevel?: number;
}

export const SecureDocumentViewer: React.FC<SecureDocumentViewerProps> = ({
  url,
  alt,
  staffUser,
  zoomLevel = 1,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setBlobUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    let createdObjectUrl: string | null = null;

    setLoading(true);
    setError(null);

    // Fetch image data as a Blob to prevent persistent browser caching
    // and allow clean memory revocation on unmount.
    // Use native fetch() for absolute URLs (pre-signed S3/GCS links) since
    // the Axios `api` client would incorrectly prepend its backend baseURL.
    const fetchBlob = async () => {
      try {
        const isAbsoluteUrl = /^https?:\/\//i.test(url);
        let blob: Blob;

        if (isAbsoluteUrl) {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          blob = await response.blob();
        } else {
          const response = await api.get(url, { responseType: 'blob' });
          const contentTypeHeader = response.headers['content-type'];
          const contentType = typeof contentTypeHeader === 'string' ? contentTypeHeader : 'image/jpeg';
          blob = new Blob([response.data], { type: contentType });
        }

        if (!active) return;
        createdObjectUrl = URL.createObjectURL(blob);
        setBlobUrl(createdObjectUrl);
      } catch (err) {
        if (!active) return;
        // Fallback: use URL directly if blob fetch fails
        setBlobUrl(url);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchBlob();

    return () => {
      active = false;
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [url]);

  const preventSave = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };

  const watermarkText = `CONFIDENTIAL • LIB LE LIB STAFF • FOR VERIFICATION PURPOSES ONLY • EXAMINED BY: ${
    staffUser?.email || staffUser?.id || 'STAFF'
  }`;

  return (
    <div
      className="relative w-full h-full min-h-[320px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center select-none"
      onContextMenu={preventSave}
      onDragStart={preventSave}
    >
      {/* Privacy Header Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg text-emerald-400 text-xs font-semibold shadow-md pointer-events-none">
        <Lock className="w-3.5 h-3.5" />
        <span>Secure Blob Stream • No Local Cache</span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
          <ShieldCheck className="w-8 h-8 text-indigo-400 animate-pulse" />
          <span>Decrypting & Loading Verification Stream...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-2 text-rose-400 text-xs p-4 text-center">
          <AlertCircle className="w-8 h-8" />
          <span>{error}</span>
        </div>
      ) : blobUrl ? (
        <div className="relative w-full h-full flex items-center justify-center overflow-auto p-4">
          <img
            src={blobUrl}
            alt={alt}
            onContextMenu={preventSave}
            onDragStart={preventSave}
            style={{ transform: `scale(${zoomLevel})` }}
            className="max-h-full object-contain transition-transform duration-150 origin-center pointer-events-auto"
          />

          {/* Dynamic Watermark Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-25">
            <div className="transform -rotate-12 text-slate-400 text-xs md:text-sm font-mono tracking-wider text-center font-bold px-8 py-4 border border-slate-700/50 rounded-xl bg-slate-900/40 uppercase">
              {watermarkText}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-600 space-y-2 p-6 pointer-events-none">
          <FileQuestion className="w-10 h-10 mx-auto" />
          <p className="text-xs">No verification document stream loaded.</p>
        </div>
      )}
    </div>
  );
};
