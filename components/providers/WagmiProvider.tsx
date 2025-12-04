'use client'

import { WagmiProvider as WagmiProviderBase } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { config, queryClient } from '@/lib/wagmi/config'

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProviderBase config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProviderBase>
  )
}

