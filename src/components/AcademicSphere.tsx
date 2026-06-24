export default function AcademicSphere(){
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="rounded-full" style={{width:220,height:220,background:'radial-gradient(circle at 20% 30%, rgba(0,255,198,0.08), rgba(0,212,255,0.04) 40%, transparent 60%)', boxShadow:'inset 0 6px 40px rgba(0,212,255,0.04), 0 12px 40px rgba(0,0,0,0.6)'}}>
        <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text)'}}>
          <div style={{textAlign:'center'}}>
            <div className="text-xl font-semibold">Academic Identity</div>
            <div className="text-sm text-muted" style={{color:'var(--muted)'}}>Replace with R3F sphere</div>
          </div>
        </div>
      </div>
    </div>
  )
}
