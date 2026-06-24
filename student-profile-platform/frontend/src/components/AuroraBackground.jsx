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
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 })

  const [particles, setParticles] = useState([])

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
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

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
          className="fixed w-[360px] h-[360px] rounded-full blur-[100px] pointer-events-none opacity-[0.16] mix-blend-screen"
          style={{
            left: springX,
            top: springY,
            background: 'radial-gradient(circle, var(--cyan) 0%, var(--emerald) 60%, transparent 100%)',
            transform: 'translate(-50%, -50%)',
          }}
        />

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
