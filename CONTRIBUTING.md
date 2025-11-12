# Conventional Commits & Semantic Versioning

This project uses [Conventional Commits](https://www.conventionalcommits.org/) and [semantic-release](https://semantic-release.gitbook.io/) for automated versioning and releases.

## Commit Message Format

```
type(scope?): subject
```

- **type**: Purpose of the change (see below)
- **scope**: Optional, what part of the code is affected
- **subject**: Short description

### Common Types

- `feat`: New feature (bumps minor version)
- `fix`: Bug fix (bumps patch version)
- `chore`: Maintenance tasks (no version bump)
- `docs`: Documentation changes (no version bump)
- `refactor`: Code refactoring (no version bump)
- `style`: Code style changes (no version bump)
- `test`: Adding/updating tests (no version bump)
- `perf`: Performance improvements
- `build`: Build process changes
- `ci`: CI/CD changes

### Breaking Changes
- Add `!` after type (e.g., `feat!:`) for breaking changes (bumps major version)

## Example Commits

```
feat: add multiplayer support
fix: correct asteroid collision logic
chore: update dependencies
feat!(player): remove legacy player system
```

## Release Automation
- When a PR is merged into `main`:
  - CI runs build and tests
  - If successful, semantic-release analyzes commit messages
  - Version in `package.json` is bumped
  - CHANGELOG.md is updated
  - A new GitHub tag and release is created

## Branch Protection
- Direct pushes to `main` are blocked
- All changes must go through Pull Requests
- PRs must pass CI before merging

See `.github/workflows/ci.yml` and `.releaserc` for configuration details.
