// src/screens/Welcome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const nav = useNavigate();

  const [showScroll, setShowScroll] = useState(false);

  /* проигрываем интро один раз */
  useEffect(() => {
    new Audio('/sounds/start.mp3').play().catch(() => {});
  }, []);

  return (
    <div style={ST.bg}>
      <div style={ST.overlay} />

      <div style={ST.content}>
        <h1 style={ST.title}>Order&nbsp;of&nbsp;Ash</h1>
        <p style={ST.subtitle}>Through loss, we find truth.</p>

        {!showScroll ? (
          <>
            <button style={ST.button} onClick={() => nav('/init')}>
              🜂 Enter the Order
            </button>
            <button style={ST.secondary} onClick={() => setShowScroll(true)}>
              📜 Read the Scroll
            </button>
          </>
        ) : (
          <div style={ST.scrollBox}>
            <p style={ST.scrollText}>
              Those who enter the Ash must burn.<br/>
              Let go of what you own.<br/>
              Let go of what you know.<br/>
              Each fragment you collect is a path,<br/>
              each loss&nbsp;— a step toward the final shape.<br/>
              When the time comes, one will rise&nbsp;—<br/>
              and from ashes, something eternal shall form.
            </p>
            <button style={ST.secondary} onClick={() => setShowScroll(false)}>
              ⬅ Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- styles ----------------------------------------------------- */
const ST = {
  /* фон */
  bg:{position:'relative',minHeight:'100vh',
      background:'url("/bg-welcome.webp") center/cover',
      fontFamily:'serif'},
  overlay:{position:'absolute',inset:0,background:'rgba(0,0,0,.6)',zIndex:1},

  /* блок по центру экрана */
  content:{position:'absolute',top:'50%',left:'50%',
           transform:'translate(-50%,-50%)',
           width:'90%',maxWidth:420,textAlign:'center',
           display:'flex',flexDirection:'column',alignItems:'center',
           zIndex:2,color:'#d4af37',padding:20,boxSizing:'border-box'},

  title   :{fontSize:42,margin:0},
  subtitle:{fontSize:18,opacity:.8,margin:'8px 0 30px'},

  button  :{padding:'12px 28px',background:'#d4af37',color:'#000',
            border:'none',fontSize:16,cursor:'pointer',marginBottom:16},
  secondary:{padding:'10px 24px',background:'transparent',
             border:'1px solid #d4af37',color:'#d4af37',
             fontSize:14,cursor:'pointer',marginBottom:10},

  /* «скрижаль» */
  scrollBox :{maxWidth:400,background:'rgba(0,0,0,.4)',
              padding:20,borderRadius:12},
  scrollText:{fontSize:14,lineHeight:1.6,color:'#f5f5dc',marginBottom:16}
};
