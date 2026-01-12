# Repository Guidelines

## Project Structure & Module Organization
- Frontend app lives under `src/` (Vue 3 + TypeScript + Vite). Key areas: `pages/` (views like Dashboard/Login), `layouts/` (shell components), `router/` (route config), `components/` (shared UI), `assets/` (static). Public assets are under `public/`. Build output goes to `dist/`.

## Build, Test, and Development Commands
- `npm install` (once): install dependencies defined in `package.json`.
- `npm run dev`: start Vite dev server with HMR.
- `npm run build`: type-check with `vue-tsc -b` then generate production build into `dist/`.
- `npm run preview`: serve the built assets for a local smoke test. Use after `npm run build`.

## Coding Style & Naming Conventions
- Use Vue `<script setup lang="ts">` with TypeScript types; keep 2-space indentation, single quotes, and trailing commas per existing files.
- Components in `PascalCase` (e.g., `BasicLayout.vue`), composables/utilities in `camelCase`, routes use lowercase paths.
- Prefer Arco Design components (`@arco-design/web-vue`) for UI; keep styles in scoped `<style>` unless global styles belong in `src/style.css`.
- Place new routes in `src/router/index.ts` and pages under `src/pages/`; keep layout wrappers in `src/layouts/`.

## Testing Guidelines
- No formal test suite yet; minimum check is `npm run build` plus `npm run preview` for UI smoke.
- When adding tests, align with Vite ecosystem (Vitest + Vue Test Utils); name files `*.spec.ts` next to the code under test.
- For router or store changes, exercise navigation flows manually and capture console/network errors before submitting.

## Commit & Pull Request Guidelines
- Use clear, present-tense commit messages; follow conventional prefixes when possible (`feat:`, `fix:`, `chore:`, `docs:`).
- Keep commits focused; separate dependency bumps, feature work, and formatting.
- PRs should include: summary of changes, screenshots/GIFs for UI updates, steps to reproduce/test, and linked issue IDs if available.
- Ensure `npm run build` passes before requesting review; note any known gaps or TODOs in the PR description.
