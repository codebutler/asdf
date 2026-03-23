# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

asdf is a Chrome extension (Manifest V3) that auto-fills HTML forms with realistic random data using Faker. Triggered via keyboard shortcut (Ctrl+Shift+F / MacCtrl+Shift+F) or clicking the extension icon.

## Commands

- `bun install` — install dependencies
- `bun run build` — type-check, build with Vite, and zip for distribution
- `bun run dev` — Vite dev server with HMR (for extension development, load `dist/` as unpacked extension)
- `bun run lint` — lint with oxlint
- `bun run fmt` — format with oxfmt
- `bun run fmt:check` — check formatting without writing

## Architecture

Three source files in `src/`:

- **background.ts** — Service worker. Listens for extension icon clicks and injects the content script into the active tab via `chrome.scripting.executeScript`.
- **content.ts** — Core logic. `onExecute()` queries all form elements (`input`, `select`, `textarea`, `[role=combobox]`), skips hidden/disabled/pre-filled ones, and fills each with appropriate Faker data. Uses a multi-pass approach (up to 5 passes) to catch dynamically rendered fields. A `Set<FormElement>` tracks already-filled elements across passes.
- **util.ts** — Helpers: `Pselector` (creates ts-pattern matchers from CSS selectors), `difference` (set difference), `ensure` (non-null assertion).

### Key patterns

- **ts-pattern** for exhaustive matching on element types and CSS selectors (via `Pselector`). Input type dispatch is nested: first by `input.type`, then by `name`/`inputmode` attributes for text inputs.
- **@testing-library/user-event** simulates realistic user interactions (typing, clicking, selecting) so that framework event handlers fire correctly.
- **@testing-library/dom** `waitFor` is used for async combobox expansion.

### Build

Vite with `@crxjs/vite-plugin` reads `manifest.json` directly. Node modules are split into a separate `vendor` chunk via `manualChunks` in `vite.config.ts`.
