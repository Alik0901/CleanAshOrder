import React, { useEffect, useState, useRef } from 'react'
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

  // оплата
  const [loading, setLoading]     = useState(true)
  const [burning, setBurning]     = useState(false)
  const [invoiceId, setInvoiceId] = useState(null)
  const [links, setLinks] = useState({
    tonDeepLink: '',
    tonSpaceLink: '',
    tonHubLink: ''
  })
  const [polling, setPolling]     = useState(false)
  const [error, setError]         = useState('')
  const [newFragment, setNewFragment] = useState(null)
  const pollingRef = useRef(null)

  const COOLDOWN = 2 * 60

  const computeCooldown = ts =>
    ts
      ? Math.max(0, COOLDOWN - Math.floor((Date.now() - new Date(ts).getTime())/1000))
      : 0

  // тикер кулдауна
  useEffect(() => {
    if (!cooldown) return
    const id = setInterval(() => setCooldown(c => (c>1?c-1:0)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  // монтирование
  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe||{}
    const id = unsafe.user?.id
    if (!id) return navigate('/init')
    setTgId(String(id))

    const token = localStorage.getItem('token')
    if (!token) return navigate('/init')

    // восстановить незавершённый платёж
    const savedInv  = localStorage.getItem('invoiceId')
    const savedLinks= localStorage.getItem('links')
    if (savedInv && savedLinks) {
      setInvoiceId(savedInv)
      setLinks(JSON.parse(savedLinks))
      setPolling(true)
      pollingRef.current = setInterval(()=>checkStatus(savedInv), 5000)
    }

    // загрузка профиля
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${BACKEND_URL}/api/player/${id}`)
        if (!res.ok) throw new Error()
        const p = await res.json()
        setFragments(p.fragments||[])
        setLastBurn(p.last_burn)
        if (p.curse_expires && new Date(p.curse_expires)>new Date()) {
          setIsCursed(true)
          setCurseExpires(p.curse_expires)
        } else {
          setIsCursed(false)
          setCurseExpires(null)
          setCooldown(computeCooldown(p.last_burn))
        }
      } catch {
        navigate('/init')
      } finally {
        setLoading(false)
      }
    }

    load()
    window.addEventListener('focus', load)
    return ()=>window.removeEventListener('focus', load)
  }, [navigate])

  // шаг 1: create invoice
  const handleBurn = async () => {
    setBurning(true)
    setError('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/burn-invoice`, {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${localStorage.getItem('token')}`
        },
        body:JSON.stringify({ tg_id: tgId })
      })
      const auth = res.headers.get('Authorization')
      if (auth?.startsWith('Bearer ')) {
        localStorage.setItem('token', auth.split(' ')[1])
      }
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        setBurning(false)
        return
      }

      // сохраним и сразу откроем TonSpace → TonHub
      setInvoiceId(data.invoiceId)
      setLinks(data.links)
      localStorage.setItem('invoiceId', data.invoiceId)
      localStorage.setItem('links', JSON.stringify(data.links))

      // 1⃣ TonSpace
      window.location.href = data.links.tonSpaceLink
      // 2⃣ fallback на TonHub
      setTimeout(()=>{ window.location.href = data.links.tonHubLink }, 1500)

      // старт polling
      setPolling(true)
      pollingRef.current = setInterval(()=>checkStatus(data.invoiceId), 5000)
    } catch (e) {
      setError(e.message)
      setBurning(false)
    }
  }

  // шаг 2: check status
  const checkStatus = async inv => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/burn-status/${inv}`, {
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${localStorage.getItem('token')}`
        }
      })
      const auth = res.headers.get('Authorization')
      if (auth?.startsWith('Bearer ')) {
        localStorage.setItem('token', auth.split(' ')[1])
      }
      const data = await res.json()
      if (!res.ok) {
        clearInterval(pollingRef.current)
        setPolling(false)
        setBurning(false)
        setError(data.error)
        return
      }
      if (data.paid) {
        clearInterval(pollingRef.current)
        setPolling(false)
        setBurning(false)
        localStorage.removeItem('invoiceId')
        localStorage.removeItem('links')

        if (data.cursed) {
          setError(`⚠️ You are cursed until ${new Date(data.curse_expires).toLocaleString()}`)
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
      clearInterval(pollingRef.current)
      setError(e.message)
      setPolling(false)
      setBurning(false)
    }
  }

  if (loading) return <div style={styles.center}>Loading...</div>

  const fmt = s=>{ const m=String(Math.floor(s/60)).padStart(2,'0');const ss=String(s%60).padStart(2,'0');return `${m}:${ss}` }

  return (
    <div style={styles.container}>
      <div style={styles.overlay}/>
      <div style={styles.content}>
        <h2 style={styles.title}>The Path Begins</h2>

        {newFragment && <p style={styles.message}>🔥 You received fragment #{newFragment}!</p>}

        {isCursed
          ? <p style={styles.status}>⚠️ You are cursed until {new Date(curseExpires).toLocaleString()}</p>
          : cooldown>0
            ? <p style={styles.status}>⏳ Next burn in {fmt(cooldown)}</p>
            : <p style={styles.status}>Ready to burn yourself.</p>
        }

        <button
          onClick={handleBurn}
          disabled={
            burning||polling||
            (isCursed&&new Date(curseExpires)>new Date())||
            cooldown>0
          }
          style={{
            ...styles.burnButton,
            opacity:
              burning||polling||
              (isCursed&&new Date(curseExpires)>new Date())||
              cooldown>0
                ? 0.6
                : 1,
            cursor:
              burning||polling||
              (isCursed&&new Date(curseExpires)>new Date())||
              cooldown>0
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

        {!burning && polling && (
          <button
            onClick={()=>{
              window.location.href = links.tonSpaceLink
              setTimeout(()=>window.location.href = links.tonHubLink,1500)
            }}
            style={styles.secondary}
          >
            Continue Payment
          </button>
        )}

        <button onClick={()=>navigate('/profile')} style={styles.secondary}>
          Go to your personal account
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )
}

const styles = {
  center:   {display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18},
  container:{position:'relative',height:'100vh',backgroundImage:'url("/bg-path.webp")',backgroundSize:'cover'},
  overlay:  {position:'absolute',inset:0,backgroundColor:'rgba(0,0,0,0.5)'},
  content:  {position:'relative',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'#d4af37',padding:'0 16px',textAlign:'center'},
  title:    {fontSize:28,marginBottom:16},
  message:  {fontSize:16,color:'#7CFC00',marginBottom:12},
  status:   {fontSize:16,marginBottom:12},
  burnButton:{padding:'10px 24px',backgroundColor:'#d4af37',border:'none',borderRadius:6,color:'#000',fontSize:16,marginBottom:12},
  secondary:{padding:'10px 24px',background:'transparent',border:'1px solid #d4af37',borderRadius:6,color:'#d4af37',fontSize:14,marginBottom:12,cursor:'pointer'},
  error:    {color:'#FF6347',fontSize:14,marginTop:12}
}
