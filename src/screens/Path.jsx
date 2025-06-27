// src/screens/Path.jsx
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate }                      from 'react-router-dom'

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app'

const TG        = window.Telegram?.WebApp
const PLATFORM  = TG?.platform ?? 'unknown'
const DEV       = import.meta.env.DEV

// filenames of the 8 fragments
const FRAG_IMG = {
  1: 'fragment_1_the_whisper.jpg',
  2: 'fragment_2_the_number.jpg',
  3: 'fragment_3_the_language.jpg',
  4: 'fragment_4_the_mirror.jpg',
  5: 'fragment_5_the_chain.jpg',
  6: 'fragment_6_the_hour.jpg',
  7: 'fragment_7_the_mark.jpg',
  8: 'fragment_8_the_gate.jpg',
}

const styleTag = (
  <style>{`
    @keyframes fly {
      0%  {opacity:0;transform:translate(-50%,-50%) scale(.3);}
      15% {opacity:1;transform:translate(-50%,-50%) scale(1);}
      65% {opacity:1;transform:translate(-50%,-50%) scale(1);}
      100%{opacity:0;transform:translate(-50%,280%) scale(.3);}
    }
  `}</style>
)

function Debug() {
  const [log, setLog] = useState([])
  useEffect(() => {
    const h = e => setLog(l => [...l, JSON.stringify(e)])
    TG?.onEvent?.('viewport_changed', h)
    return () => TG?.offEvent?.('viewport_changed', h)
  }, [])
  return <pre style={S.dbg}>{log.join('\n')}</pre>
}

const saveToken = res => {
  const h = res.headers.get('Authorization') || ''
  if (h.startsWith('Bearer ')) localStorage.setItem('token', h.slice(7))
}

