import { useEffect, useState } from 'react'

/**
 * Hook for animating number count-up
 */
export function useCountUp(
  end: number,
  duration: number = 2000,
  start: boolean = false
) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    if (!start) {
      setCount(0)
      return
    }
    
    const startTime = Date.now()
    const startValue = 0
    
    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      
      const currentValue = startValue + (end - startValue) * easeOutQuart
      setCount(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }
    
    requestAnimationFrame(animate)
  }, [end, duration, start])
  
  return count
}

