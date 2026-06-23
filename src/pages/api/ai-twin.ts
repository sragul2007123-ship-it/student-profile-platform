import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'})
  const { skills, projects, certifications } = req.body || {}
  // Placeholder: real implementation would call an LLM or AI service
  const twin = {
    careerSuggestion: 'Software Engineer — ML focus',
    skillGaps: ['Cloud Architecture', 'System Design'],
    placementProbability: 0.72,
    interviewReadiness: 0.6
  }
  res.status(200).json({twin, received:{skills, projects, certifications}})
}
