import dynamic from 'next/dynamic'
import Head from 'next/head'
import React from 'react'
import './styles/globals.css'
import AuroraBackground from '../components/AuroraBackground'
import FloatingNavbar from '../components/FloatingNavbar'
import GlassCard from '../components/GlassCard'
import MagneticButton from '../components/MagneticButton'
import AnimatedCounter from '../components/AnimatedCounter'
import HallOfFame from '../components/HallOfFame'
import SpotlightCursor from '../components/SpotlightCursor'

export default function Home(){
  return (
    <div>
      <AuroraBackground />
      <FloatingNavbar />
      <SpotlightCursor />
      <main style={{padding:48, zIndex:10, position:'relative'}}>
        <h1 style={{fontSize:48}}>ACADEMICOS — Mission Control</h1>
        <div style={{display:'flex', gap:20, marginTop:24}}>
          <div style={{width:320}}>
            <GlassCard>
              <h3>Identity Hub</h3>
              <p>Curate your academic identity</p>
              <MagneticButton>Open</MagneticButton>
            </GlassCard>
          </div>

          <div style={{width:320}}>
            <GlassCard>
              <h3>Achievement Stream</h3>
              <p>Track accomplishments</p>
              <AnimatedCounter to={420} />
            </GlassCard>
          </div>
        </div>

        <section style={{marginTop:40}}>
          <h2>Hall Of Fame</h2>
          <HallOfFame />
        </section>
      </main>
    </div>
  )
}
}
