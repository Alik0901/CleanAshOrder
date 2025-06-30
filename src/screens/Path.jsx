// src/screens/Path.jsx
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate }                      from 'react-router-dom'
import { invoice, isInvoiceSupported }      from '@telegram-apps/sdk'

/* ---------- config -------------------------------------------------- */
const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app'

const TG       = window.Telegram?.WebApp
const PLATFORM = TG?.platform ?? 'unknown'
const DEV      = import.meta.env.DEV

/* id → имя файла (должно совпадать с бэкендовым FRAG_FILES) */
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

/* ---------- стили -------------------------------------------------- */
const S = {
  page: {
    position: 'relative',
    minHeight: '100vh',
    background: 'url("/bg-path.webp") center/cover',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '32px 12px',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    textAlign: 'center',
    color: '#d4af37',
  },
  h2:  { margin: 0, fontSize: 28, fontWeight: 700 },
  sub: { margin: '8px 0 24px', fontSize: 16 },
  btn: {
    display: 'block',
    width: '100%',
    padding: 12,
    fontSize: 16,
    borderRadius: 6,
    border: 'none',
    margin: '12px 0',
    cursor: 'pointer',
    transition: 'opacity .2s',
  },
  prim: { background: '#d4af37', color: '#000' },
  sec:  { background: 'transparent', border: '1px solid #d4af37', color: '#d4af37' },
  stat: { fontSize: 15, minHeight: 22, margin: '12px 0' },
  ok:   { color: '#6BCB77' },
  bad:  { color: '#FF6B6B' },
  modalWrap: {
    position: 'fixed', inset: 0,
    background: '#0008', backdropFilter: 'blur(6px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 50,
  },
  modal: {
    maxWidth: 320, background: '#181818', color: '#fff',
    padding: 20, borderRadius: 8, boxShadow: '0 0 16px #000',
    textAlign: 'center', lineHeight: 1.4,
  },
  mBtn: {
    marginTop: 16, padding: 10,
    width: '100%', fontSize: 15,
    border: 'none', borderRadius: 6,
    cursor: 'pointer',
  },
  frag: {
    position: 'fixed', left: '50%', top: '50%',
    width: 260, height: 260,
    transform: 'translate(-50%,-50%)',
    zIndex: 30, animation: 'fly 2.3s forwards',
  },
  dbg: {
    position: 'fixed', left: 0, right: 0, bottom: 0,
    maxHeight: '40vh', background: '#000c', color: '#5cff5c',
    fontSize: 11, overflowY: 'auto', whiteSpace: 'pre-wrap',
    padding: '4px 6px', zIndex: 9999,
  },
}

/* встроенный `<style>` для анимации */
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
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ tg_id: tgId, name:'', initData })
  })
  if (!r.ok) return false
  const j = await r.json()
  localStorage.setItem('token', j.token)
  return true
}

