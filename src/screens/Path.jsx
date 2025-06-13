import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app'

export default function Path() {
  const navigate = useNavigate()

  // профиль
  const [tgId, setTgId]           = useState('')
  const [fragments, setFragments] = useState([])
  const [lastBurn, setLastBurn]   = useState(null)
  const [isCursed, setIsCursed]   = useState(false)
  const [curseExpires, setCurseExpires] = useState(null)
  const [cooldown, setCooldown]   = useState(0)

  // платёж
  const [loading, setLoading]     = useState(true)
  const [burning, setBurning]     = useState(false)
  const [invoiceLink, setInvoiceLink] = useState('')  // нативный Telegram invoice link
  const [error, setError]         = useState('')
  const [newFragment, setNewFragment] = useState(null)

  const pollingRef = useRef(null)
  const COOLDOWN_SECONDS = 2 * 60

  // вычисляем остаток кулдауна
  const computeCooldown = last => {
    if (!last) return 0
    const elapsed = (Date.now() - new Date(last).getTime()) / 1000
    return Math.max(0, COOLDOWN_SECONDS - Math.floor(elapsed))
  }

  // тикер кулдауна
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => {
      setCooldown(c => (c > 1 ? c - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [cooldown])

  // 1) вынесенная функция загрузки профиля
  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/player/${tgId}`, {
        headers: { 'Content-Type': 'application/json' },
      })
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
  }, [tgId, navigate])

  // 2) инициализация и первая загрузка
  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {}
    const userId = unsafe.user?.id
    const token  = localStorage.getItem('token')

    if (!userId || !token) {
      return navigate('/init')
    }
    setTgId(String(userId))

    // если в localStorage остался незавершённый invoice
    const savedLink = localStorage.getItem('invoiceLink')
    if (savedLink) {
      setInvoiceLink(savedLink)
    }

    loadProfile()
    window.addEventListener('focus', loadProfile)
    return () => window.removeEventListener('focus', loadProfile)
  }, [loadProfile, navigate])

  // 3) создание invoice через наш БЭК (который вызывает Bot API)
  const handleBurn = async () => {
    setBurning(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${BACKEND_URL}/api/create-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tg_id: tgId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Could not create invoice')
      }
      const { invoiceLink: link } = await res.json()
      setInvoiceLink(link)
      localStorage.setItem('invoiceLink', link)

      // нативный Telegram Mini App платеж:
      if (window.Telegram.WebApp.openInvoice) {
        window.Telegram.WebApp.openInvoice(link)
      } else {
        // fallback
        window.location.href = link
      }
    } catch (e) {
      setError(e.message)
      setBurning(false)
    }
  }

  // 4) ловим событие об успешной оплате
  useEffect(() => {
    const onSuccess = payload => {
      // можно прочитать payload.successful_payment, payload.invoice_payload и т.д.
      localStorage.removeItem('invoiceLink')
      setInvoiceLink('')
      setBurning(false)
      loadProfile()
    }
    window.Telegram?.WebApp?.onEvent('payment_success', onSuccess)
    return () => {
      window.Telegram?.WebApp?.offEvent('payment_success', onSuccess)
    }
  }, [loadProfile])

  if (loading) {
    return <div style={styles.center}>Loading...</div>
  }

  const formatTime = sec => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0')
    const s = String(sec % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div style={styles.container}>
      <div style={styles.overlay}/>
      <div style={styles.content}>
        <h2 style={styles.title}>The Path Begins</h2>

        {newFragment && (
          <p style={styles.message}>🔥 You received fragment #{newFragment}!</p>
        )}

        {isCursed
          ? <p style={styles.status}>⚠️ You are cursed until {new Date(curseExpires).toLocaleString()}</p>
          : cooldown > 0
            ? <p style={styles.status}>⏳ Next burn in {formatTime(cooldown)}</p>
            : <p style={styles.status}>Ready to burn yourself.</p>
        }

        <button
          onClick={handleBurn}
          disabled={burning || isCursed || cooldown > 0}
          style={{
            ...styles.burnButton,
            opacity: (burning||isCursed||cooldown>0) ? 0.6 : 1,
            cursor:  (burning||isCursed||cooldown>0) ? 'not-allowed' : 'pointer'
          }}
        >
          { burning
            ? 'Creating invoice…'
            : invoiceLink
              ? 'Waiting for payment…'
              : '🔥 Burn Yourself for 0.5 TON'
          }
        </button>

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={() => navigate('/profile')}
          style={styles.secondary}
        >
          Go to your personal account
        </button>
      </div>
    </div>
  )
}

const styles = {
  center:    { display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18 },
  container: { position:'relative',height:'100vh',backgroundImage:'url("/bg-path.webp")',backgroundSize:'cover' },
  overlay:   { position:'absolute',inset:0,backgroundColor:'rgba(0,0,0,0.5)' },
  content:   { position:'relative',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'#d4af37',padding:'0 16px',textAlign:'center' },
  title:     { fontSize:28,marginBottom:16 },
  message:   { fontSize:16,color:'#7CFC00',marginBottom:12 },
  status:    { fontSize:16,marginBottom:12 },
  burnButton:{ padding:'10px 24px',backgroundColor:'#d4af37',border:'none',borderRadius:6,color:'#000',fontSize:16,marginBottom:12 },
  secondary: { padding:'10px 24px',background:'transparent',border:'1px solid #d4af37',borderRadius:6,color:'#d4af37',fontSize:14,marginBottom:12,cursor:'pointer' },
  error:     { color:'#FF6347',fontSize:14,marginTop:12 }
}
