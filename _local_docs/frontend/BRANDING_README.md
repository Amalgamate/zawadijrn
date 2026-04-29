# Default Branding Setup

This system now uses a single default branding folder:

- `public/branding/logo.png`
- `public/branding/favicon.png`
- `public/branding/stamp.svg`

## How It Works

1. On fresh setup, the app uses these files as defaults.
2. School Settings allows each institution to override logo, favicon, stamp, school name, and slogan.
3. If backend branding fields are null/empty, frontend falls back to these defaults.

## First-Time Prefill Defaults

- School Name: `Trends CORE V1.0`
- Slogan (Motto): `School Management System`

## Replace Default Brand Assets

1. Replace `public/branding/logo.png` with your master default logo.
2. Replace `public/branding/favicon.png` with your master default favicon.
3. Replace `public/branding/stamp.svg` with your master default stamp.

Keep the same file names so all new deployments and new schools pick them automatically.

## Redeploy Requirement

After changing files in `public/branding/`, rebuild and redeploy the frontend image/container so the new static assets are included.
