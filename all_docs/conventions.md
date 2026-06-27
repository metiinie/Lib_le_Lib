# Rules & Conventions

## Naming

- TypeScript: `camelCase` for variables/functions, `PascalCase` for types/components/classes.
- Database: `snake_case` columns and tables (see `lib-le-lib-schema.sql`) — the ORM layer
  maps this to camelCase in code; don't fight that mapping by hand-writing raw SQL casing.
- Files: `kebab-case.ts`, one exported concept per file.

## Error handling

- Always handle errors explicitly. No empty `catch {}`, no silently swallowed promise rejections.
- API errors return a consistent shape: `{ "error": { "code": string, "message": string } }`.
  Never leak stack traces or raw database errors to the client.
- Anything touching verification, payments, or moderation logs the failure to
  `audit_logs` even when it fails closed — a silently dropped failure is worse than a
  logged rejection in this app.

## Logging

- No `console.log` in commits — use the structured logger.
- **Never log:** verification document contents, message plaintext/ciphertext payloads,
  raw photos, or full phone numbers/emails. Log IDs, not the sensitive payloads they
  point to.
- Treat logs as a data-exposure surface with the same caution as the database itself —
  a misconfigured log pipeline is a breach just as much as a misconfigured database is.

## Formatting

- Prettier + ESLint, default configs unless a project-specific override is documented here.
- Import order: external packages → internal absolute imports → relative imports, each
  group alphabetized.

## Commits

- One logical change per commit.
- Reference the scope card (`docs/scope.md`) for the task in the commit message, so the
  intended boundary of the change is traceable later.
