'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Modal from './Modal';

export default function PhotoPreviewModal({ photoId, label, mentorName, onClose }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setSrc(null); setError('');
    fetch(`/api/photo/${photoId}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) { if (d.dataUrl) setSrc(d.dataUrl); else setError('Could not load photo.'); } })
      .catch(() => { if (!cancelled) setError('Could not load photo.'); });
    return () => { cancelled = true; };
  }, [photoId]);

  return (
    <Modal width={420} onClose={onClose}>
      <div className="p-[18px]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-semibold">{label}</div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary"><X size={18} /></button>
        </div>
        <div className="rounded-xl overflow-hidden bg-camera-bg flex items-center justify-center" style={{ height: 300 }}>
          {src ? (
            <img src={src} alt={label} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[13px] text-white/70">{error || 'Loading photo…'}</span>
          )}
        </div>
        <div className="text-[13px] text-text-secondary mt-3">{mentorName} · Captured on device · unedited</div>
      </div>
    </Modal>
  );
}
