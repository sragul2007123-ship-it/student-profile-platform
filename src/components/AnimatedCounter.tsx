import { useEffect, useState } from 'react'

export default function AnimatedCounter({to=100}:{to?:number}){
  const [n,setN] = useState(0)
  useEffect(()=>{
    let raf = 0
    const start = performance.now()
    const dur = 900
    const tick = (t:number)=>{
      const p = Math.min(1,(t-start)/dur)
      setN(Math.floor(p*to))
      if(p<1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return ()=> cancelAnimationFrame(raf)
  },[to])
  return <span className="animated-counter">{n}</span>
}

