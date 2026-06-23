import GlassCard from '../components/GlassCard'
import SkeletonCard from '../components/SkeletonCard'
import Head from 'next/head'

export default function MissionControl(){
  return (
    <>
      <Head>
        <title>Mission Control — ACADEMICOS</title>
      </Head>
      <main className="min-h-screen p-8" style={{backgroundColor:'var(--bg)'}}>
        <div className="max-w-7xl mx-auto">
          <h2 className="h-hero text-4xl mb-6">Mission Control</h2>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 grid grid-cols-3 gap-4">
              <GlassCard title="Academic Identity Score" value="84" />
              <GlassCard title="Placement Readiness" value="72%" />
              <GlassCard title="Skill Growth" value="+18%" />
              <GlassCard title="Career Prediction" value="AI: Data Eng" />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <aside className="col-span-4 glass p-4">
              <h3 className="text-sm text-muted" style={{color:'var(--muted)'}}>Identity Hub</h3>
              <div className="mt-4">
                <SkeletonCard />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}
