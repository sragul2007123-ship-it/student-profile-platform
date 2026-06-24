import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { themeColorsMap } from '../pages/Dashboard'

export default function AuroraBackground({ children }) {
  const { themeColor } = useTheme()
  const themeColors = themeColorsMap[themeColor] || themeColorsMap.primary

  // Mouse movement values for Spotlight Cursor Reactive glow
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const spotlightOpacity = useMotionValue(0.16)
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 })
  const springOpacity = useSpring(spotlightOpacity, { stiffness: 80, damping: 22 })

  const [particles, setParticles] = useState([])
  const [touchEffects, setTouchEffects] = useState([])

  const addTouchEffect = (x, y) => {
    const id = Date.now() + Math.random()
    const newSparks = Array.from({ length: 6 }).map((_, i) => ({
      id: `${id}-spark-${i}`,
      x,
      y,
      angle: (i * 2 * Math.PI) / 6 + (Math.random() - 0.5) * 0.5,
      distance: 50 + Math.random() * 40,
      size: 2 + Math.random() * 2,
    }))
    
    const newEffect = {
      id,
      x,
      y,
      sparks: newSparks
    }
    
    setTouchEffects((prev) => [...prev.slice(-4), newEffect])
  }

  useEffect(() => {
    // Generate organic 3D floating particles
    const list = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3.5 + 1,
      delay: Math.random() * -30, // Start immediately
      duration: 15 + Math.random() * 20,
      driftX: (Math.random() - 0.5) * 15,
    }))
    setParticles(list)

    const handleMouseMove = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      spotlightOpacity.set(0.16)
    }

    const handleMouseLeave = () => {
      spotlightOpacity.set(0)
    }

    const handleMouseDown = (e) => {
      addTouchEffect(e.clientX, e.clientY)
    }

    const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        const x = e.touches[0].clientX
        const y = e.touches[0].clientY
        mouseX.set(x)
        mouseY.set(y)
        spotlightOpacity.set(0.24)
        addTouchEffect(x, y)
      }
    }

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        mouseX.set(e.touches[0].clientX)
        mouseY.set(e.touches[0].clientY)
      }
    }

    const handleTouchEnd = () => {
      spotlightOpacity.set(0)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [mouseX, mouseY, spotlightOpacity])

  return (
    <div 
      className="relative min-h-screen bg-[var(--background)] overflow-hidden w-full"
      style={{
        '--emerald': themeColors.emerald,
        '--cyan': themeColors.cyan,
      }}
    >
      {/* Background Mesh and Noise Grid */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 mesh-grid opacity-[0.25]" />
        <div className="absolute inset-0 noise-overlay" />
        
        {/* Dynamic Living Aurora Mesh Orbs */}
        <motion.div
          animate={{
            x: [0, 80, -80, 0],
            y: [0, -40, 40, 0],
            scale: [1, 1.15, 0.85, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-15%] left-[-15%] w-[50vw] h-[50vh] rounded-full opacity-[0.18] blur-[120px] animate-aurora-mesh"
          style={{ backgroundColor: 'var(--emerald)' }}
        />
        <motion.div
          animate={{
            x: [0, -80, 80, 0],
            y: [0, 40, -40, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-15%] right-[-15%] w-[55vw] h-[55vh] rounded-full opacity-[0.18] blur-[130px] animate-aurora-mesh"
          style={{ backgroundColor: 'var(--cyan)' }}
        />
        <motion.div
          animate={{
            x: [0, 40, -40, 0],
            y: [0, 80, -80, 0],
            scale: [1, 1.25, 0.75, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-[25%] left-[35%] w-[35vw] h-[35vh] rounded-full opacity-[0.12] blur-[100px] animate-aurora-mesh"
          style={{ backgroundColor: 'var(--gold)' }}
        />

        {/* Global Cursor Spotlight Reactive Glow */}
        <motion.div
          className="fixed w-[360px] h-[360px] rounded-full blur-[100px] pointer-events-none mix-blend-screen"
          style={{
            left: springX,
            top: springY,
            opacity: springOpacity,
            background: 'radial-gradient(circle, var(--cyan) 0%, var(--emerald) 60%, transparent 100%)',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Touch/Click Interaction Ripples & Sparks */}
        {touchEffects.map((effect) => (
          <React.Fragment key={effect.id}>
            {/* Shockwave ripple */}
            <motion.div
              className="fixed rounded-full pointer-events-none z-0 border border-[var(--cyan)]"
              style={{
                left: effect.x,
                top: effect.y,
                x: '-50%',
                y: '-50%',
                width: 12,
                height: 12,
                background: 'radial-gradient(circle, rgba(0,255,198,0.15) 0%, transparent 80%)',
                boxShadow: '0 0 20px rgba(0,255,198,0.3)',
              }}
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 10, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              onAnimationComplete={() => {
                setTouchEffects(prev => prev.filter(e => e.id !== effect.id))
              }}
            />
            {/* Neural sparks flying out */}
            {effect.sparks.map((spark) => (
              <motion.div
                key={spark.id}
                className="fixed rounded-full pointer-events-none z-0"
                style={{
                  left: spark.x,
                  top: spark.y,
                  width: spark.size,
                  height: spark.size,
                  background: 'var(--cyan)',
                  boxShadow: '0 0 8px var(--cyan)',
                }}
                initial={{ x: '-50%', y: '-50%', opacity: 1 }}
                animate={{
                  x: `calc(-50% + ${Math.cos(spark.angle) * spark.distance}px)`,
                  y: `calc(-50% + ${Math.sin(spark.angle) * spark.distance}px)`,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ))}
          </React.Fragment>
        ))}

        {/* Floating Neural Particles */}
        <div className="fixed inset-0 overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: 'radial-gradient(circle, var(--emerald) 0%, transparent 100%)',
                opacity: 0.18,
              }}
              animate={{
                y: [0, -120, 0],
                x: [0, p.driftX, 0],
                opacity: [0.05, 0.35, 0.05],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content wrapper */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
