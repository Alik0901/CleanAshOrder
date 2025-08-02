// файл: src/components/NavBar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiImage, FiHeart, FiUser, FiMenu, FiX } from 'react-icons/fi';

export default function NavBar() {
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/',           label: 'Home',       icon: <FiHome size={20} /> },
    { to: '/gallery',    label: 'Gallery',    icon: <FiImage size={20} /> },
    { to: '/burn',       label: 'Burn',       icon: <FiHeart size={20} /> },
    { to: '/leaderboard',label: 'Leaderboard',icon: <FiImage size={20} /> },
    { to: '/profile',    label: 'Profile',    icon: <FiUser size={20} /> },
  ];

  return (
    <header className="w-full bg-gradient-to-r from-[#1A1A2E] to-[#16213E] text-white fixed top-0 left-0 z-50">
      <div className="max-w-3xl mx-auto flex items-center justify-between p-4">
        {/* Logo */}
        <div className="text-xl font-bold font-montserrat cursor-pointer">
          Order of Ash
        </div>
        {/* Desktop menu */}
        <nav className="hidden md:flex space-x-6">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center space-x-1 py-2 px-3 rounded-lg transition-colors ${
                  isActive ? 'bg-[#FF6B6B] text-white' : 'hover:bg-[#4ECDC4]/20'
                }`}
            >
              {link.icon}
              <span className="font-inter text-sm">{link.label}</span>
            </NavLink>
          ))}
        </nav>
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 focus:outline-none"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden bg-[#16213E]">
          <ul className="flex flex-col space-y-2 p-4">
            {links.map(link => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 p-2 rounded-lg font-inter transition-colors ${
                      isActive ? 'bg-[#FF6B6B] text-white' : 'hover:bg-[#4ECDC4]/20'
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
