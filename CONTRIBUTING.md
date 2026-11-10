# Contributing

Thanks for wanting to help. This project exists so that any temple, community
group or small organisation can collect event photos without paying for
storage, forcing guests to install an app, or handing their memories to a
commercial platform.

## Ways to help

- **Report bugs** — open an issue with steps to reproduce.
- **Suggest features** — explain the real-world use case first.
- **Improve docs** — setup confusion is a bug too.
- **Translate** — Hindi, Nepali and other languages are especially welcome.
- **Send code** — small, focused pull requests are easiest to review.

## Local setup

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

You do **not** need a Google Drive connection to work on the UI, but upload
and gallery features need the OAuth values from the [setup guide](SETUP-GUIDE.md).
Never commit `.env.local` or real credentials.

## Pull requests

1. Open an issue first for anything larger than a typo or a small fix.
2. Keep the change focused — one concern per PR.
3. Match the existing style: TypeScript, Next.js App Router, no new heavy
   dependencies unless there is a clear reason.
4. Test locally: `npm run build` must pass.
5. Describe **what** changed and **why**, and note any deployment steps.

## Design constraints (please keep these)

- **No database.** Events and uploads are derived from Drive folder and file
  names. Do not add Postgres, Redis, Prisma, etc.
- **No paid infrastructure.** The app must stay runnable on free hosting plus
  the organiser's own Google Drive.
- **Least privilege.** Keep the `drive.file` scope. Never request full Drive
  access.
- **Guest-first.** Uploading must work on a low-end phone, on a slow network,
  with no account and no app install.
- **Private by default.** No public Drive links; downloads go through the
  authenticated proxy.

## Security

Do not open public issues for vulnerabilities. See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under the
[MIT License](LICENSE).
