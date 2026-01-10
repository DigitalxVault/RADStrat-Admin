# Repository Guidelines

## Project Structure & Module Organization
This repo is an npm workspace monorepo anchored by `package.json`. `apps/web` houses the Vite + React UI with its source under `src/` (pages, components, hooks, data). `apps/server` contains the Express API with TS entry at `src/index.ts` and route/util folders. Shared docs live in `docs`, while troubleshooting notes stay in `DEBUG.md` and release notes in `CHANGELOG.md`. Assets generated during builds land in each app’s `dist` folder, so keep committed assets in `apps/web/public` if you add icons or audio samples.

## Build, Test, and Development Commands
Run `npm install` once at the root; it wires both workspaces. Use `npm run dev` to boot web and server together (Vite on 5173, Express on 3001). `npm run dev:web` or `npm run dev:server` target a single side. Ship-ready artifacts come from `npm run build` (calls both sub-builds). Quality gates are `npm run lint` and `npm run typecheck` which cascade through each workspace. `npm run clean` removes workspace `node_modules` and build output when tooling goes sideways.

## Coding Style & Naming Conventions
Stick to TypeScript throughout with ES modules and 2-space indentation, matching current `.tsx`/`.ts` files. React components live in PascalCase files (`Telemetry.tsx`), hooks are `useCamelCase.ts`, and server utilities use camelCase filenames. Favor functional components, hooks, and CSS utility classes defined in the design system. ESLint (TypeScript config + React Hooks rules) is the canonical formatter; enable auto-fix-on-save and keep `--max-warnings 0` passing. When updating DTOs or shared types, edit the corresponding `apps/web/src/types` definitions and keep mirrored server contracts in sync.

## Testing Guidelines
Playwright E2E checks are called out in `CHANGELOG.md`; recreate them under `apps/web/tests` and point them to the running dev servers before opening a PR. Until a dedicated script exists, document manual runs (`npx playwright test`) in your PR description. For logic-heavy utilities, add lightweight unit tests (Vitest or Jest) near the module (`__tests__` folders mirroring the source path) and gate them behind `npm test` inside each workspace. Target at least smoke coverage for scoring, telemetry math, and server route validation.

## Commit & Pull Request Guidelines
Follow Keep a Changelog style: summary line in present tense (`Add telemetry export modal`), optional detail bullets grouped by Added/Changed/Fixed. Reference issue IDs in the body and link design docs or recordings when UI shifts. Every PR should include: short motivation paragraph, testing evidence (command output or screenshots), config changes called out explicitly, and for UI tweaks a before/after capture from `apps/web`. Request review from both frontend and backend maintainers when touching shared types or OpenAI integration code.
