---
name: new-worktree
description: Create a git worktree for a new BrightBroom feature branch, sharing node_modules and .env with the main checkout
disable-model-invocation: true
argument-hint: "[feature-name]"
---
Create a worktree for feature `$ARGUMENTS`:

```bash
git branch feature/$ARGUMENTS development
git worktree add ../brightbroom-$ARGUMENTS feature/$ARGUMENTS
cd ../brightbroom-$ARGUMENTS
ln -s /Users/thando/Documents/brightbroom/node_modules ./node_modules
ln -s /Users/thando/Documents/brightbroom/.env ./.env
```

- One worktree per feature; merge back into `development`.
- Inside the worktree, run binaries directly (`./node_modules/.bin/tsx`, `./node_modules/.bin/svelte-check`). `pnpm <script>` re-verifies dependencies and tries to purge the shared `node_modules`.
- List worktrees with `git worktree list`; remove with `git worktree remove ../brightbroom-<name>`.
