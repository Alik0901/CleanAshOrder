/* src/screens/Welcome.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ключ localStorage, меняйте версию — покажется заново */
const RULES_KEY = 'oa_rules_v1';

export default function Welcome() {
  const nav = useNavigate();

  const [showRules, setShowRules]   = useState(false);   // модалка правил
  const [agree,     setAgree]       = useState(false);   // чекбокс
  const [showLore,  setShowLore]    = useState(false);   // «Read the Scroll»

  /* один раз при первом рендере ---------------------------------------- */
  useEffect(() => {
    /* звук интро */
    new Audio('/sounds/start.mp3').play().catch(()=>{});
    /* правила, если ещё не прочитаны */
    if (!localStorage.getItem(RULES_KEY)) setShowRules(true);
  }, []);

  /* после прочтения правил */
  const handleContinue = () => {
    localStorage.setItem(RULES_KEY, '1');
    setShowRules(false);
  };

  /* перейти на экран /init */
  const enter = () => nav('/init');

  /* ------------------------------------------------------------------- */
  return (
    <div style={S.bg}>
      {/* =============== RULES MODAL =============== */}
      {showRules && (
        <div style={S.backdrop}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{margin:'0 0 10px'}}>Welcome, Seeker</h2>
            <p style={S.text}>
              • Every <b>burn</b> costs <b>0.5&nbsp;TON</b> &nbsp;and may grant a
              fragment or a <b>24-hour curse</b>.<br/>
              • You will <b>never spend more than&nbsp;4&nbsp;TON</b> in total — eight burns is all it takes.<br/>
              • Collect the <b>8 unique fragments</b> to uncover a hidden incantation.<br/>
              • After you enter the incantation, a <b>final NFT</b> is forged — its
              design is influenced by <i>your</i> own path.<br/>
              • <b>The first</b> player to enter the phrase becomes the winner.<br/>
              • Curses cannot be skipped; <b>patience</b> is part of the trial.<br/>
              • Payments are <b>irreversible</b> — send <b>exactly&nbsp;0.5&nbsp;TON</b> each time.<br/><br/>
              <i>Tread carefully, and may the ashes guide you.</i>
            </p>

            <label style={S.checkRow}>
              <input type="checkbox" checked={agree}
                     onChange={e=>setAgree(e.target.checked)} />
              &nbsp;I understand the rules and risks
            </label>

            <button
              disabled={!agree}
              onClick={handleContinue}
              style={{...S.contBtn,background:agree?'#d4af37':'#666'}}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* =============== MAIN SCREEN =============== */}
      <div style={S.overlay}/>
      <div style={S.content}>
        <h1 style={S.title}>Order of Ash</h1>
        <p style={S.subtitle}>Through loss, we find truth.</p>

        {!showLore ? (
          <>
            <button
              style={{...S.button,opacity:showRules?0.5:1,cursor:showRules?'default':'pointer'}}
              disabled={showRules}
              onClick={enter}>
              🜂 Enter the Order
            </button>
            <button style={S.secondary} onClick={()=>setShowLore(true)}>
              📜 Read the Scroll
            </button>
          </>
        ) : (
          <div style={S.scrollBox}>
            <p style={S.scrollText}>
              Those who enter the Ash must burn.<br/>
              Let go of what you own.<br/>
              Let go of what you know.<br/>
              Each fragment you collect is a path,<br/>
              each loss — a step toward the final shape.<br/>
              When the time comes, one will rise —<br/>
              and from ashes, something eternal shall form.
            </p>
            <button style={S.secondary} onClick={()=>setShowLore(false)}>
              ⬅ Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- styles ----------------------------------------------------- */
const S = {
  bg      :{position:'relative',minHeight:'100vh',background:'url("/bg-welcome.webp") center/cover'},
  overlay :{position:'absolute',inset:0,background:'rgba(0,0,0,.6)',zIndex:1},
  content :{position:'relative',zIndex:2,height:'100%',display:'flex',
            flexDirection:'column',justifyContent:'center',alignItems:'center',
            textAlign:'center',padding:20,color:'#d4af37',fontFamily:'serif'},
  title   :{fontSize:42,margin:0},
  subtitle:{fontSize:18,opacity:.8,margin:'8px 0 30px'},
  button  :{padding:'12px 28px',background:'#d4af37',color:'#000',border:'none',
            fontSize:16,cursor:'pointer',marginBottom:16},
  secondary:{padding:'10px 20px',background:'transparent',
             border:'1px solid #d4af37',color:'#d4af37',fontSize:14,cursor:'pointer',marginBottom:10},
  scrollBox:{maxWidth:400,background:'rgba(0,0,0,.4)',padding:20,borderRadius:12},
  scrollText:{fontSize:14,lineHeight:1.6,color:'#f5f5dc',marginBottom:16},

  /* modal */
  backdrop:{position:'fixed',inset:0,background:'#000a',
            backdropFilter:'blur(4px)',display:'flex',justifyContent:'center',
            alignItems:'center',zIndex:100},
  modal   :{width:'90%',maxWidth:360,background:'#181818',color:'#fff',
            padding:20,borderRadius:8,boxShadow:'0 0 16px #000'},
  text    :{textAlign:'left',lineHeight:1.4,fontSize:14},
  checkRow:{display:'block',fontSize:14,margin:'12px 0'},
  contBtn :{width:'100%',padding:'10px',border:'none',borderRadius:6,color:'#000'}
};
