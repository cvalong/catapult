# __APP_NAME__ Marketing Site

## Testing

### Unit tests (Vitest + React Testing Library)

Tests React island components only (`.tsx` files in `src/components/`).

**Astro components (`.astro`) cannot be unit tested** — they require the Astro
runtime and are not importable into Vitest's jsdom environment. Cover Astro pages
and components via E2E tests instead.

To add a testable interactive element, create a React island (`.tsx`) and use it
inside the `.astro` component with `client:load` or `client:idle`.

```bash
bun run test:unit     # single run
bun run test:ui       # Vitest browser UI (live reload)
```

### E2E tests (Playwright)

Tests full page rendering across Chromium and Firefox.

```bash
bun run test:e2e      # build + run Playwright
bun run test:e2e:ui   # Playwright interactive UI
```

First run requires browser binaries:

```bash
npx playwright install --with-deps chromium firefox
```

### All tests

```bash
bun run test
```
