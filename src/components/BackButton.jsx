// src/components/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ label = 'Back' }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 p-2"
    >
      ← {label}
    </button>
  );
}
