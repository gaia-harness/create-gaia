// Claude Code starts in auto mode: a classifier blocks risky actions, and the
// session falls back to asking when auto mode is unavailable.
export const PERMISSION_ARGS = ['--permission-mode', 'auto'];

export function claudeLaunchArgs() {
  return [...PERMISSION_ARGS, '/gaia-init'];
}
