// src/screens/Path.jsx
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app'

export default function Path() {
  const navigate = useNavigate()
  const [tgId, setTgId] = useState('')
  const [fragments, setFragments] = useState([])
  const [lastBurn, setLastBurn] = useState(null)
  const [isCursed, setIsCursed] = useState(false)
  const [curseExpires, setCurseExpires] = useState(null)
  const [cooldown, setCooldown] = useState(0)

  const [loading, setLoading] = useState(true)
  const [burning, setBurning] = useState(false)
  const [invoiceId, setInvoiceId] = useState(null)
  const [deepLink, setDeepLink] = useState('')
  const [hubLink, setHubLink] = useState('')
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')
  const [newFragment, setNewFragment] = useState(null)

  const pollingRef = useRef(null)
  const COOLDOWN = 2 * 60

  // вычисляем остаток кулдауна
  const computeCD = last =>
    last
      ? Math.max(
          0,
          COOLDOWN -
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

  // mount: читаем initData, токен, профиль и незавершённый счёт
  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initDataUnsafe || {}
    const id = initData.user?.id
    if (!id) return navigate('/init')
    setTgId(String(id))

    if (!localStorage.getItem('token')) return navigate('/init')

    // восстанавливаем старый
    const oldInv = localStorage.getItem('invoiceId')
    const oldDeep = localStorage.getItem('deepLink')
    const oldHub = localStorage.getItem('hubLink')
    if (oldInv && oldDeep && oldHub) {
      setInvoiceId(oldInv)
      setDeepLink(oldDeep)
      setHubLink(oldHub)
      setPolling(true)
      pollingRef.current = setInterval(() => checkStatus(oldInv), 5000)
    }

    // загружаем профиль
    loadProfile(id)
    window.addEventListener('focus', () => loadProfile(id))
    return () => window.removeEventListener('focus', () => loadProfile(id))
  }, [navigate])

  // загрузка профиля
  async function loadProfile(id) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/player/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      const na = res.headers.get('Authorization')
      if (na?.startsWith('Bearer ')) localStorage.setItem('token', na.split(' ')[1])
      if (!res.ok) throw new Error()
      const u = await res.json()
      setFragments(u.fragments || [])
      setLastBurn(u.last_burn)
      if (u.curse_expires && new Date(u.curse_expires) > new Date()) {
        setIsCursed(true)
        setCurseExpires(u.curse_expires)
      } else {
        setIsCursed(false)
        setCurseExpires(null)
        setCooldown(computeCD(u.last_burn))
      }
    } catch {
      navigate('/init')
    } finally {
      setLoading(false)
    }
  }

  // создать инвойс
  const handleBurn = async () => {
    setBurning(true)
    setError('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/burn-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tg_id: tgId })
      })
      const na = res.headers.get('Authorization')
      if (na?.startsWith('Bearer ')) localStorage.setItem('token', na.split(' ')[1])
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '⚠️ Could not create invoice')
        setBurning(false)
        return
      }

      // хаб-линк идёт от бэка (tonhub.com/…?amount=0.5…)
      const hub = data.paymentUrl

      // строим deep для TON-клиента внутри Telegram
      // у tonhub это https://tonhub.com/transfer/<addr>?amount=0.5&text=…
      // у deep — просто протокол и та же часть после host
      const u = new URL(hub)
      const deep = `ton://${u.pathname.slice(1)}${u.search}`

      // сохраняем
      setInvoiceId(data.invoiceId)
      setDeepLink(deep)
      setHubLink(hub)
      localStorage.setItem('invoiceId', data.invoiceId)
      localStorage.setItem('deepLink', deep)
      localStorage.setItem('hubLink', hub)

      // сбросим burning, чтобы появилась кнопка Continue…
      setBurning(false)

      // стартуем polling
      setPolling(true)
      pollingRef.current = setInterval(() => checkStatus(data.invoiceId), 5000)
    } catch (e) {
      setError(`⚠️ ${e.message}`)
      setBurning(false)
    }
  }

  // проверка статуса
  const checkStatus = async id => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/burn-status/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      const na = res.headers.get('Authorization')
      if (na?.startsWith('Bearer ')) localStorage.setItem('token', na.split(' ')[1])
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'status error')
      if (d.paid) {
        clearInterval(pollingRef.current)
        setPolling(false)
        setBurning(false)
        localStorage.removeItem('invoiceId')
        localStorage.removeItem('deepLink')
        localStorage.removeItem('hubLink')
        if (d.cursed) {
          setError(`⚠️ You are cursed until ${new Date(d.curse_expires).toLocaleString()}`)
          setIsCursed(true)
          setCurseExpires(d.curse_expires)
        } else {
          setNewFragment(d.newFragment)
          setFragments(d.fragments)
          setIsCursed(false)
          setCurseExpires(null)
          setLastBurn(d.lastBurn)
          setCooldown(computeCD(d.lastBurn))
        }
      }
    } catch (e) {
      clearInterval(pollingRef.current)
      setPolling(false)
      setBurning(false)
      setError(`⚠️ ${e.message}`)
    }
  }

  if (loading) {
    return <div style={styles.center}>Loading…</div>
  }
  const ft = sec => {
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
          <p style={styles.status}>⏳ Next burn in {ft(cooldown)}</p>
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
                : 'pointer'
          }}
        >
          {burning
            ? 'Creating invoice…'
            : polling
            ? 'Waiting for payment…'
            : '🔥 Burn Yourself for 0.5 TON'}
        </button>

        {polling && deepLink && (
          <>
            <button
              onClick={() => {
                try {
                  window.Telegram.WebApp.openLink(deepLink)
                } catch (_) {
                  window.location.assign(deepLink)
                }
              }}
              style={styles.secondary}
            >
              Continue Payment in Telegram Wallet
            </button>
            <button
              onClick={() => window.open(hubLink, '_blank')}
              style={styles.secondary}
            >
              Open in Tonhub
            </button>
          </>
        )}

        <button
          onClick={() => navigate('/profile')}
          style={styles.secondary}
        >
          Go to your personal account
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )
}

const styles = {
  center:   { display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18 },
  container:{ position:'relative',height:'100vh',backgroundImage:'url("/bg-path.webp")',backgroundSize:'cover' },
  overlay:  { position:'absolute',inset:0,backgroundColor:'rgba(0,0,0,0.5)' },
  content:  { position:'relative',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'#d4af37',padding:'0 16px',textAlign:'center' },
  title:    { fontSize:28,marginBottom:16 },
  message:  { fontSize:16,color:'#7CFC00',marginBottom:12 },
  status:   { fontSize:16,marginBottom:12 },
  burnButton:{ padding:'10px 24px',backgroundColor:'#d4af37',border:'none',borderRadius:6,color:'#000',fontSize:16,marginBottom:12 },
  secondary:{ padding:'10px 24px',background:'transparent',border:'1px solid #d4af37',borderRadius:6,color:'#d4af37',fontSize:14,marginBottom:12,cursor:'pointer' },
  error:    { color:'#FF6347',fontSize:14,marginTop:12 }
}
