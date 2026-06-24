import { useEffect, useState } from 'react'

export default function SpotlightCursor(){
  const [pos, setPos] = useState({x:-100,y:-100})
  useEffect(()=>{
    const onMove = (e:MouseEvent)=> setPos({x:e.clientX,y:e.clientY})
    window.addEventListener('mousemove', onMove)
    return ()=> window.removeEventListener('mousemove', onMove)
  },[])

  return (
    <div className="spotlight-cursor" style={{left:pos.x,top:pos.y}}>
      <div style={{width:220,height:220, borderRadius: '50%', background:`radial-gradient(circle, rgba(0,255,198,0.12), rgba(0,212,255,0.04) 30%, transparent 60%)`}} />
    </div>
  )
}
import React, { useEffect, useState } from 'react'

export default function SpotlightCursor(){
  const [pos, setPos] = useState({x:-100,y:-100})
  useEffect(()=>{
    const onMove = (e:MouseEvent)=> setPos({x:e.clientX,y:e.clientY})
    window.addEventListener('mousemove', onMove)
    return ()=> window.removeEventListener('mousemove', onMove)
  },[])

  return (
    <div className="spotlight-cursor" style={{left:pos.x,top:pos.y}}>
      <div style={{width:220,height:220, borderRadius: '50%', background:`radial-gradient(circle, rgba(0,255,198,0.12), rgba(0,212,255,0.04) 30%, transparent 60%)`}} />
    </div>
  )
}
