// src/screens/Burn.jsx
import React, { useState } from 'react';
import BackButton from '../components/BackButton';
import Modal      from '../components/Modal';

export default function Burn() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg-burn.webp')" }}
    >
      {/* Чёрный оверлей */}
      <div className="absolute inset-0 bg-black opacity-70" />

      <div className="relative z-10 w-full max-w-md bg-gray-900 bg-opacity-90 rounded-xl shadow-xl p-6 space-y-6 text-white">
        {/* Кнопка назад */}
        <div>
          <BackButton />
        </div>

        {/* Заголовок */}
        <h2 className="text-2xl font-semibold text-center">
          Burn Yourself
        </h2>

        {/* Кнопка вызова модального окна */}
        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
        >
          🔥 Burn for 0.5 TON
        </button>

        {/* Модалка подтверждения */}
        {modalOpen && (
          <Modal onClose={() => setModalOpen(false)}>
            <p className="mb-4 text-gray-200">
              First 3 burns are free. Burn for 0.5 TON?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  /* TODO: trigger API call, then: */ setModalOpen(false);
                }}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
