# Sync Space

Sync Space is a focused collaboration workspace for direct messaging, people, voice/video calls, screen sharing, and scheduled rooms. The source repository is [Rishi-shut/sync-space](https://github.com/Rishi-shut/sync-space).

## Stack

- Next.js 16 and React 19
- Clerk authentication
- PostgreSQL with Prisma 7
- PeerJS/WebRTC media
- Tailwind CSS 4

## Local development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app expects `DATABASE_URL` plus the standard Clerk publishable and secret key variables in `.env.local`. Generate the Prisma client after schema changes:

```bash
npx prisma generate
```

## Reliable calls

Public STUN servers are configured by default. For reliable calls across restrictive or symmetric NAT networks, configure a TURN service:

```dotenv
NEXT_PUBLIC_TURN_URLS=turn:turn.example.com:3478,turns:turn.example.com:5349
NEXT_PUBLIC_TURN_USERNAME=your-username
NEXT_PUBLIC_TURN_CREDENTIAL=your-credential
```

Because these variables are exposed to the browser, use short-lived TURN credentials in production when the provider supports them.

## Verification

```bash
npm run lint
npm run build
```
