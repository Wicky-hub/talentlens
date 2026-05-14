# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TalentLens is an AI-powered Micro-Influencer Analytics Platform for Thai SMEs. It helps businesses discover and evaluate micro-influencers using a multi-agent AI system that scores, matches, and reports on influencer profiles.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm test         # Run tests
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Vector DB | Pinecone |
| AI | Claude API — `claude-sonnet-4-6` |
| Scraping | Apify |
| Automation | Make.com |
| Deploy | Vercel |

## Architecture: Multi-Agent System

The core of TalentLens is a pipeline of specialized agents, each with a distinct responsibility:

```
Orchestrator Agent
├── Data Collector Agent   — fetches raw influencer data via Apify
├── Scoring Agent          — computes TalentScore (0–100) from collected data
├── Matching Agent         — matches influencers to SME campaigns using Pinecone vector search
└── Report Agent           — generates Thai-language reports via Claude API
```

**Orchestrator** coordinates the pipeline: it decides which agents to invoke, passes context between them, and handles retries or fallbacks. Agents are stateless functions; shared state lives in Supabase.

**TalentScore** (0–100) is the platform's core metric. Any change to scoring logic must be reflected consistently in the Scoring Agent, the Supabase schema, and any UI that surfaces the score.

**Vector embeddings** (Pinecone) power influencer–campaign matching. When influencer profiles are upserted, embeddings must be regenerated and synced to Pinecone.

## Conventions

- **Language**: All UI text, labels, and user-facing content must be in Thai. Internal code identifiers, comments, and logs are in English.
- **TypeScript**: Strict mode enabled. No `any` types. Explicit return types on all exported functions.
- **React**: Server Components by default. Only add `"use client"` when the component genuinely requires client-side interactivity (event handlers, browser APIs, hooks like `useState`/`useEffect`).
- **Data fetching**: Fetch in Server Components using Supabase server client. Never expose Supabase service role key to the client.
- **Claude API calls**: Always go through the Report Agent or a dedicated server action — never call the Claude API directly from a Client Component or a route that could be triggered by unauthenticated users.
- **Environment variables**: `NEXT_PUBLIC_` prefix only for values intentionally exposed to the browser. All API keys (Supabase service role, Pinecone, Anthropic, Apify) are server-only.