async function refreshToken(tgId, initData) {
  const r = await fetch(`${BACKEND}/api/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tg_id: tgId, name: '', initData }),
  })
  if (!r.ok) return false
  const j = await r.json()
  localStorage.setItem('token', j.token)
  return true
}

export default function Path() {
  const nav     = useNavigate()
  const pollRef = useRef(null)

  // user + game state
  const [tgId,      setTgId]      = useState('')
  const [raw,       setRaw]       = useState('')
  const [cd,        setCd]        = useState(0)
  const [curse,     setCurse]     = useState(null)
  const [collected, setCollected] = useState([])

  // payment / UI state
  const [busy,      setBusy]      = useState(false)
  const [wait,      setWait]      = useState(false)
  const [hub,       setHub]       = useState('')
  const [ton,       setTon]       = useState('')
  const [msg,       setMsg]       = useState('')
  const [showModal, setModal]     = useState(false)
  const [fragUrl,   setFragUrl]   = useState('')
  const [animating, setAnimating] = useState(false)

  // presigned URLs for fragments
  const [fragUrls,  setFragUrls]  = useState({})

  const COOLDOWN = 120

  const secLeft = t =>
    Math.max(0, COOLDOWN - Math.floor((Date.now() - new Date(t).getTime()) / 1000))
  const fmt = s =>
    `${String((s/60)|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const open = url =>
    TG?.openLink?.(url, { try_instant_view: false }) ||
    window.open(url, '_blank')

  // 0) if we returned with a pending invoice, resume polling
  useEffect(() => {
    const inv = localStorage.getItem('invoiceId')
    if (inv) {
      setWait(true)
      setHub(localStorage.getItem('paymentUrl') || '')
      setTon(localStorage.getItem('tonspaceUrl') || '')
      pollRef.current = setInterval(() => checkStatus(inv), 5000)
    }
  }, [])

  // 1) preload presigned URLs for fragments
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`${BACKEND}/api/fragments/urls`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(j => setFragUrls(j.signedUrls || {}))
      .catch(console.error)
  }, [])

  // 2) preload images, load user, fragments, cooldown & curse
  useEffect(() => {
    // preload all fragment filenames (to speed direct URLs)
    Object.values(FRAG_IMG).forEach(f => {
      const img = new Image()
      img.src = `/fragments/${f}`
    })

    const wa = TG?.initDataUnsafe
    const u  = wa?.user
    if (!u?.id) { nav('/init'); return }

    setTgId(String(u.id))
    setRaw(TG?.initData || '')

    if (!localStorage.getItem('token')) {
      nav('/init'); return
    }

    // collected fragments
    fetch(`${BACKEND}/api/fragments/${u.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(j => setCollected(j.fragments || []))
      .catch(() => {})

    // cooldown + curse
    fetch(`${BACKEND}/api/player/${u.id}`)
      .then(r => r.json())
      .then(j => {
        if (j.last_burn)    setCd(secLeft(j.last_burn))
        if (j.curse_expires && new Date(j.curse_expires) > new Date())
          setCurse(j.curse_expires)
      })
      .catch(() => {})

    // tick cooldown
    const t = setInterval(() => setCd(s => s>0? s-1 : 0), 1000)
    return () => {
      clearInterval(t)
      clearInterval(pollRef.current)
    }
  }, [nav])

  // 3) clear animation after it finishes
  useEffect(() => {
    if (animating) {
      const t = setTimeout(() => {
        setFragUrl('')
        setAnimating(false)
      }, 2300)
      return () => clearTimeout(t)
    }
  }, [animating])

  // create invoice + open payment
  async function createInvoice(retry = false) {
    setBusy(true)
    setMsg('')
    setWait(false)

    try {
      const res = await fetch(`${BACKEND}/api/burn-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          Authorization:`Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tg_id })
      })

      if (res.status === 401 && !retry) {
        const ok = await refreshToken(tgId, raw)
        if (ok) return createInvoice(true)
      }

      saveToken(res)
      const j = await res.json()
      if (!res.ok) throw new Error(j.error||'invoice error')

      localStorage.setItem('invoiceId',  j.invoiceId)
      localStorage.setItem('paymentUrl',  j.paymentUrl)
      localStorage.setItem('tonspaceUrl', j.tonspaceUrl)
      setHub(j.paymentUrl)
      setTon(j.tonspaceUrl)

      if (PLATFORM==='android' && j.tonspaceUrl) open(j.tonspaceUrl)
      else open(j.paymentUrl)

      setWait(true)
      pollRef.current = setInterval(() => checkStatus(j.invoiceId), 5000)
    } catch (e) {
      setMsg(e.message)
      setBusy(false)
      setWait(false)
    }
  }

  // check payment status and grant fragment or curse
  async function checkStatus(invId) {
    try {
      const res = await fetch(`${BACKEND}/api/burn-status/${invId}`, {
        headers: { Authorization:`Bearer ${localStorage.getItem('token')}` }
      })
      saveToken(res)
      const j = await res.json()
      if (!res.ok) throw new Error(j.error||'status error')

      if (j.paid) {
        clearInterval(pollRef.current)
        setBusy(false)
        setWait(false)
        localStorage.removeItem('invoiceId')
        localStorage.removeItem('paymentUrl')
        localStorage.removeItem('tonspaceUrl')

        if (j.cursed) {
          setCurse(j.curse_expires)
          setMsg(`⛔ Cursed until ${new Date(j.curse_expires).toLocaleString()}`)
        } else {
          setCurse(null)
          setCd(COOLDOWN)
          setCollected(a => [...a, j.newFragment])

          // use presigned URL if available, otherwise fallback
          const fname = FRAG_IMG[j.newFragment]
          const url = fragUrls[fname] || `/fragments/${fname}`
          setFragUrl(url)
          setAnimating(true)
          setMsg(`🔥 Fragment #${j.newFragment} received!`)
        }
      }
    } catch (e) {
      setMsg(e.message)
    }
  }

  const allGot   = collected.length === Object.keys(FRAG_IMG).length
  const disabled = busy || wait || cd>0 || curse || allGot
  const mainTxt  = allGot
    ? '🔒 All fragments collected'
    : busy ? 'Creating invoice…'
    : wait ? 'Waiting for payment…'
    : '🔥 Burn Yourself for 0.5 TON'

  return (
    <>
      {styleTag}

      {/* confirmation modal */}
      {showModal && (
        <div style={S.modalWrap} onClick={()=>setModal(false)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <h3 style={{margin:'0 0 10px'}}>⚠️ Important</h3>
            <p style={{fontSize:14,opacity:.9}}>
              Send <b>exactly 0.5 TON</b>.<br/>
              Any other amount will <b>not be recognised</b><br/>
              and <b>will be lost</b>.
            </p>
            <button
              style={{...S.mBtn,background:'#d4af37',color:'#000'}}
              onClick={()=>{ setModal(false); createInvoice() }}
            >
              I understand, continue
            </button>
            <button
              style={{...S.mBtn,background:'#333',color:'#fff'}}
              onClick={()=>setModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* main card */}
      <div style={S.page}>
        <div style={S.card}>
          <h2 style={S.h2}>The Path Begins</h2>
          <p style={S.sub}>Ready to burn yourself.</p>

          {msg && (
            <p style={{...S.stat,...(msg.startsWith('🔥')?S.ok:S.bad)}}>
              {msg}
            </p>
          )}
          {!msg && curse && (
            <p style={S.stat}>
              ⛔ Cursed until {new Date(curse).toLocaleString()}
            </p>
          )}
          {!msg && !curse && cd>0 && (
            <p style={S.stat}>⏳ Next burn in {fmt(cd)}</p>
          )}

          <button
            style={{...S.btn,...S.prim,opacity:disabled?0.6:1}}
            disabled={disabled}
            onClick={()=>setModal(true)}
          >
            {mainTxt}
          </button>

          {wait && (
            <>
              {PLATFORM==='android' && ton && (
                <button style={{...S.btn,...S.sec}} onClick={()=>open(ton)}>
                  Continue in Telegram Wallet
                </button>
              )}
              <button style={{...S.btn,...S.sec}} onClick={()=>open(hub)}>
                Open in Tonhub
              </button>
              <button style={{...S.btn,...S.sec,marginTop:0}}
                      onClick={()=>{
                        const inv = localStorage.getItem('invoiceId')
                        if (inv) checkStatus(inv)
                      }}>
                Check status
              </button>
            </>
          )}

          <button style={{...S.btn,...S.sec}} onClick={()=>nav('/profile')}>
            Go to your personal account
          </button>
        </div>
      </div>

      {/* fragment animation */}
      {fragUrl && (
        <img
          src={fragUrl}
          alt="fragment"
          style={S.frag}
          onLoad={()=>{}}
        />
      )}

      {DEV && location.search.includes('debug=1') && <Debug/>}
    </>
  )
}

const S = {
  page:{position:'relative',minHeight:'100vh',background:'url("/bg-path.webp") center/cover',display:'flex',justifyContent:'center',alignItems:'center',padding:'32px 12px'},
  card:{width:'100%',maxWidth:380,textAlign:'center',color:'#d4af37'},
  h2:{margin:0,fontSize:28,fontWeight:700},
  sub:{margin:'8px 0 24px',fontSize:16},
  btn:{display:'block',width:'100%',padding:12,fontSize:16,borderRadius:6,border:'none',margin:'12px 0',cursor:'pointer',transition:'opacity .2s'},
  prim:{background:'#d4af37',color:'#000'},
  sec:{background:'transparent',border:'1px solid #d4af37',color:'#d4af37'},
  stat:{fontSize:15,minHeight:22,margin:'12px 0'},
  ok:{color:'#6BCB77'},
  bad:{color:'#FF6B6B'},
  modalWrap:{position:'fixed',inset:0,background:'#0008',backdropFilter:'blur(6px)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:50},
  modal:{maxWidth:320,background:'#181818',color:'#fff',padding:20,borderRadius:8,boxShadow:'0 0 16px #000',textAlign:'center',lineHeight:1.4},
  mBtn:{marginTop:16,padding:10,width:'100%',fontSize:15,border:'none',borderRadius:6,cursor:'pointer'},
  frag:{position:'fixed',left:'50%',top:'50%',width:260,height:260,transform:'translate(-50%,-50%)',zIndex:30,animation:'fly 2.3s forwards'},
  dbg:{position:'fixed',left:0,right:0,bottom:0,maxHeight:'40vh',background:'#000c',color:'#5cff5c',fontSize:11,overflowY:'auto',whiteSpace:'pre-wrap',padding:'4px 6px',zIndex:9999}
}
