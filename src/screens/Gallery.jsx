// src/screens/Gallery.jsx
import React from 'react';
import BackButton from '../components/BackButton';
import FragmentCard from '../components/FragmentCard';

export default function Gallery() {
  // TODO: позже подгрузим реальные данные
  const fragments = [1, 2, null, null, 5, null, null, null]; // числа — индексы полученных, null — пустые

  return (
    <div className="p-4">
      <BackButton label="Gallery" />
      <h2 className="text-xl font-semibold mb-4">Your Fragments</h2>
      <div className="grid grid-cols-4 gap-4">
        {fragments.map((frag, i) => (
          <FragmentCard
            key={i}
            index={frag}
            isEmpty={frag == null}
            imageUrl={frag != null ? `/images/frag-${frag}.png` : null}
            onInvite={() => {/* navigate to /referral */}}
            onShow={() => {/* open modal with full GIF */}}
          />
        ))}
      </div>
    </div>
  );
}
