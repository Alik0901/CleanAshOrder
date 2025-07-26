// src/components/FragmentCard.jsx
import React from 'react';

export default function FragmentCard({ imageUrl, index, isEmpty, onInvite, onShow }) {
  return (
    <div className="w-24 h-24 border rounded-lg flex items-center justify-center bg-white">
      {isEmpty ? (
        <button
          onClick={onInvite}
          className="text-xs text-blue-600"
        >
          + Invite
        </button>
      ) : (
        <>
          <img src={imageUrl} alt={`Fragment ${index}`} className="w-full h-full object-cover rounded" />
          <button
            onClick={onShow}
            className="absolute bottom-1 text-[10px] bg-black bg-opacity-50 text-white px-1 rounded"
          >
            Show
          </button>
        </>
      )}
    </div>
  );
}
