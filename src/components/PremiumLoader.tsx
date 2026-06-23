import { motion } from 'framer-motion'

export default function PremiumLoader(){
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{background:'linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.8))', zIndex:9999}}>
      <motion.div animate={{ rotate:360 }} transition={{ repeat: Infinity, duration: 8, ease:'linear' }} style={{width:96,height:96,borderRadius:24,background:'linear-gradient(135deg,var(--emerald),var(--cyan))', boxShadow:'0 12px 40px rgba(0,212,255,0.08)'}} />
      <div className="sr-only">Loading ACADEMICOS</div>
    </div>
  )
}
