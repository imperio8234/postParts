'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function LoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Start loading when route changes
    setIsLoading(true)
    setProgress(20)

    // Simulate progress
    const timer1 = setTimeout(() => setProgress(40), 100)
    const timer2 = setTimeout(() => setProgress(60), 300)
    const timer3 = setTimeout(() => setProgress(80), 500)

    // Complete loading
    const completeTimer = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        setProgress(0)
      }, 200)
    }, 700)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(completeTimer)
    }
  }, [pathname, searchParams])

  if (!isLoading && progress === 0) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-600 transition-all duration-300 ease-out"
      style={{ width: `${progress}%` }}
    />
  )
}
