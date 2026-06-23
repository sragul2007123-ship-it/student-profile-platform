# Notification Setup

This document explains how to receive email notifications for CI failures and Vercel deployment failures.

## 1) GitHub Actions Email Alerts (done)

A workflow `notify-on-failure.yml` is installed which triggers when any GitHub Actions workflow run completes with `failure`.

Required repository secrets (set in GitHub > Settings > Secrets):
- `SMTP_SERVER` — SMTP host (e.g. smtp.gmail.com)
- `SMTP_PORT` — SMTP port (e.g. 587)
- `SMTP_USERNAME` — SMTP username
- `SMTP_PASSWORD` — SMTP password or app password
- `NOTIFY_FROM` — From email address
- `NOTIFY_TO` — Recipient email address (can be comma-separated)

The workflow sends a short email with the workflow name, branch, run URL and commit.

## 2) Vercel Deploy Notification Options

Vercel has built-in notifications (email, Slack) which are the most reliable for receiving deploy status.

Recommended options:

A) Enable Vercel project notifications:
- Go to your Vercel project → Settings → Notifications.
- Add an email address (or team) to receive `Deployment Failed` notifications.

B) Use Vercel Webhooks + a forwarder service:
- Create a Vercel webhook for `Deployment Created` / `Deployment Failed`.
- Point the webhook to a webhook-to-email service (e.g., Zapier, Make) or to your own endpoint that sends mail via SendGrid or SMTP.

C) Trigger GitHub repository_dispatch from Vercel webhook (advanced):
- Use the Vercel webhook to call the GitHub REST `repository_dispatch` endpoint with a PAT.
- Add a workflow in this repo that listens to `repository_dispatch` and sends an email (or opens an issue).

Notes:
- Vercel also emails project owners by default — ensure the Vercel account email is one you monitor.
- If you prefer centralized emails from GitHub and Vercel to the same inbox, use a webhook forwarder.

## 3) Built-in forwarder (added)

This repo includes a serverless endpoint you can use to forward Vercel webhooks to email via SendGrid:

- Endpoint: `/api/vercel-webhook`
- Requires these repository secrets:
	- `SENDGRID_API_KEY` — SendGrid API key with `mail.send` permission
	- `SENDGRID_FROM` — From email address used in messages
	- `SENDGRID_TO` — Recipient(s), comma-separated
	- `VERCEL_WEBHOOK_SECRET` (optional) — If set, the endpoint expects the Vercel webhook to include header `x-vercel-signature` equal to this secret. This provides a simple verification check.

How to configure Vercel:
1. In your Vercel project > Settings > Git > Webhooks (or Integrations > Webhooks), create a webhook.
2. Set the target URL to `https://<your-site>/api/vercel-webhook`.
3. If you set a secret in Vercel, set the same value to `VERCEL_WEBHOOK_SECRET` in your repo secrets.

Notes on security:
- The endpoint performs a simple header equality check when `VERCEL_WEBHOOK_SECRET` is set. For stronger verification, you can implement HMAC verification using the raw request body and a secret.

## 4) Next steps I can implement for you
- Replace the simple signature check with HMAC-SHA256 verification using the raw request body.
- Use SendGrid's dynamic templates for nicer emails.
- Create a GitHub Action to open issues automatically when a Vercel deployment fails.

Tell me which of these you want next and I will implement it.
