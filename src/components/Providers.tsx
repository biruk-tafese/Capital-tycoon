'use client';

import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { GameProvider } from '../context/GameContext';

const MANIFEST_URL = process.env.NEXT_PUBLIC_MANIFEST_URL || 'https://capital-tycoon.vercel.app/tonconnect-manifest.json';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      <GameProvider>
        {children}
      </GameProvider>
    </TonConnectUIProvider>
  );
}