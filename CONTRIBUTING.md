# Contributing

## Testing Locally

The CLI runs from the compiled bundle in `dist/`. After making source changes, run the build before manually testing the CLI — otherwise you're running stale code:

```sh
bun run build
bun dist/index.js
```

`bun run test` (vitest) runs against source directly and does not require a build step.

## Opening Pull Requests

Use `gh pr create` — GitHub will automatically populate the editor with `.github/pull_request_template.md`:

```sh
gh pr create
```

Fill in the template in your editor, save, and exit to submit. Avoid passing `--body` directly as it will post the template unfilled.

## Commit Messages
- Do not add `Co-Authored-By: Claude` or any AI attribution lines to commits.
