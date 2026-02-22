# LiveStore — commit durability race on reload

This repro demonstrates that `store.commit(...)` can update local state while persistence to the leader is still pending, so an immediate reload may restore stale/empty client-document state.

## Reproduction

```bash
bun install
bun run repro
```

## Expected

After burst commits, immediate reload should restore the final committed draft.

## Actual

With this repro configuration, the first reload typically restores an empty draft (reproduced reliably across repeated runs).

## Versions

- @livestore/livestore: 0.3.1
- @livestore/adapter-web: 0.3.1
- @playwright/test: 1.58.2
- Runtime: Bun 1.3.6
- OS: Linux

## Related Issue

- https://github.com/livestorejs/livestore/issues/1064
