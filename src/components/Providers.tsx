'use client';

import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Dynamically derive the base URL from environment variable or window location
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  const manifestUrl = `${baseUrl}/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
}