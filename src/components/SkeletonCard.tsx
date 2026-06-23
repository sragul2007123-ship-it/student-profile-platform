export default function SkeletonCard({className}:{className?:string}){
  return (
    <div className={"animate-pulse bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent rounded-lg p-4 " + (className||"")}>
      <div className="h-6 bg-[rgba(255,255,255,0.02)] rounded w-3/4 mb-3" />
      <div className="h-8 bg-[rgba(255,255,255,0.02)] rounded w-1/2" />
    </div>
  )
}
