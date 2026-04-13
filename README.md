# TenPlanner

Plan your goals, track your progress.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **UI:** React 19, Tailwind CSS 4, shadcn/ui
- **Linting:** ESLint 9, Prettier
- **Package Manager:** pnpm

## Folder Structure

```
tenplanner/
├── app/              # Next.js App Router (pages, layouts, routes)
├── components/       # Shared React components
│   └── ui/           # shadcn/ui primitives
├── lib/              # Utility functions and shared logic
├── db/               # Database schema, migrations, queries
├── types/            # Shared TypeScript types
├── public/           # Static assets
└── .github/
    └── workflows/    # CI pipeline (lint + type-check on PRs)
```

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `pnpm dev`          | Start dev server (Turbopack) |
| `pnpm build`        | Production build             |
| `pnpm lint`         | Run ESLint                   |
| `pnpm format`       | Format code with Prettier    |
| `pnpm format:check` | Check formatting             |
| `pnpm typecheck`    | Run TypeScript type checking |

## CI

Every PR runs lint, Prettier check, and type-check via GitHub Actions.
