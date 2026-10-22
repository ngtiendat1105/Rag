'use client'

import { useEffect, useRef } from 'react'

export default function SimpleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Particle system
    const particles: Array<{
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string
    }> = []

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: i % 3 === 0 ? '#0084e6' : i % 3 === 1 ? '#9d00ff' : '#00ffff'
      })
    }

    // Animation
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#0a0a1a')
      gradient.addColorStop(0.5, '#121230')
      gradient.addColorStop(1, '#1a1a3a')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particles.forEach(particle => {
        particle.x += particle.speedX
        particle.y += particle.speedY

        // Boundary check
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()

        // Draw glow
        const glow = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        )
        glow.addColorStop(0, particle.color + '80')
        glow.addColorStop(1, particle.color + '00')
        
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()
      })

      // Draw floating shapes (simpler version)
      const time = Date.now() * 0.001

      // Circle 1
      const circle1X = canvas.width * 0.2 + Math.sin(time * 0.5) * 50
      const circle1Y = canvas.height * 0.3 + Math.cos(time * 0.7) * 30
      const gradient1 = ctx.createRadialGradient(
        circle1X, circle1Y, 0,
        circle1X, circle1Y, 80
      )
      gradient1.addColorStop(0, '#0084e640')
      gradient1.addColorStop(1, '#0084e600')
      ctx.beginPath()
      ctx.arc(circle1X, circle1Y, 80, 0, Math.PI * 2)
      ctx.fillStyle = gradient1
      ctx.fill()

      // Circle 2
      const circle2X = canvas.width * 0.7 + Math.sin(time * 0.3) * 40
      const circle2Y = canvas.height * 0.6 + Math.cos(time * 0.5) * 50
      const gradient2 = ctx.createRadialGradient(
        circle2X, circle2Y, 0,
        circle2X, circle2Y, 60
      )
      gradient2.addColorStop(0, '#9d00ff40')
      gradient2.addColorStop(1, '#9d00ff00')
      ctx.beginPath()
      ctx.arc(circle2X, circle2Y, 60, 0, Math.PI * 2)
      ctx.fillStyle = gradient2
      ctx.fill()

      // Circle 3
      const circle3X = canvas.width * 0.4 + Math.sin(time * 0.8) * 60
      const circle3Y = canvas.height * 0.8 + Math.cos(time * 0.4) * 40
      const gradient3 = ctx.createRadialGradient(
        circle3X, circle3Y, 0,
        circle3X, circle3Y, 70
      )
      gradient3.addColorStop(0, '#00ffff40')
      gradient3.addColorStop(1, '#00ffff00')
      ctx.beginPath()
      ctx.arc(circle3X, circle3Y, 70, 0, Math.PI * 2)
      ctx.fillStyle = gradient3
      ctx.fill()

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-bg/60 to-dark-bg" />
    </div>
  )
}