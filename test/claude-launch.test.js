import assert from 'node:assert/strict';
import {test} from 'node:test';

import {claudeLaunchArgs} from '../bin/claude-launch.js';

test('Claude Code launches /gaia-init in auto mode', () => {
  assert.deepEqual(claudeLaunchArgs(), ['--permission-mode', 'auto', '/gaia-init']);
});
