// src/screens/Path.jsx
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate }                      from 'react-router-dom'

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app'

const TG        = window.Telegram?.WebApp
const PLATFORM  = TG?.platform ?? 'unknown'
const DEV       = import.meta.env.DEV

// Map fragment IDs to filenames
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

export default function Path() {
  const nav     = useNavigate()
  const pollRef = useRef(null)

  // whether user has confirmed the “0.5 TON” warning
  const [confirmed, setConfirmed] = useState(
    localStorage.getItem('burnConfirmed') === '1'
  )
  // modal visibility
  const [showModal, setShowModal] = useState(false)

  // presigned URLs for fragments
  const [fragUrls, setFragUrls] = useState({})

  // payment and game state
  const [tgId,      setTgId]      = useState('')
  const [raw,       setRaw]       = useState('')
  const [collected, setCollected] = useState([])
  const [cd,        setCd]        = useState(0)
  const [curse,     setCurse]     = useState(null)
  const [busy,      setBusy]      = useState(false)
  const [wait,      setWait]      = useState(false)
  const [hub,       setHub]       = useState('')
  const [ton,       setTon]       = useState('')
  const [msg,       setMsg]       = useState('')
  const [frag,      setFrag]      = useState('')
  const [fragLoaded,setFragLoaded]= useState(false)

  const COOLDOWN = 120

  // helper: seconds left on cooldown
  const secLeft = t =>
    Math.max(0, COOLDOWN - Math.floor((Date.now() - new Date(t).getTime())/1000))
  // format mm:ss
  const fmt = s =>
    `${String((s/60)|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  // fetch presigned URLs once
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`${BACKEND}/api/fragments/urls`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        // data.signedUrls: { filename: url, ... }
        // remap to id → url
        const map = {}
        Object.entries(FRAG_IMG).forEach(([id, fname]) => {
          if (data.signedUrls[fname]) {
            map[id] = data.signedUrls[fname]
          }
        })
        setFragUrls(map)
      })
      .catch(console.error)
  }, [])

  // on mount: init data, load fragments, cooldown & curse
  useEffect(() => {
    const wa = TG?.initDataUnsafe
    const user = wa?.user
    if (!user?.id) {
      nav('/init')
      return
    }
    setTgId(String(user.id))
    setRaw(TG?.initData || '')

    if (!localStorage.getItem('token')) {
      nav('/init')
      return
    }

    // load collected fragments
    fetch(`${BACKEND}/api/fragments/${user.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(j => setCollected(j.fragments || []))
      .catch(() => {})

    // load cooldown & curse from player profile
    fetch(`${BACKEND}/api/player/${user.id}`)
      .then(r => r.json())
      .then(j => {
        if (j.last_burn) setCd(secLeft(j.last_burn))
        if (j.curse_expires && new Date(j.curse_expires) > new Date()) {
          setCurse(j.curse_expires)
        }
      })
      .catch(() => {})

    // tick cooldown every second
    const tick = setInterval(() => {
      setCd(c => (c > 0 ? c - 1 : 0))
    }, 1000)
    return () => {
      clearInterval(tick)
      clearInterval(pollRef.current)
    }
  }, [nav])

  // hide fragment animation after it finishes
  useEffect(() => {
    if (fragLoaded) {
      const t = setTimeout(() => {
        setFrag('')
        setFragLoaded(false)
      }, 2300)
      return () => clearTimeout(t)
    }
  }, [fragLoaded])

  // create invoice + open payment
  async function createInvoice(retry = false) {
    setBusy(true)
    setMsg('')
    // close modal only on first confirmation
    if (!confirmed) setShowModal(false)

    try {
      const res = await fetch(`${BACKEND}/api/burn-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tg_id: tgId })
      })

      // handle expired JWT
      if (res.status === 401 && !retry) {
        const ok = await refreshToken(tgId, raw)
        if (ok) return createInvoice(true)
      }

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'invoice error')

      // save new token if provided
      const auth = res.headers.get('Authorization') || ''
      if (auth.startsWith('Bearer ')) {
        localStorage.setItem('token', auth.slice(7))
      }

      setHub(json.paymentUrl)
      setTon(json.tonspaceUrl)
      localStorage.setItem('invoiceId',  json.invoiceId)
      localStorage.setItem('paymentUrl',  json.paymentUrl)
      localStorage.setItem('tonspaceUrl', json.tonspaceUrl)

      if (PLATFORM === 'android' && json.tonspaceUrl) {
        TG.openLink(json.tonspaceUrl)
      } else {
        window.open(json.paymentUrl, '_blank')
      }

      setWait(true)
      pollRef.current = setInterval(() => checkStatus(json.invoiceId), 5000)

    } catch (e) {
      setMsg(e.message)
      setBusy(false)
      setWait(false)
    }
  }

  // check payment status
  async function checkStatus(invoiceId) {
    try {
      const res = await fetch(`${BACKEND}/api/burn-status/${invoiceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'status error')

      if (json.paid) {
        clearInterval(pollRef.current)
        setBusy(false)
        setWait(false)
        localStorage.removeItem('invoiceId')
        localStorage.removeItem('paymentUrl')
        localStorage.removeItem('tonspaceUrl')

        if (json.cursed) {
          setCurse(json.curse_expires)
          setMsg(`⛔ Cursed until ${new Date(json.curse_expires).toLocaleString()}`)
        } else {
          setCollected(prev => [...prev, json.newFragment])
          setCd(COOLDOWN)
          const url = fragUrls[json.newFragment]
          setFrag(url)
          setMsg(`🔥 Fragment #${json.newFragment} received!`)
        }
      }
    } catch (e) {
      setMsg(e.message)
    }
  }

  // helper: refresh JWT if needed
  async function refreshToken(tgId, initData) {
    try {
      const r = await fetch(`${BACKEND}/api/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg_id: tgId, name: '', initData })
      })
      const j = await r.json()
      if (r.ok && j.token) {
        localStorage.setItem('token', j.token)
        return true
      }
    } catch {}
    return false
  }

  // single-click handler for main button
  function handleBurnClick() {
    if (!confirmed) {
      setShowModal(true)
    } else {
      createInvoice()
    }
  }

  // user confirmed the warning
  function handleConfirm() {
    setConfirmed(true)
    localStorage.setItem('burnConfirmed', '1')
    createInvoice()
  }

  // reset showModal on close
  function handleModalClose() {
    setShowModal(false)
  }

  const allCollected = collected.length === Object.keys(FRAG_IMG).length
  const disabled     = busy || wait || cd > 0 || curse || allCollected
  const mainText     = allCollected
    ? '🔒 All fragments collected'
    : busy   ? 'Creating invoice…'
    : wait   ? 'Waiting for payment…'
    : '🔥 Burn Yourself for 0.5 TON'

  return (
    <>
      {/* styles for animation */}
      <style>{`
        @keyframes fly {
          0%   { opacity: 0; transform: translate(-50%,-50%) scale(.3); }
          15%  { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          65%  { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%,280%) scale(.3); }
        }
      `}</style>

      {/* confirmation modal */}
      {showModal && !confirmed && (
        <div style={S.modalOverlay} onClick={handleModalClose}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={S.modalTitle}>⚠️ Important</h3>
            <p style={S.modalText}>
              You will pay <b>exactly 0.5 TON</b>.<br/>
              Any other amount will <b>not be recognised</b><br/>
              and <b>will be lost</b>.
            </p>
            <button style={S.modalButton} onClick={handleConfirm}>
              I understand, continue
            </button>
            <button style={S.modalCancel} onClick={handleModalClose}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* main content */}
      <div style={S.page}>
        <div style={S.card}>
          <h2 style={S.title}>The Path Begins</h2>
          <p style={S.subtitle}>Ready to burn yourself.</p>

          {msg && (
            <p style={{
              ...S.status,
              color: msg.startsWith('🔥') ? '#6BCB77' : '#FF6B6B'
            }}>
              {msg}
            </p>
          )}
          {!msg && curse && (
            <p style={S.status}>
              ⛔ Cursed until {new Date(curse).toLocaleString()}
            </p>
          )}
          {!msg && !curse && cd > 0 && (
            <p style={S.status}>⏳ Next burn in {fmt(cd)}</p>
          )}

          <button
            style={{
              ...S.buttonPrimary,
              opacity: disabled ? 0.6 : 1
            }}
            disabled={disabled}
            onClick={handleBurnClick}
          >
            {mainText}
          </button>

          {wait && (
            <>
              {PLATFORM === 'android' && ton && (
                <button style={S.buttonSecondary}
                        onClick={() => TG.openLink(ton)}>
                  Continue in Telegram Wallet
                </button>
              )}
              <button style={S.buttonSecondary}
                      onClick={() => window.open(hub, '_blank')}>
                Open in Tonhub
              </button>
              <button style={S.buttonSecondary}
                      onClick={() => {
                        const inv = localStorage.getItem('invoiceId')
                        if (inv) checkStatus(inv)
                      }}>
                Check status
              </button>
            </>
          )}

          <button style={S.buttonSecondary}
                  onClick={() => nav('/profile')}>
            Go to your personal account
          </button>
        </div>
      </div>

      {/* fragment drop animation */}
      {frag && (
        <img
          src={frag}
          alt="fragment"
          style={S.fragmentAnim}
          onLoad={() => setFragLoaded(true)}
        />
      )}

      {DEV && location.search.includes('debug=1') && (
        <pre style={S.debug}>{/* debug events */}</pre>
      )}
    </>
  )
}

// Styles object
const S = {
  page: {
    position: 'relative',
    minHeight: '100vh',
    background: 'url("/bg-path.webp") center/cover',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '32px 12px'
  },
  card: {
    width: '100%',
    maxWidth: 380,
    textAlign: 'center',
    color: '#d4af37'
  },
  title:    { margin: 0, fontSize: 28, fontWeight: 700 },
  subtitle: { margin: '8px 0 24px', fontSize: 16 },
  status:   { fontSize: 15, minHeight: 22, margin: '12px 0' },

  buttonPrimary: {
    display: 'block',
    width: '100%',
    padding: 12,
    fontSize: 16,
    borderRadius: 6,
    border: 'none',
    margin: '12px 0',
    cursor: 'pointer',
    background: '#d4af37',
    color: '#000',
    transition: 'opacity .2s'
  },
  buttonSecondary: {
    display: 'block',
    width: '100%',
    padding: 12,
    fontSize: 16,
    borderRadius: 6,
    border: '1px solid #d4af37',
    margin: '12px 0',
    cursor: 'pointer',
    background: 'transparent',
    color: '#d4af37'
  },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100
  },
  modal: {
    background: '#181818',
    padding: 20,
    borderRadius: 8,
    textAlign: 'center',
    color: '#fff',
    maxWidth: 300
  },
  modalTitle:  { margin: '0 0 10px', fontSize: 18 },
  modalText:   { fontSize: 14, lineHeight: 1.4, margin: '0 0 16px' },
  modalButton: {
    display: 'block',
    width: '100%',
    padding: 10,
    marginBottom: 8,
    border: 'none',
    borderRadius: 6,
    background: '#d4af37',
    color: '#000',
    cursor: 'pointer'
  },
  modalCancel: {
    display: 'block',
    width: '100%',
    padding: 10,
    border: 'none',
    borderRadius: 6,
    background: '#444',
    color: '#fff',
    cursor: 'pointer'
  },

  fragmentAnim: {
    position: 'fixed',
    left: '50%',
    top: '50%',
    width: 260,
    height: 260,
    transform: 'translate(-50%, -50%)',
    animation: 'fly 2.3s forwards',
    zIndex: 50
  },

  debug: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '40vh',
    overflowY: 'auto',
    background: '#000c',
    color: '#5cff5c',
    fontSize: 11,
    padding: 8,
    zIndex: 999
  }
}
