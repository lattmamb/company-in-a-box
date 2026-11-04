import { useEffect, useState } from "react";

type Providers = { google: boolean; apple: boolean };

// Which social providers the auth server actually has credentials for.
// null = still loading; buttons for unconfigured providers are hidden.
export function useConfiguredProviders() {
  const [providers, setProviders] = useState<Providers | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/config")
      .then((r) => (r.ok ? r.json() : { google: false, apple: false }))
      .then((d: Providers) => alive && setProviders(d))
      .catch(() => { if (alive) setProviders({ google: false, apple: false }); });
    return () => { alive = false; };
  }, []);
  return providers;
}
