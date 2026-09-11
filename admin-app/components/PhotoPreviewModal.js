'use client';
import { X } from 'lucide-react';
import Modal from './Modal';

export default function PhotoPreviewModal({ photo, label, mentorName, onClose }) {
  return (
    <Modal width={420} onClose={onClose}>
      <div className="p-[18px]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-semibold">{label}</div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary"><X size={18} /></button>
        </div>
        <div className="rounded-xl overflow-hidden bg-camera-bg" style={{ height: 300 }}>
          <img src={photo} alt={label} className="w-full h-full object-cover" />
        </div>
        <div className="text-[13px] text-text-secondary mt-3">{mentorName} · Captured on device · unedited</div>
      </div>
    </Modal>
  );
}
