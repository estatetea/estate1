import { useEffect, useRef, useState } from 'react';

// A tab left open keeps running the version it loaded; offer a refresh once a newer one is live.
export function UpdateBanner() {
  const loaded = useRef(null);
  const [stale, setStale] = useState(false);
  useEffect(() => {
    const check = async () => {
      try {
        const { version } = await (await fetch('/api/version', { cache: 'no-store' })).json();
        if (!loaded.current) loaded.current = version;
        else if (version && version !== loaded.current) setStale(true);
      } catch { /* offline: try again later */ }
    };
    check();
    const t = setInterval(check, 5 * 60 * 1000);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  if (!stale) return null;
  return <div className="fixed inset-x-0 top-0 z-[90] flex justify-center p-2">
    <button onClick={() => window.location.reload()} className="rounded-full bg-[#efbd63] px-4 py-2 text-xs font-medium text-black shadow-lg">A new version of the app is available · Refresh</button>
  </div>;
}
