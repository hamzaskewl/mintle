'use client'

import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'
import { QueryClient } from '@tanstack/react-query'

// Base Account connector - using the connector from Base docs
// Note: baseAccount might need to be imported from a different package
// For now, we'll use farcasterMiniApp which auto-connects to Base Account

export const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: [
    farcasterMiniApp(), // Automatically connects to Base Account in Base Mini App
  ],
})

export const queryClient = new QueryClient()

