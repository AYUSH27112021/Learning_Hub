# Learning Hub

Full-stack web application for an IIT-JEE / NEET coaching institute — public landing site, student registration, and a private admin dashboard.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Auth (Admin) | Amazon Cognito |
| Database | Supabase (PostgreSQL) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Image Storage | AWS S3 + Lambda |
| Bot Protection | Cloudflare Turnstile |
| Deployment | Vercel (frontend) |

## Project Structure

```
Learning_Hub/
├── frontend/          # React + Vite app (see frontend/README.md)
├── lambda/            # AWS Lambda — S3 pre-signed upload handler
├── supabase/
│   ├── functions/     # Edge Functions (register)
│   └── migrations/    # SQL schema + RLS policies
├── aws/               # S3 bucket policy + sample image assets
└── package.json       # Root scripts (dev, build, start)
```

## Local Development

### Prerequisites

- Node.js 18+
- A Supabase project
- AWS account with an S3 bucket and Lambda (for image uploads)
- Cloudflare Turnstile site key

### Setup

1. Copy and fill in the frontend env file:

   ```bash
   cp frontend/.env.example frontend/.env
   ```

   | Variable | Description |
   |---|---|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
   | `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
   | `VITE_COGNITO_REGION` | AWS region for Cognito (e.g. `ap-south-2`) |
   | `VITE_COGNITO_USER_POOL_ID` | Cognito user pool ID |
   | `VITE_COGNITO_CLIENT_ID` | Cognito app client ID |
   | `VITE_API_URL` *(optional)* | API Gateway URL for S3 uploads via Lambda |

2. Apply the database schema in your Supabase SQL editor:

   ```bash
   # Run in order:
   supabase/migrations/schema.sql
   supabase/migrations/20260430_registrations_admin_cols.sql
   supabase/migrations/20260430_callbacks.sql
   supabase/migrations/20260430_admin_dashboard_security.sql
   ```

3. Install and run:

   ```bash
   npm install
   npm run dev          # starts frontend on :5173
   ```

## Deployment (Vercel)

The frontend deploys as a static Vite build. Do **not** commit `.env` — set all `VITE_*` variables in **Vercel → Settings → Environment Variables**.

```bash
npm run build          # outputs to frontend/dist
```

## Features

- **Landing page** — hero, courses, faculty, Why Learning Hub, about us sections
- **Registration form** — student enrollment with Cloudflare Turnstile bot protection, saved to Supabase
- **Admin dashboard** — protected by Amazon Cognito; view/filter registrations, toggle closed status, homepage content editor
- **S3 image uploads** — faculty and hero images served from AWS S3 with responsive sizes via Lambda pre-signed URLs
