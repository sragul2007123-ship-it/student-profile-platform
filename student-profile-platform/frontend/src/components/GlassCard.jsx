import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export default function GlassCard({ children, className = '', hover = true, glow = false }) {
  const cardRef = useRef(null)

  // Motion values for tilt position (0 to 1 range)
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)

  // Smooth springs to tilt card on hover
  const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), { stiffness: 120, damping: 20 })
  const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), { stiffness: 120, damping: 20 })

  // Transform shine positioning organically
  const shineX = useSpring(useTransform(x, [0, 1], ['0%', '100%']), { stiffness: 120, damping: 20 })
  const shineY = useSpring(useTransform(y, [0, 1], ['0%', '100%']), { stiffness: 120, damping: 20 })

  const handleMouseMove = (e) => {
    if (!hover || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    x.set(mouseX / width)
    y.set(mouseY / height)
  }

  const handleMouseLeave = () => {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={hover ? {
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      } : {}}
      className={`relative rounded-[1.5rem] overflow-hidden backdrop-blur-2xl bg-slate-950/40 border border-white/5 shadow-2xl transition-all duration-300 ${className}`}
    >
      {/* Dynamic refraction shine reflection overlay */}
      {hover && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10 opacity-[0.12] transition-opacity duration-300 group-hover:opacity-[0.25]"
          style={{
            background: `radial-gradient(circle at var(--x) var(--y), rgba(255, 255, 255, 0.4) 0%, transparent 60%)`,
            '--x': shineX,
            '--y': shineY,
          }}
        />
      )}
      
      {/* Ambient glow border background */}
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--emerald)]/10 via-transparent to-[var(--cyan)]/10 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      
      <div className="relative z-10 w-full h-full" style={hover ? { transform: 'translateZ(15px)' } : {}}>
        {children}
      </div>
    </motion.div>
  )
}
