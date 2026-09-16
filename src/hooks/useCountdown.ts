import { useEffect, useState } from "react";

function diffParts(target: number) {
  const totalSeconds = Math.max(0, Math.floor((target - Date.now()) / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: totalSeconds <= 0,
  };
}

export function useCountdown(endsAt: string | null) {
  const target = endsAt ? new Date(endsAt).getTime() : null;
  const [parts, setParts] = useState(() => (target ? diffParts(target) : null));

  useEffect(() => {
    if (!target) {
      setParts(null);
      return;
    }
    setParts(diffParts(target));
    const interval = setInterval(() => setParts(diffParts(target)), 1000);
    return () => clearInterval(interval);
  }, [target]);

  return parts;
}
