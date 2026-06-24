import GlassCard from './GlassCard'

export default function HallOfFame(){
  const items = [
    {name:'Ada Lovelace', score:999},
    {name:'Alan Turing', score:987},
    {name:'Grace Hopper', score:976}
  ]
  return (
    <section className="hall-of-fame">
      {items.map((it,i)=> (
        <GlassCard key={i} className="hof-item">
          <h4>{it.name}</h4>
          <p>Score: {it.score}</p>
        </GlassCard>
      ))}
    </section>
  )
}

