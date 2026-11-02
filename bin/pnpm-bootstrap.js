// Installs pnpm when it is missing, the same way GAIA's /gaia-init does:
// remove corepack's pnpm shim if corepack is here, then
// `npm install -g pnpm@latest`. corepack is never enabled, so the pnpm this
// leaves on PATH is the one /gaia-init expects to find and update.

import {spawnSync} from 'node:child_process';
import {join} from 'node:path';

const INSTALL_COMMAND = 'npm install -g pnpm@latest';

function shell(command, stdio = 'pipe') {
  const result = spawnSync(command, {shell: true, encoding: 'utf8', stdio});
  return {status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? ''};
}

const succeeds = (result) => result.status === 0;

export function ensurePnpm({sh = shell, log = console.log, platform = process.platform} = {}) {
  if (succeeds(sh('pnpm --version'))) return;

  log(`  ↳ pnpm not found, installing it globally: corepack disable pnpm (if corepack is here), then ${INSTALL_COMMAND}`);
  // A failed disable is ignored; the post-install check decides.
  if (succeeds(sh('corepack --version'))) sh('corepack disable pnpm');

  const install = sh(INSTALL_COMMAND, ['ignore', 'inherit', 'pipe']);
  if (!succeeds(install)) {
    if (/EACCES|EPERM/.test(install.stderr)) {
      const prefix = npmPrefix(sh);
      const where = prefix ? ` (${prefix})` : '';
      const remedy =
        platform === 'win32'
          ? '  Do not re-run as Administrator. Install Node with a version manager (fnm, Volta), then re-run.'
          : '  Do not use sudo. Point npm at a folder you own, then re-run:\n' +
            '    npm config set prefix ~/.npm-global\n' +
            '    export PATH="$HOME/.npm-global/bin:$PATH"\n' +
            '  (add the export line to ~/.zshrc or ~/.bashrc too),\n' +
            '  or install Node with a version manager (nvm, fnm, Volta).';
      throw new Error(`npm cannot write to its global prefix${where}, so pnpm was not installed.\n${remedy}`);
    }
    throw new Error(`${INSTALL_COMMAND} failed:\n${install.stderr.trim()}`);
  }

  if (!succeeds(sh('pnpm --version'))) {
    const prefix = npmPrefix(sh);
    const binDirectory = prefix
      ? platform === 'win32'
        ? prefix
        : join(prefix, 'bin')
      : "npm's global bin directory";
    throw new Error(
      `pnpm was installed, but \`pnpm\` does not run from this shell.\n  Add ${binDirectory} to your PATH, then re-run.`,
    );
  }
}

function npmPrefix(sh) {
  const result = sh('npm config get prefix');
  return succeeds(result) ? result.stdout.trim() : null;
}
