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

To skip the interactive editor and pass a title/body directly:

```sh
gh pr create --title "your title" --body "$(cat .github/pull_request_template.md)"
```

## Commit Messages
- Do not add `Co-Authored-By: Claude` or any AI attribution lines to commits.
