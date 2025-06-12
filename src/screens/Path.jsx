// src/screens/Path.jsx
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app'

export default function Path() {
  const navigate = useNavigate()

  // === профиль ===
  const [tgId, setTgId] = useState('')
  const [fragments, setFragments] = useState([])
  const [lastBurn, setLastBurn] = useState(null)
  const [isCursed, setIsCursed] = useState(false)
  const [curseExpires, setCurseExpires] = useState(null)
  const [cooldown, setCooldown] = useState(0)

  // === платёж ===
  const [loading, setLoading] = useState(true)
  const [burning, setBurning] = useState(false)
  const [invoiceId, setInvoiceId] = useState(null)
  const [paymentUrl, setPaymentUrl] = useState('')
  const [tonDeepLink, setTonDeepLink] = useState('')
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')
  const [newFragment, setNewFragment] = useState(null)

  const pollingRef = useRef(null)
  const COOLDOWN_SECONDS = 2 * 60

  // вычисляем кулдаун в секундах
  const computeCooldown = last =>
    last
      ? Math.max(
          0,
          COOLDOWN_SECONDS -
            Math.floor((Date.now() - new Date(last).getTime()) / 1000)
        )
      : 0

  // тикер кулдауна
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => {
      setCooldown(prev => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [cooldown])

  // монтирование: читаем tg_id, токен, профиль и незавершённый платёж
  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {}
    const id = unsafe.user?.id
    if (!id) {
      navigate('/init')
      return
    }
    setTgId(String(id))

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/init')
      return
    }

    // если был незавершённый платёж — поднимем polling
    const savedId = localStorage.getItem('invoiceId')
    const savedUrl = localStorage.getItem('paymentUrl')
    const savedDeep = localStorage.getItem('tonDeepLink')
    if (savedId && savedUrl && savedDeep) {
      setInvoiceId(savedId)
      setPaymentUrl(savedUrl)
      setTonDeepLink(savedDeep)
      setPolling(true)
      pollingRef.current = setInterval(() => checkPaymentStatus(savedId), 5000)
    }

    // загрузка профиля
    async function loadProfile() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${BACKEND_URL}/api/player/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        const newAuth = res.headers.get('Authorization')
        if (newAuth?.startsWith('Bearer ')) {
          localStorage.setItem('token', newAuth.split(' ')[1])
        }
        if (!res.ok) throw new Error()
        const data = await res.json()
        setFragments(data.fragments || [])
        setLastBurn(data.last_burn)
        if (data.curse_expires && new Date(data.curse_expires) > new Date()) {
          setIsCursed(true)
          setCurseExpires(data.curse_expires)
        } else {
          setIsCursed(false)
          setCurseExpires(null)
          setCooldown(computeCooldown(data.last_burn))
        }
      } catch {
        navigate('/init')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
    window.addEventListener('focus', loadProfile)
    return () => window.removeEventListener('focus', loadProfile)
  }, [navigate])

  // === Шаг 1. Создаём инвойс ===
  const handleBurn = async () => {
    setBurning(true)
    setError('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/burn-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ tg_id: tgId }),
      })
      const newAuth = res.headers.get('Authorization')
      if (newAuth?.startsWith('Bearer ')) {
        localStorage.setItem('token', newAuth.split(' ')[1])
      }
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '⚠️ Could not create invoice')
        setBurning(false)
        return
      }

      // 1) HTTP-url
      const hubUrl = data.paymentUrl

      // 2) deep-link: ton://transfer/...?...
      const u = new URL(hubUrl)
      // u.pathname === "/transfer/...."
      const path = u.pathname.replace(/^\//, '') // "transfer/..."
      const deep = `ton://${path}${u.search}`

      setInvoiceId(data.invoiceId)
      setPaymentUrl(hubUrl)
      setTonDeepLink(deep)
      localStorage.setItem('invoiceId', data.invoiceId)
      localStorage.setItem('paymentUrl', hubUrl)
      localStorage.setItem('tonDeepLink', deep)

      // 3) пробуем открыть встроенный TON-кошелёк в Telegram WebView
      if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(deep)
      } else {
        window.location.href = deep
      }

      // 4) если не отработало — через 1 сек fallback на tonhub.com
      setTimeout(() => {
        window.location.href = hubUrl
      }, 1000)

      // 5) стартуем polling
      setPolling(true)
      pollingRef.current = setInterval(
        () => checkPaymentStatus(data.invoiceId),
        5000
      )
    } catch (e) {
      setError(`⚠️ ${e.message}`)
      setBurning(false)
    }
  }

  // === Шаг 2. Проверяем статус ===
  const checkPaymentStatus = async id => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/burn-status/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const newAuth = res.headers.get('Authorization')
      if (newAuth?.startsWith('Bearer ')) {
        localStorage.setItem('token', newAuth.split(' ')[1])
      }
      const data = await res.json()
      if (!res.ok) {
        clearInterval(pollingRef.current)
        setPolling(false)
        setBurning(false)
        setError(data.error || '⚠️ Error checking payment')
        return
      }
      if (data.paid) {
        clearInterval(pollingRef.current)
        setPolling(false)
        setBurning(false)
        localStorage.removeItem('invoiceId')
        localStorage.removeItem('paymentUrl')
        localStorage.removeItem('tonDeepLink')

        if (data.cursed) {
          setError(
            `⚠️ You are cursed until ${new Date(
              data.curse_expires
            ).toLocaleString()}`
          )
          setIsCursed(true)
          setCurseExpires(data.curse_expires)
        } else {
          setNewFragment(data.newFragment)
          setFragments(data.fragments)
          setIsCursed(false)
          setCurseExpires(null)
          setLastBurn(data.lastBurn)
          setCooldown(computeCooldown(data.lastBurn))
        }
      }
    } catch (e) {
      setError(`⚠️ ${e.message}`)
      clearInterval(pollingRef.current)
      setPolling(false)
      setBurning(false)
    }
  }

  if (loading) {
    return <div style={styles.center}>Loading…</div>
  }

  const formatTime = sec => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0')
    const s = String(sec % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        <h2 style={styles.title}>The Path Begins</h2>

        {newFragment && (
          <p style={styles.message}>🔥 You received fragment #{newFragment}!</p>
        )}

        {isCursed ? (
          <p style={styles.status}>
            ⚠️ You are cursed until {new Date(curseExpires).toLocaleString()}
          </p>
        ) : cooldown > 0 ? (
          <p style={styles.status}>⏳ Next burn in {formatTime(cooldown)}</p>
        ) : (
          <p style={styles.status}>Ready to burn yourself.</p>
        )}

        <button
          onClick={handleBurn}
          disabled={
            burning ||
            polling ||
            (isCursed && new Date(curseExpires) > new Date()) ||
            cooldown > 0
          }
          style={{
            ...styles.burnButton,
            opacity:
              burning ||
              polling ||
              (isCursed && new Date(curseExpires) > new Date()) ||
              cooldown > 0
                ? 0.6
                : 1,
            cursor:
              burning ||
              polling ||
              (isCursed && new Date(curseExpires) > new Date()) ||
              cooldown > 0
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          {burning
            ? 'Creating invoice…'
            : polling
            ? 'Waiting for payment…'
            : '🔥 Burn Yourself for 0.5 TON'}
        </button>

        {!burning && polling && paymentUrl && (
          <button
            onClick={() =>
              window.Telegram?.WebApp?.openLink
                ? window.Telegram.WebApp.openLink(tonDeepLink || paymentUrl)
                : (window.location.href = tonDeepLink || paymentUrl)
            }
            style={styles.secondary}
          >
            Continue Payment
          </button>
        )}

        <button onClick={() => navigate('/profile')} style={styles.secondary}>
          Go to your personal account
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )
}

const styles = {
  center: {
    display: 'flex',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 18,
  },
  container: {
    position: 'relative',
    height: '100vh',
    backgroundImage: 'url("/bg-path.webp")',
    backgroundSize: 'cover',
  },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  content: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#d4af37',
    padding: '0 16px',
    textAlign: 'center',
  },
  title: { fontSize: 28, marginBottom: 16 },
  message: { fontSize: 16, color: '#7CFC00', marginBottom: 12 },
  status: { fontSize: 16, marginBottom: 12 },
  burnButton: {
    padding: '10px 24px',
    backgroundColor: '#d4af37',
    border: 'none',
    borderRadius: 6,
    color: '#000',
    fontSize: 16,
    marginBottom: 12,
  },
  secondary: {
    padding: '10px 24px',
    background: 'transparent',
    border: '1px solid #d4af37',
    borderRadius: 6,
    color: '#d4af37',
    fontSize: 14,
    marginBottom: 12,
    cursor: 'pointer',
  },
  error: { color: '#FF6347', fontSize: 14, marginTop: 12 },
}
