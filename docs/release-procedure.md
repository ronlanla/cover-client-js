# Release procedure

1. Post a message in #releases on Slack to say that a Cover Client JS release has been started.
2. Open a terminal and navigate to the directory containing `package.json` and then run the command `yarn create-release`
3. You will be given a list of unreleased changes and asked what type of release this is. Use [semver](https://semver.org) to decide that.
4. The release process will create a PR. Check your [Pull Requests](https://github.com/pulls) and add other reviewers if necessary.
5. Merge once the reviews are complete.
6. A few minutes later, provided it passes CI, the package will be updated on NPM.
7. Check your [Pull Requests](https://github.com/pulls) for the PR to merge `master` back in to `develop`.
8. Post a message in #releases on Slack to say that the Cover Client JS release is finished.

Copyright 2019 Diffblue Limited. All Rights Reserved.
