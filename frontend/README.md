# Frontend

React + TypeScript + Vite app for Learning Hub.

## Stack

- **React 18** with React Router v6
- **TypeScript** (strict mode)
- **Vite** dev server on `:5173`
- **Supabase JS** — database client
- **Amazon Cognito** (`amazon-cognito-identity-js`) — admin auth
- **Cloudflare Turnstile** (`@marsidev/react-turnstile`) — bot protection

## Structure

```
src/
├── app/
│   ├── App.tsx          # Route definitions
│   └── main.tsx         # React entry point
├── features/            # Feature-first modules
│   ├── landing/         # Public landing page + callback service
│   ├── registration/    # Student registration form
│   ├── about-us/
│   ├── courses/
│   ├── why-learning-hub/
│   ├── admin/           # Admin login, dashboard, homepage editor, registration detail
│   ├── auth/            # Auth page + API
│   ├── dashboard/
│   └── profile/
└── shared/
    ├── lib/
    │   ├── supabase.ts        # Public Supabase client (anon key)
    │   └── adminSupabase.ts   # Admin Supabase client (publishable key)
    └── styles/global.css
```

Each feature folder follows the pattern:

```
features/<name>/
├── pages/       # Route-level page components
├── components/  # UI components scoped to this feature
├── hooks/       # Feature-specific React hooks
├── services/    # API / external service calls
└── types.ts     # TypeScript types
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

All variables are prefixed with `VITE_` and are **public** (safe to expose client-side):

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `VITE_TURNSTILE_SITE_KEY` | Yes | Cloudflare Turnstile site key |
| `VITE_COGNITO_REGION` | Yes | AWS region (e.g. `ap-south-2`) |
| `VITE_COGNITO_USER_POOL_ID` | Yes | Cognito user pool ID |
| `VITE_COGNITO_CLIENT_ID` | Yes | Cognito app client ID |
| `VITE_API_URL` | No | API Gateway URL for Lambda S3 uploads |

## Scripts

```bash
npm run dev       # dev server on :5173
npm run build     # type-check + Vite build → dist/
npm run preview   # preview the dist/ build locally
```

## Dev Proxy

In development, Vite proxies `/api` and `/uploads` to `http://localhost:4000` (see `vite.config.ts`). In production on Vercel these should point to your actual API Gateway / Supabase URLs via env vars.
