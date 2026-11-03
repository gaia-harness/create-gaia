// --initial-branch needs git 2.28 or later. Without it the branch follows the
// host's init.defaultBranch, which is master on a git with none set.
export const GIT_INIT_ARGUMENTS = ['init', '--quiet', '--initial-branch=main'];
