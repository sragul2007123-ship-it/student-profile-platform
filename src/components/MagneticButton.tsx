import { useRef, useEffect, ReactNode } from 'react'

export default function MagneticButton({children}:{children:ReactNode}){
  const ref = useRef<HTMLButtonElement|null>(null)
  useEffect(()=>{
    const el = ref.current
    if(!el) return
    const onMove = (e:MouseEvent)=>{
      const rect = el.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width/2)
      const dy = e.clientY - (rect.top + rect.height/2)
      el.style.transform = `translate(${dx*0.08}px, ${dy*0.08}px)`
    }
    const onLeave = ()=> { if(ref.current) ref.current.style.transform = '' }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    return ()=>{
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  },[])

  return (
    <button ref={ref} className="magnetic-btn">
      {children}
    </button>
  )
}
