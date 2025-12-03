import type { Metadata } from 'next'
import { Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
})

export const metadata: Metadata = {
  title: 'MorL - Daily More or Less',
  description: 'Guess higher or lower in this daily challenge game',
  openGraph: {
    title: 'MorL - Daily More or Less',
    description: 'Guess higher or lower in this daily challenge game',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrains.variable}`}>
      <body className="font-sans">
        <div className="min-h-screen flex flex-col">
          {/* Ambient background effects */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
          </div>
          
          {/* Main content */}
          <main className="relative z-10 flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

