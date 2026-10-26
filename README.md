# create-gaia

Scaffold a new project from [GAIA](https://github.com/gaia-harness/gaia).

## Usage

```bash
npx create-gaia@latest my-app
```

Use `@latest` so npx does not reuse a cached older copy of create-gaia: GAIA 2.0.0 and later publish their release asset under a new name that only create-gaia 2.0.0 and later can download.

After scaffolding, Claude Code launches in the project root in auto mode, which still blocks risky actions and falls back to asking when auto mode is unavailable. Setup runs in that one session: `/gaia-init` configures the project, then continues straight into `/setup-gaia`, which installs this machine's tools and plugins and connects GitHub. The session ends by suggesting `/clear` for a fresh context, with no restart or reload, and stays in auto mode afterwards: press Shift+Tab to leave it, or start plain `claude` next time. Pass `--no-claude` to skip that and follow the printed steps instead.

From GAIA 2.0.0 the project is a pnpm workspace with the React app under `frontend/`. Run commands and launch Claude Code from the project root.

Pin a release with `--version`, for example `npx create-gaia@latest my-app --version v1.6.1`.

## License

MIT
