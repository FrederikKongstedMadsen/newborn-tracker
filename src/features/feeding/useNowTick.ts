import { useEffect, useState } from 'react';

/** Returns current epoch ms; re-renders every second while `active`, every 30s otherwise. */
export function useNowTick(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = active ? 1000 : 30000;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [active]);

  return now;
}