export default function Path() {
  const nav     = useNavigate()
  const pollRef = useRef(null)

  // Telegram
  const [tgId,     setTgId]   = useState('')
  const [initData, setRaw]   = useState('')
  // cooldown & curse
  const [cd,       setCd]     = useState(0)
  const [curse,    setCurse]  = useState(null)

  // burn/payment
  const [busy,     setBusy]   = useState(false)
  const [wait,     setWait]   = useState(false)
  const [hub,      setHub]    = useState('')
  const [ton,      setTon]    = useState('')
  const [msg,      setMsg]    = useState('')
  const [showModal,setModal]  = useState(false)
  const [ack,      setAck]    = useState(() => localStorage.getItem('burnAck') === '1')

  // presigned fragment URLs
  const [fragUrls,   setFragUrls]   = useState({})
  // анимационный фрагмент
  const [frag,       setFrag]       = useState('')
  const [fragLoaded, setFragLoaded] = useState(false)

  /* 1) Загрузка presigned URLs */
  useEffect(() => {
    ;(async() => {
      const token = localStorage.getItem('token')
      if (!token) return
      try {
        const res = await fetch(`${BACKEND}/api/fragments/urls`, {
          headers:{ Authorization:`Bearer ${token}` }
        })
        if (!res.ok) throw new Error()
        const { signedUrls } = await res.json()
        const map = {}
        Object.values(FRAG_IMG).forEach(file => {
          if (signedUrls[file]) {
            map[file] = signedUrls[file]
            new Image().src = signedUrls[file]  // предзагрузить
          }
        })
        setFragUrls(map)
      } catch(e) {
        console.error('Failed to load fragment URLs', e)
      }
    })()
  }, [])

  /* 2) Mount: Telegram init, cooldown, возобновление polling */
  useEffect(() => {
    const wa = TG?.initDataUnsafe
    const u  = wa?.user
    if (!u?.id) { nav('/init'); return }
    setTgId(String(u.id))
    setRaw(TG?.initData || '')
    if (!localStorage.getItem('token')) { nav('/init'); return }

    ;(async() => {
      try {
        const r = await fetch(`${BACKEND}/api/player/${u.id}`)
        const j = await r.json()
        if (j.last_burn) setCd(secLeft(j.last_burn))
        if (j.curse_expires && new Date(j.curse_expires) > new Date())
          setCurse(j.curse_expires)
      } catch {}
    })()

    const inv = localStorage.getItem('invoiceId')
    if (inv) startPolling(inv)

    const timer = setInterval(() => setCd(s => s>0? s-1:0), 1000)
    return () => {
      clearInterval(timer)
      clearInterval(pollRef.current)
    }
  }, [nav])

  /* helpers */
  const COOLDOWN = 120
  const secLeft  = t => Math.max(0,
    COOLDOWN - Math.floor((Date.now() - new Date(t).getTime())/1000))
  const fmt      = s => `${String((s/60)|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const openUrl  = u => TG?.openLink?.(u,{try_instant_view:false}) || window.open(u,'_blank')

  /* polling вынесен в функцию */
  function startPolling(invoiceId) {
    setWait(true)
    pollRef.current = setInterval(()=>checkStatus(invoiceId),5000)
  }

  /* Billing */
  const createInvoice = async (retry=false) => {
    setBusy(true); setMsg(''); setModal(false)
    try {
      const resp = await fetch(`${BACKEND}/api/burn-invoice`, {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tg_id: tgId })
      })

      if (resp.status===401 && !retry) {
        if (await refreshToken(tgId, initData))
          return createInvoice(true)
      }

      saveToken(resp)
      const j = await resp.json()
      if (!resp.ok) throw new Error(j.error||'invoice')

      setHub(j.paymentUrl)
      setTon(j.tonspaceUrl)
      localStorage.setItem('invoiceId', j.invoiceId)

      // нативный invoice через SDK
      if (isInvoiceSupported()) {
        try {
          const status = await invoice.open({ url: j.paymentUrl })
          if (status==='paid') {
            await checkStatus(j.invoiceId)
            return
          }
          setMsg('Оплата не завершена.')
          startPolling(j.invoiceId)
          return
        } catch(err) {
          console.warn('invoice.open failed', err)
          setMsg('Не удалось открыть кошелёк, попробуйте Tonhub.')
          startPolling(j.invoiceId)
          return
        }
      }

      // fallback: Tonhub / Ton.Space
      if (PLATFORM==='android' && j.tonspaceUrl) openUrl(j.tonspaceUrl)
      else openUrl(j.paymentUrl)

      startPolling(j.invoiceId)

    } catch(e) {
      setMsg(e.message)
      setBusy(false)
      setWait(false)
    }
  }

  const onBurnClick    = ()=> ack ? createInvoice() : setModal(true)
  const onAckAndBurn   = ()=>{ localStorage.setItem('burnAck','1'); setAck(true); setModal(false); createInvoice() }

  /* polling статуса */
  const checkStatus = async id => {
    try {
      const resp = await fetch(`${BACKEND}/api/burn-status/${id}`,{
        headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}
      })
      saveToken(resp)
      const j = await resp.json()
      if (!resp.ok) throw new Error(j.error||'status')

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
          const filename = FRAG_IMG[j.newFragment]
          const url      = fragUrls[filename] ?? `${BACKEND}/fragments/${filename}`
          setFrag(url)
          setFragLoaded(false)
          setMsg(`🔥 Fragment #${j.newFragment} received!`)
        }
      }
    } catch(e) {
      setMsg(e.message)
    }
  }

  /* скрыть анимацию */
  useEffect(()=>{
    if(!fragLoaded) return
    const t = setTimeout(()=>{
      setFrag('')
      setFragLoaded(false)
    },2300)
    return ()=>clearTimeout(t)
  },[fragLoaded])

  /* render */
  const disabled = busy||wait||cd>0||curse
  const mainTxt  = busy ? 'Creating invoice…'
                 : wait ? 'Waiting for payment…'
                 : '🔥 Burn Yourself for 0.5 TON'

  return (
    <>
      {styleTag}

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
              onClick={onAckAndBurn}>
              I understand, continue
            </button>
            <button
              style={{...S.mBtn,background:'#333',color:'#fff'}}
              onClick={()=>setModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={S.page}>
        <div style={S.card}>
          <h2 style={S.h2}>The Path Begins</h2>
          <p style={S.sub}>Ready to burn yourself.</p>

          {msg && (
            <p style={{...S.stat, ...(msg.startsWith('🔥')?S.ok:S.bad)}}>
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
            onClick={onBurnClick}>
            {mainTxt}
          </button>

          {wait && (
            <>
              {PLATFORM==='android' && ton && (
                <button style={{...S.btn,...S.sec}} onClick={()=>openUrl(ton)}>
                  Continue in Telegram Wallet
                </button>
              )}
              <button style={{...S.btn,...S.sec}} onClick={()=>openUrl(hub)}>
                Open in Tonhub
              </button>
              <button
                style={{...S.btn,...S.sec,marginTop:0}}
                onClick={()=>{
                  const inv = localStorage.getItem('invoiceId')
                  if(inv) checkStatus(inv)
                }}>
                Check status
              </button>
            </>
          )}

          <button
            style={{...S.btn,...S.sec}}
            onClick={()=>nav('/profile')}>
            Go to your personal account
          </button>
        </div>
      </div>

      {frag && (
        <img
          src={frag}
          alt="fragment"
          crossOrigin="anonymous"
          style={S.frag}
          onLoad={()=>setFragLoaded(true)}
        />
      )}

      {DEV && location.search.includes('debug=1') && <Debug />}
    </>
  )
}
