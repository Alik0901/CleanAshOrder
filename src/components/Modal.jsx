// src/components/Modal.jsx
import React from 'react';

export default function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
