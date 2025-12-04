'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function BaseMiniAppBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function init() {
      try {
        // Initialize the mini app SDK
        // This tells the Base app that our app is ready to be displayed
        await sdk.actions.ready();
        console.log('Base Mini App SDK initialized');
      } catch (e) {
        console.error('Mini app sdk ready error', e);
      }
    }
    init();
  }, []);

  return <>{children}</>;
}

