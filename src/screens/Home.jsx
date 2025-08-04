import React from 'react';
import bgWelcome from '../assets/images/converted_minimal.jpg';

export default function Home() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundImage: `url(${bgWelcome})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
