// src/components/NavBar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

export default function NavBar() {
  const links = [
    { to: '/burn',        label: 'Burn' },
    { to: '/gallery',     label: 'Gallery' },
    { to: '/referral',    label: 'Invite' },
    { to: '/leaderboard', label: 'Leaders' },
    { to: '/profile',     label: 'Me' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm flex justify-around py-2">
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `text-xs ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
