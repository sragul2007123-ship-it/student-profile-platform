import { ReactNode } from 'react'

type Props = {children: ReactNode, className?: string}

export default function GlassCard({children, className = ''}:Props){
  return (
    <div className={`glass-card ${className}`}>
      <div className="glass-inner">
        {children}
      </div>
    </div>
  )
}
