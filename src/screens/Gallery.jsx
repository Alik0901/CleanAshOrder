// src/screens/Gallery.jsx

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

const FRAGMENT_FILES = {
  1: 'fragment_1_the_whisper.jpg',
  2: 'fragment_2_the_number.jpg',
  3: 'fragment_3_the_language.jpg',
  4: 'fragment_4_the_mirror.jpg',
  5: 'fragment_5_the_chain.jpg',
  6: 'fragment_6_the_hour.jpg',
  7: 'fragment_7_the_mark.jpg',
  8: 'fragment_8_the_gate.jpg',
};

const slotPositions = [
  { left: 37,  top: 107 },
  { left: 117, top: 107 },
  { left: 197, top: 107 },
  { left: 277, top: 107 },
  { left: 37,  top: 187 },
  { left: 117, top: 187 },
  { left: 197, top: 187 },
  { left: 277, top: 187 },
];

const lockPositions = [
  { left: 70,  top: 140 },
  { left: 150, top: 140 },
  { left: 230, top: 139 },
  { left: 310, top: 140 },
  { left: 70,  top: 221 },
  { left: 150, top: 221 },
  { left: 230, top: 220 },
  { left: 310, top: 221 },
];

export default function Gallery() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [signedUrls, setSignedUrls] = useState({});
  const [fragments, setFragments]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [zoomUrl, setZoomUrl]       = useState(null);

  // Load presigned URLs + fragment list
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const presigned = await API.getSignedFragmentUrls();
        const fragData  = await API.getFragments(user.tg_id);
        if (cancelled) return;
        setSignedUrls(presigned.signedUrls || {});
        setFragments(fragData.fragments || []);
      } catch (e) {
        console.error('[Gallery] load error', e);
        if (e.message.toLowerCase().includes('invalid token')) {
          logout();
          navigate('/login');
        } else {
          setError(e.message || 'Error loading fragments');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user.tg_id, logout, navigate]);

  // When all 8 collected, go to final
  useEffect(() => {
    if (!loading && fragments.length >= 8) {
      navigate('/final');
    }
  }, [loading, fragments, navigate]);

  if (loading) return <p style={{ color: '#000', padding: 16 }}>Loading gallery…</p>;
  if (error)   return <p style={{ color: 'tomato', padding: 16 }}>{error}</p>;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',   // вместо fixed height
      }}
    >
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,              // fill entire container
          backgroundImage: "url('/images/bg-path.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* Back */}
      <BackButton
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 5,
        }}
      />

      {/* Title */}
      <h1
        style={{
          position: 'absolute',
          left: 41,
          top: 24,
          width: 312,
          height: 44,
          fontFamily: 'MedievalSharp, serif',
          fontWeight: 500,
          fontSize: 36,
          lineHeight: '41px',
          color: '#9D9D9D',
          textShadow: '2px 5px 8px rgba(131, 129, 129, 0.52)',
          zIndex: 5,
        }}
      >
        Artifact repository
      </h1>

      {/* 8 Slots */}
      {slotPositions.map((pos, i) => {
        const id       = i + 1;
        const owned    = fragments.includes(id);
        const filename = FRAGMENT_FILES[id];
        const url      = signedUrls[filename];
        return (
          <React.Fragment key={id}>
            {/* Frame */}
            <div
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                width: 80,
                height: 80,
                border: '1px solid #808080',
                zIndex: 5,
                overflow: 'hidden',
                cursor: owned ? 'pointer' : 'default',
              }}
              onClick={() => owned && url && setZoomUrl(`${url}&dummy=${Date.now()}`)}
            >
              {owned && url && (
                <img
                  src={`${url}&dummy=${Date.now()}`}
                  alt={`Fragment ${id}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/placeholder.jpg'; }}
                />
              )}
            </div>

            {/* Lock icon if not owned */}
            {!owned && (
              <span
                style={{
                  position: 'absolute',
                  left: lockPositions[i].left,
                  top:  lockPositions[i].top,
                  fontFamily: 'MedievalSharp, serif',
                  fontWeight: 500,
                  fontSize: 15,
                  lineHeight: '17px',
                  color: '#FFFFFF',
                  zIndex: 6,
                }}
              >
                🔒
              </span>
            )}
          </React.Fragment>
        );
      })}

      {/* Legendary Hint bar */}
      <div
        style={{
          position: 'absolute',
          left: 37,
          top: 289,
          width: 320,
          height: 21,
          border: '1px solid #808080',
          zIndex: 5,
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: 142,
          top: 291,
          fontFamily: 'Taviraj, serif',
          fontWeight: 400,
          fontSize: 10,
          lineHeight: '17px',
          color: '#FFFFFF',
          zIndex: 6,
        }}
      >
        Legendary Hint — 5 TON
      </span>

      {/* Referral */}
      <div
        onClick={() => navigate('/referral')}
        style={{
          position: 'absolute',
          left: 37,
          top: 355,
          width: 151,
          height: 43,
          border: '2px solid #9D9D9D',
          borderRadius: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 5,
        }}
      >
        <span
          style={{
            fontFamily: 'MedievalSharp, serif',
            fontWeight: 500,
            fontSize: 20,
            lineHeight: '23px',
            color: '#FFFFFF',
          }}
        >
          Referral
        </span>
      </div>

      {/* Leaders */}
      <div
        onClick={() => navigate('/leaderboard')}
        style={{
          position: 'absolute',
          left: 206,
          top: 355,
          width: 151,
          height: 43,
          border: '2px solid #9D9D9D',
          borderRadius: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 5,
        }}
      >
        <span
          style={{
            fontFamily: 'MedievalSharp, serif',
            fontWeight: 500,
            fontSize: 20,
            lineHeight: '23px',
            color: '#FFFFFF',
          }}
        >
          Leaders
        </span>
      </div>

      {/* Burn Again */}
      <div
        onClick={() => navigate('/burn')}
        style={{
          position: 'absolute',
          left: 64,
          top: 436,
          width: 265,
          height: 76,
          backgroundImage: 'linear-gradient(90deg, #D81E3D 0%, #D81E5F 100%)',
          boxShadow: '0px 6px 6px rgba(0, 0, 0, 0.87)',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 5,
        }}
      >
        <span
          style={{
            fontFamily: 'Tajawal, sans-serif',
            fontWeight: 700,
            fontSize: 24,
            lineHeight: '29px',
            color: '#FFFFFF',
          }}
        >
          BURN AGAIN
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          position: 'absolute',
          left: 22,
          top: 542,
          width: 349,
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize: 13,
          lineHeight: '16px',
          color: '#FFFFFF',
          zIndex: 5,
        }}
      >
        The true purpose of the Order of Ash is to recover all eight sacred fragments by deciphering hidden riddles and gathering every hint along the way. Once you have assembled the complete set, a final input window will appear—this is your one and only chance to enter the secret control phrase. If your submission is incorrect, you may choose to “Reborn” and begin your journey anew, but you will forfeit all existing fragments and hints. Should you succeed in entering the correct phrase on your first try—having met every condition—you will unlock a substantial cash reward. Good luck, and may the ashes guide your path.
      </p>

      {/* Zoom modal */}
      {zoomUrl && (
        <Modal onClose={() => setZoomUrl(null)}>
          <div
            onClick={() => setZoomUrl(null)}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <img
              src={zoomUrl}
              alt="Fragment zoom"
              style={{ maxWidth: '90%', maxHeight: '90%' }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
