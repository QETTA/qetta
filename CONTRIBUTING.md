# Contributing to QETTA

## Development Setup

```bash
# Clone the repository
git clone <repo-url>
cd qetta

# Run setup script
chmod +x scripts/setup-repo.sh
./scripts/setup-repo.sh

# Start development server
npm run dev
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/). All commits must follow this format:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no code change) |
| `refactor` | Code refactoring |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `build` | Build system changes |
| `ci` | CI configuration |
| `chore` | Maintenance tasks |
| `revert` | Revert a commit |

### Examples

```bash
feat(auth): add password reset flow
fix(dashboard): resolve chart rendering issue
docs: update API documentation
refactor(api): simplify error handling
```

## Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (auto-runs on commit)
- **Linting**: ESLint with Next.js rules
- **Imports**: Absolute imports with `@/` prefix

## Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# E2E tests
npm run e2e
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with proper commits
3. Ensure all tests pass
4. Create a PR using the template
5. Request review from team members

## Branch Naming

```
feat/description    # New features
fix/description     # Bug fixes
docs/description    # Documentation
refactor/description # Refactoring
```
