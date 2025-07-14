# Contributing to Clonal Succession Project

Thank you for your interest in contributing to the Clonal Succession project! This document provides guidelines and instructions for contributing to this repository.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Issue and Pull Request Workflow](#issue-and-pull-request-workflow)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We aim to foster an inclusive and welcoming community.

## Getting Started

1. **Fork the repository** to your GitHub account
2. **Clone your fork** to your local machine
3. **Set up the development environment** by following instructions in GETTING_STARTED.md

## Issue and Pull Request Workflow

### Creating Issues

1. Before starting work, check if an issue already exists for the bug or feature
2. If not, create a new issue with:
   - Clear title describing the problem or feature
   - Detailed description with steps to reproduce (for bugs)
   - Screenshots or mockups (if applicable)
   - Any relevant context

### Working on Issues

1. Comment on the issue to express your interest in working on it
2. Create a new branch with a descriptive name:
   ```
   git checkout -b feature/add-new-animation
   ```
   or
   ```
   git checkout -b fix/mobile-responsive-bug
   ```

### Creating Pull Requests

1. Make your changes in your branch
2. Commit with clear, descriptive messages
3. Push your branch to your fork
4. Create a pull request with:
   - Reference to the issue it addresses
   - Description of changes made
   - Any testing performed
   - Screenshots (if applicable)

### Linking Issues with Pull Requests

**Important:** To automatically close issues when your PR is merged, include one of these keywords in your PR title or description:

- `closes #issue-number`
- `fixes #issue-number`
- `resolves #issue-number`

Multiple issues can be referenced:
```
This PR fixes #123 and closes #456
```

When your PR is merged into the main branch, GitHub will automatically close the referenced issues.

### Example Workflow

1. Find issue #42: "Add mobile responsive controls"
2. Create branch: `feature/mobile-responsive-controls`
3. Make changes and commit
4. Create PR with title: "Add mobile responsive controls, fixes #42"
5. When merged, issue #42 will automatically close

## Development Process

1. **Branch naming conventions**:
   - `feature/` - for new features
   - `fix/` - for bug fixes
   - `docs/` - for documentation changes
   - `refactor/` - for code refactoring

2. **Commit messages** should be clear and descriptive:
   ```
   Add mobile responsive controls for small screens
   ```

3. **Pull Request reviews**:
   - All PRs require at least one review
   - Address review comments before merging

## Coding Standards

- Follow existing code style in the repository
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Testing

- Test your changes thoroughly before submitting a PR
- Add or update tests for new features
- Ensure all existing tests pass

## Documentation

- Update documentation affected by your changes
- Add comments to your code
- Update README.md if necessary

Thank you for contributing to the Clonal Succession project!