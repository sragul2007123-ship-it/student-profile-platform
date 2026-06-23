import type { NextApiRequest, NextApiResponse } from 'next'

// Simple Vercel webhook forwarder -> SendGrid
// Environment variables required:
// - SENDGRID_API_KEY
// - SENDGRID_FROM
// - SENDGRID_TO (comma-separated)
// - VERCEL_WEBHOOK_SECRET (optional) -- if set, the webhook must include header 'x-vercel-signature' equal to this secret

export const config = {
  api: {
    bodyParser: true,
  },
}

async function sendEmail(subject: string, text: string) {
  const key = process.env.SENDGRID_API_KEY
  const from = process.env.SENDGRID_FROM
  const to = process.env.SENDGRID_TO
  if (!key || !from || !to) throw new Error('SendGrid config missing')

  const personalizations = to.split(',').map(t => ({ to: [{ email: t.trim() }] }))

  const payload = {
    personalizations,
    from: { email: from },
    subject,
    content: [{ type: 'text/plain', value: text }],
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`SendGrid error: ${res.status} ${body}`)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const secret = process.env.VERCEL_WEBHOOK_SECRET
    if (secret) {
      const sig = (req.headers['x-vercel-signature'] || '').toString()
      if (!sig || sig !== secret) {
        return res.status(401).json({ error: 'Invalid webhook signature' })
      }
    }

    const payload = req.body
    // Build a concise message using common Vercel webhook fields
    const project = payload?.project?.name || payload?.meta?.projectId || 'unknown'
    const url = payload?.url || payload?.deploymentUrl || payload?.meta?.url || 'n/a'
    const state = payload?.state || payload?.deployment?.state || payload?.type || 'n/a'
    const creator = payload?.creator?.email || payload?.creator?.name || 'unknown'
    const commit = payload?.meta?.githubCommitSha || payload?.deployment?.meta?.githubCommitSha || payload?.meta?.sha || 'n/a'

    const subject = `[Vercel] ${project} — ${state}`
    const text = `Vercel notification\n\nProject: ${project}\nState: ${state}\nURL: ${url}\nCreator: ${creator}\nCommit: ${commit}\n\nFull payload:\n${JSON.stringify(payload, null, 2)}`

    await sendEmail(subject, text)
    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('vercel-webhook error', err)
    return res.status(500).json({ error: err.message || 'error' })
  }
}
