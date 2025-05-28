import { useEffect, useState } from 'react';

export default function Init() {
  const [tgId, setTgId] = useState('');
  const [debug, setDebug] = useState('');
  const [initDataRaw, setInitDataRaw] = useState('');
  const [initDataUnsafe, setInitDataUnsafe] = useState('');
  const [telegramDump, setTelegramDump] = useState('');

  useEffect(() => {
    const tg = window.Telegram;
    const wa = tg?.WebApp;
    const initData = wa?.initData || '';
    const initDataUnsafeObj = wa?.initDataUnsafe || {};

    setInitDataRaw(initData || '—');
    setInitDataUnsafe(JSON.stringify(initDataUnsafeObj, null, 2) || '—');

    try {
      const dump = JSON.stringify({
        tgExists: !!tg,
        waExists: !!wa,
        initData: initData,
        initDataUnsafe: initDataUnsafeObj,
        user: initDataUnsafeObj?.user,
      }, null, 2);

      setTelegramDump(dump);
    } catch (e) {
      setTelegramDump('Failed to parse Telegram object');
    }

    if (initDataUnsafeObj?.user?.id) {
      setTgId(initDataUnsafeObj.user.id.toString());
      setDebug('✅ initDataUnsafe.user.id получен');
    } else {
      setDebug('❌ initDataRaw not found or no user ID');
    }
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', color: '#f9d342', backgroundColor: '#0f1218', minHeight: '100vh' }}>
      <h2 style={{ color: '#f9d342' }}>Enter the Ash</h2>
      <p>TG ID: {tgId || '—'}</p>
      <p>Debug: {debug}</p>

      <div style={{ marginTop: 16 }}>
        <p><strong>window.Telegram.WebApp.initData:</strong></p>
        <textarea readOnly value={initDataRaw} style={{ width: '100%', height: 100 }} />

        <p><strong>initDataUnsafe:</strong></p>
        <textarea readOnly value={initDataUnsafe} style={{ width: '100%', height: 100 }} />

        <p><strong>window.Telegram dump:</strong></p>
        <textarea readOnly value={telegramDump} style={{ width: '100%', height: 200 }} />
      </div>
    </div>
  );
}
