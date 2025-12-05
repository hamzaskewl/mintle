'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ScoreIndicator } from './ScoreIndicator'
import { Category } from '@/lib/game/types'
import { getTimeUntilReset } from '@/lib/game/daily-seed'
import { getStreak, hasPlayedToday } from '@/lib/game/game-logic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { mintNFT, shareToBase } from '@/lib/nft/mint'
import { GameResultNFT } from '@/lib/nft/types'
import { useAccount } from 'wagmi'
import { sdk } from '@farcaster/miniapp-sdk'

interface GameOverProps {
  score: number
  total: number
  results: ('correct' | 'wrong' | 'pending')[]
  category: Category
}

export function GameOver({ score, total, results, category }: GameOverProps) {
  const router = useRouter()
  const { address, isConnected } = useAccount() // Get address from Base Account via Wagmi
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilReset())
  const [streak, setStreak] = useState({ current: 0, best: 0 })
  const [hasPlayedOther, setHasPlayedOther] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [mintSuccess, setMintSuccess] = useState(false)
  const [nftUrl, setNftUrl] = useState<string | null>(null)
  const [mintError, setMintError] = useState<string | null>(null)
  
  useEffect(() => {
    setStreak(getStreak())
    
    // Check if the other category has been played
    const otherCategory = category === 'movies' ? 'spotify' : 'movies'
    setHasPlayedOther(hasPlayedToday(otherCategory))
    
    // Save score to leaderboard if address is available
    const saveScore = async () => {
      if (address) {
        try {
          const gameDate = new Date().toISOString().split('T')[0]
          await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: address,
              category,
              score,
              gameDate
            })
          })
        } catch (error) {
          console.error('Failed to save score:', error)
          // Non-fatal error - continue even if score save fails
        }
      }
    }
    
    saveScore()
    
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [address, category, score])
  
  const isPerfect = score === total
  const shareText = `Mintle ${category === 'movies' ? '🎬' : '🎵'}\n${results.map(r => r === 'correct' ? '🟢' : '🔴').join('')}\nScore: ${score}/${total}\n🔥 Streak: ${streak.current}`
  
  const otherCategory = category === 'movies' ? 'spotify' : 'movies'
  const nextUrl = hasPlayedOther ? '/' : `/play/${otherCategory}`
  const nextLabel = hasPlayedOther ? 'Home' : 'Next'
  
  const handleMintAndShare = async () => {
    setIsMinting(true)
    setMintError(null)
    setMintSuccess(false)
    
    try {
      // Check if Base Account is connected
      if (!isConnected && !address) {
        setMintError('Please connect your Base Account to mint NFTs. The Base Account should connect automatically in the Base App.')
        setIsMinting(false)
        return
      }
      
      const gameResult: GameResultNFT = {
        category,
        score,
        total,
        results,
        date: new Date().toISOString().split('T')[0],
        streak: streak.current,
        perfect: isPerfect
      }
      
      console.log('Minting with address:', address, 'isConnected:', isConnected)
      
      // Mint NFT - this will actually send the transaction on-chain
      // Pass the address from Base Account if available
      const mintResult = await mintNFT(gameResult, address || undefined)
      
      if (mintResult.success) {
        // Check if we got a transaction hash (actual on-chain mint)
        if (mintResult.txHash) {
          setMintSuccess(true)
          
          // Wait for transaction confirmation (optional, but good UX)
          // Use Sepolia explorer since contract is on Sepolia
          const baseScanUrl = mintResult.txHash.startsWith('0x')
            ? `https://sepolia.basescan.org/tx/${mintResult.txHash}`
            : mintResult.metadataUri || null
          
          // Create NFT page URL (token view on BlockScout Sepolia)
          const contractAddress = '0xCc083Bf246800466E831907C2f9D04389d86f265' // Sepolia contract
          const nftPageUrl = mintResult.tokenId
            ? `https://base-sepolia.blockscout.com/token/${contractAddress}/instance/${mintResult.tokenId}`
            : baseScanUrl
          
          setNftUrl(nftPageUrl || baseScanUrl)
          
          // Don't auto-share - let user click the separate "Share on Farcaster" button
        } else {
          // No transaction hash - minting failed or wallet not connected
          setMintSuccess(false)
          const errorMsg = mintResult.error || 'Transaction not sent. Please connect a wallet to mint on-chain.'
          setMintError(errorMsg)
          
          // Don't share if minting failed - show error instead
          console.error('Minting failed:', errorMsg)
          
          // Only set metadata URL if we have it, but don't share
          if (mintResult.metadataUri) {
            setNftUrl(mintResult.metadataUri)
          }
        }
      } else {
        setMintError(mintResult.error || 'Failed to mint NFT')
        // Don't share if minting failed
      }
    } catch (error) {
      console.error('Mint and share error:', error)
      setMintError(error instanceof Error ? error.message : 'Failed to mint NFT')
    } finally {
      setIsMinting(false)
    }
  }
  
  const handleShare = async (nftUrl?: string, txHash?: string) => {
    const shareTextWithNFT = nftUrl 
      ? `${shareText}\n\n${txHash ? '🎉 NFT Minted!' : 'NFT Metadata'}: ${nftUrl}`
      : shareText
    
    if (navigator.share) {
      await navigator.share({
        title: 'Mintle - Daily More or Less',
        text: shareTextWithNFT,
        url: nftUrl || 'https://mintle.vercel.app'
      })
    } else {
      await navigator.clipboard.writeText(shareTextWithNFT)
      alert('Results copied to clipboard!')
    }
  }
  
  const handleShareToFarcaster = async () => {
    try {
      // Generate OG image URL
      const resultPattern = results
        .map(r => r === 'correct' ? '1' : '0')
        .join('')
      
      const ogImageUrl = `${window.location.origin}/api/og?category=${category}&score=${score}&total=${total}&streak=${streak.current}&perfect=${isPerfect}&pattern=${resultPattern}`
      
      // Format date nicely
      const today = new Date()
      const dateStr = today.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
      
      // Create share message
      const categoryName = category === 'movies' ? 'Movies' : 'Spotify'
      const categoryEmoji = category === 'movies' ? '🎬' : '🎵'
      const shareMessage = `I scored ${score}/${total} on Mintle ${categoryName} today (${dateStr})! ${categoryEmoji}\n\nPlay: https://mintle.vercel.app`
      
      // Use Base SDK to open Farcaster compose with OG image embed
      if (typeof window !== 'undefined' && sdk) {
        // Warpcast compose URL with embeds
        const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareMessage)}&embeds[]=${encodeURIComponent(ogImageUrl)}`
        
        await sdk.actions.openUrl(composeUrl)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareMessage}\n\n${ogImageUrl}`)
        alert('Share text copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing to Farcaster:', error)
      alert('Failed to share. Please try again.')
    }
  }
  
  const handleNext = () => {
    router.push(nextUrl)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm mx-auto relative"
    >
      {/* Close button */}
      <button
        onClick={() => router.push('/')}
        className="absolute -top-2 -right-2 w-8 h-8 bg-bg-card hover:bg-error/80 rounded-full flex items-center justify-center text-text-primary hover:text-white transition-all duration-200 border-2 border-white/10 hover:border-error z-10"
      >
        ✕
      </button>
      
      <Card className="w-full text-center p-6">
        {/* Result header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-4xl mb-2"
        >
          {isPerfect ? '🏆' : score >= 3 ? '⭐' : '💪'}
        </motion.div>
        
        <h2 className="text-xl font-bold text-text-primary mb-3">
          {isPerfect ? 'Perfect!' : score >= 3 ? 'Great job!' : 'Nice try!'}
        </h2>
        
        {/* Score display */}
        <div className="mb-3">
          <div className="text-4xl font-mono font-bold text-accent-cyan">
            {score}<span className="text-text-muted">/{total}</span>
          </div>
        </div>
        
        {/* Result dots */}
        <div className="flex justify-center mb-4">
          <ScoreIndicator total={total} results={results} currentRound={total} />
        </div>
        
        {/* Streak & Next game in one row */}
        <div className="flex justify-between items-center gap-4 py-3 border-y border-white/10 mb-4">
          <div className="text-center flex-1">
            <div className="text-xl font-bold text-accent-blue">{streak.current}</div>
            <div className="text-xs text-text-muted">Streak</div>
          </div>
          <div className="text-center flex-1">
            <div className="font-mono text-lg text-text-primary">
              {String(timeUntilReset.hours).padStart(2, '0')}:
              {String(timeUntilReset.minutes).padStart(2, '0')}:
              {String(timeUntilReset.seconds).padStart(2, '0')}
            </div>
            <div className="text-xs text-text-muted">Next game</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-xl font-bold text-accent-purple">{streak.best}</div>
            <div className="text-xs text-text-muted">Best</div>
          </div>
        </div>
        
        {/* Mint Status */}
        {mintSuccess && nftUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-success/20 border border-success/50 rounded-lg"
          >
            <div className="text-sm text-success font-semibold mb-1">
              ✨ NFT Minted Successfully!
            </div>
            <a
              href={nftUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-success/80 hover:text-success underline break-all"
            >
              View NFT
            </a>
          </motion.div>
        )}
        
        {mintError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-error/20 border border-error/50 rounded-lg"
          >
            <div className="text-sm text-error font-semibold">
              ⚠️ {mintError}
            </div>
          </motion.div>
        )}
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            className="w-full py-3"
            onClick={handleMintAndShare}
            disabled={isMinting}
          >
            {isMinting ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Minting NFT...
              </>
            ) : (
              <>
                🎨 Mint NFT
              </>
            )}
          </Button>
          
          {/* Show Share on Farcaster button only after successful mint */}
          {mintSuccess && (
            <Button
              variant="primary"
              className="w-full py-3 bg-accent-blue hover:bg-accent-blue/80"
              onClick={handleShareToFarcaster}
            >
              📱 Share on Farcaster
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 py-2"
              onClick={() => handleShare(nftUrl || undefined)}
              disabled={isMinting}
            >
              Share 📤
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 py-2"
              onClick={handleNext}
            >
              {nextLabel} {!hasPlayedOther && (category === 'movies' ? '🎵' : '🎬')}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

