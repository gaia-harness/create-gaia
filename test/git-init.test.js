import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';

import {GIT_INIT_ARGUMENTS} from '../bin/git-init.js';

test('the scaffold repository starts on main when the host git sets no default branch', (context) => {
  const root = mkdtempSync(join(tmpdir(), 'create-gaia-git-init-'));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  // No global or system config, so no init.defaultBranch reaches git.
  const env = {...process.env, HOME: root, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1'};
  const repository = join(root, 'demo');
  mkdirSync(repository);

  execFileSync('git', GIT_INIT_ARGUMENTS, {cwd: repository, env, stdio: 'ignore'});

  const branch = execFileSync('git', ['-C', repository, 'branch', '--show-current'], {env, encoding: 'utf8'});
  assert.equal(branch.trim(), 'main');
});
