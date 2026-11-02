import assert from 'node:assert/strict';
import {test} from 'node:test';

import {ensurePnpm} from '../bin/pnpm-bootstrap.js';

// A fake shell: each command maps to a result, or to a list of results
// consumed in order when the same command runs more than once.
function fakeShell(responses) {
  const calls = [];
  const sh = (command) => {
    calls.push(command);
    const response = responses[command];
    if (response === undefined) return {status: 127, stdout: '', stderr: `${command}: not found`};
    return Array.isArray(response) ? response.shift() : response;
  };
  return {sh, calls};
}

const ok = (stdout = '') => ({status: 0, stdout, stderr: ''});
const fail = (stderr = '') => ({status: 1, stdout: '', stderr});
const silent = () => {};

test('an existing pnpm is left alone', () => {
  const {sh, calls} = fakeShell({'pnpm --version': ok('12.16.1\n')});
  ensurePnpm({sh, log: silent});
  assert.deepEqual(calls, ['pnpm --version']);
});

test('never runs corepack enable; disables the corepack shim, then installs pnpm with npm', () => {
  const {sh, calls} = fakeShell({
    'pnpm --version': [fail(), ok('12.16.1\n')],
    'corepack --version': ok('0.34.6\n'),
    'corepack disable pnpm': ok(),
    'npm install -g pnpm@latest': ok(),
  });
  ensurePnpm({sh, log: silent});
  assert.deepEqual(calls, [
    'pnpm --version',
    'corepack --version',
    'corepack disable pnpm',
    'npm install -g pnpm@latest',
    'pnpm --version',
  ]);
});

test('skips corepack when it is not installed', () => {
  const {sh, calls} = fakeShell({
    'pnpm --version': [fail(), ok('12.16.1\n')],
    'npm install -g pnpm@latest': ok(),
  });
  ensurePnpm({sh, log: silent});
  assert.ok(!calls.includes('corepack disable pnpm'));
  assert.ok(calls.includes('npm install -g pnpm@latest'));
});

test('a failing corepack disable does not stop the npm install', () => {
  const {sh, calls} = fakeShell({
    'pnpm --version': [fail(), ok('12.16.1\n')],
    'corepack --version': ok('0.34.6\n'),
    'corepack disable pnpm': fail('EACCES: permission denied'),
    'npm install -g pnpm@latest': ok(),
  });
  ensurePnpm({sh, log: silent});
  assert.equal(calls.at(-1), 'pnpm --version');
});

test('EACCES on the npm global prefix stops with a fix that is not sudo', () => {
  const {sh} = fakeShell({
    'pnpm --version': fail(),
    'npm install -g pnpm@latest': fail('npm error code EACCES\nnpm error path /usr/local/lib/node_modules'),
    'npm config get prefix': ok('/usr/local\n'),
  });
  assert.throws(
    () => ensurePnpm({sh, log: silent}),
    (error) => {
      assert.match(error.message, /\/usr\/local/);
      assert.match(error.message, /npm config set prefix/);
      assert.match(error.message, /sudo/);
      assert.doesNotMatch(error.message, /run with sudo|sudo npm/);
      return true;
    },
  );
});

test('any other npm failure stops with its stderr', () => {
  const {sh} = fakeShell({
    'pnpm --version': fail(),
    'npm install -g pnpm@latest': fail('npm error code ETIMEDOUT'),
  });
  assert.throws(() => ensurePnpm({sh, log: silent}), /npm install -g pnpm@latest failed[\s\S]*ETIMEDOUT/);
});

test('pnpm installed but not on PATH stops naming the directory to add', () => {
  const {sh} = fakeShell({
    'pnpm --version': [fail(), fail()],
    'npm install -g pnpm@latest': ok(),
    'npm config get prefix': ok('/home/node/.npm-global\n'),
  });
  assert.throws(
    () => ensurePnpm({sh, log: silent, platform: 'linux'}),
    /\/home\/node\/\.npm-global\/bin[\s\S]*PATH/,
  );
});

test('a failed prefix lookup leaves the path out of the stop message', () => {
  const {sh} = fakeShell({
    'pnpm --version': [fail(), fail()],
    'npm install -g pnpm@latest': ok(),
    'npm config get prefix': fail(),
  });
  assert.throws(
    () => ensurePnpm({sh, log: silent, platform: 'linux'}),
    (error) => {
      assert.match(error.message, /Add npm's global bin directory to your PATH/);
      assert.doesNotMatch(error.message, /null/);
      return true;
    },
  );
});

test('EPERM on Windows gives no POSIX shell commands', () => {
  const {sh} = fakeShell({
    'pnpm --version': fail(),
    'npm install -g pnpm@latest': fail('npm error code EPERM'),
    'npm config get prefix': ok('C:\\Program Files\\nodejs\n'),
  });
  assert.throws(
    () => ensurePnpm({sh, log: silent, platform: 'win32'}),
    (error) => {
      assert.match(error.message, /version manager/);
      assert.doesNotMatch(error.message, /export PATH|~\/\.npm-global/);
      return true;
    },
  );
});
