import Link from 'next/link'

export default function FloatingNavbar(){
  return (
    <header className="fixed top-5 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl z-40 glass p-3 flex items-center justify-between glass-glow" style={{borderRadius:14}}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-md" style={{background:'linear-gradient(90deg,var(--emerald),var(--cyan))'}}/>
        <span className="font-display font-bold text-lg">academicos</span>
      </div>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/">Home</Link>
        <Link href="/mission-control">Mission Control</Link>
        <Link href="/identity-hub">Identity Hub</Link>
        <Link href="/hall-of-fame">Hall Of Fame</Link>
      </nav>
    </header>
  )
}
