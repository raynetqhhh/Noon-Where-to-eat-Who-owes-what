import { useCallback, useEffect, useRef, useState } from 'react';
import { getSession } from '../api/sessions.js';
import { supabase } from '../lib/supabase.js';

const FALLBACK_POLL_MS = 15000;

/**
 * Loads a lunch and keeps it live on everyone's phone.
 * After any change, call notify(): it pings everyone else on a Supabase
 * Realtime broadcast channel and they refetch instantly. A slow poll is a
 * safety net if Realtime is unavailable.
 */
export function useSession(code) {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      setSession(await getSession(code));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    refresh();

    let channel = null;
    if (supabase) {
      channel = supabase
        .channel(`noon:${code.toUpperCase()}`)
        .on('broadcast', { event: 'changed' }, () => refresh())
        .subscribe();
      channelRef.current = channel;
    }

    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, FALLBACK_POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(poll);
      window.removeEventListener('focus', onFocus);
      if (channel) supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [code, refresh]);

  /** Refetch for me, and tell everyone else to refetch. */
  const notify = useCallback(async () => {
    channelRef.current?.send({ type: 'broadcast', event: 'changed', payload: { at: Date.now() } });
    await refresh();
  }, [refresh]);

  return { session, error, loading, refresh, notify, isLive: Boolean(supabase) };
}
