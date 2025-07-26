// src/screens/Burn.jsx
import React, { useState } from 'react';
import BackButton from '../components/BackButton';
import Modal      from '../components/Modal';

export default function Burn() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="p-4">
      <BackButton />
      <h2 className="text-xl font-semibold mb-4">Burn Yourself</h2>
      <button
        onClick={() => setModalOpen(true)}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Burn
      </button>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)}>
          <p className="mb-4">First 3 burns are free. Burn for 0.5 TON?</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                /* TODO: trigger API call, then setModalOpen(false) */
              }}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
