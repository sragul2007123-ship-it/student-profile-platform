import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function MagneticButton({ children, to, onClick, className = '', variant = 'primary' }) {
  const ref = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouse = (e) => {
    const { clientX, clientY } = e
    const { height, width, left, top } = ref.current.getBoundingClientRect()
    const middleX = clientX - (left + width / 2)
    const middleY = clientY - (top + height / 2)
    
    // Smooth magnetic attraction force (offset by 0.35)
    setPosition({ x: middleX * 0.35, y: middleY * 0.35 })
  }

  const reset = () => {
    setPosition({ x: 0, y: 0 })
    setIsHovered(false)
  }

  const baseStyles = "relative inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold transition-all duration-500 overflow-hidden group cursor-pointer"
  const variants = {
    primary: "bg-gradient-to-r from-[var(--emerald)] to-[var(--cyan)] text-[var(--background)] font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,198,0.25)] hover:shadow-[0_0_30px_rgba(0,212,255,0.45)] border-none",
    secondary: "border border-white/10 bg-slate-950/40 text-[var(--text)] hover:border-[var(--emerald)]/50 hover:text-[var(--emerald)] backdrop-blur-md",
    ghost: "text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5"
  }

  const content = (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove => {
        handleMouse(handleMouseMove);
        setIsHovered(true);
      }}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 180, damping: 12, mass: 0.1 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {/* Dynamic light bloom flare following cursor */}
      {isHovered && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(255,255,255,0.15)_0%,transparent_50%)] pointer-events-none z-0" />
      )}
      
      {/* Sliding border overlay animation */}
      <span className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
      
      <span className="relative z-10 flex items-center gap-2 pointer-events-none">{children}</span>
    </motion.button>
  )

  if (to) {
    return <Link to={to} className="inline-block">{content}</Link>
  }

  return content
}
