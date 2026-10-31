# Contributing to Araccoon Hub

Thanks for your interest in improving the project. Bug reports, fixes, docs and
new ideas are all welcome.

## Getting started

1. Fork the repository and clone your fork.
2. Follow **Local development** in the [README](README.md). You do not need any
   paid service: leave `DATABASE_URL_DEV` empty and `npm run db:local` starts a
   local Postgres. Put `ENVIRONMENT=development` in `.env.local`.
3. Create a branch for your change: `git checkout -b fix/short-description`.

## Before you open a pull request

```bash
npm run typecheck
npm test
npm run build
```

- Keep each pull request focused on one change, and explain what it changes and why.
- Add or update tests when you change behaviour, especially anything in `worker/auth`,
  `worker/routes` or `shared/urlPolicy.ts`.
- Match the style of the code around your change.
- Never commit `.env`, `.env.local`, real API keys, database URLs or personal data.

## Reporting bugs and ideas

Open an issue with the steps to reproduce, what you expected and what happened.
Screenshots help for UI problems.

For **security problems**, do not open a public issue. Follow [SECURITY.md](SECURITY.md).

## Licensing of contributions

By contributing, you agree that your code is released under the [MIT License](LICENSE),
and any artwork under [CC BY-NC 4.0](LICENSE-ART.md).
