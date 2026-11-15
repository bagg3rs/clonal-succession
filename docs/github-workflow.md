# GitHub Workflow Guide: Linking Issues and Pull Requests

This guide explains how to use GitHub's issue-PR linking features and our custom workflow for automatically closing issues when pull requests are merged.

## Table of Contents

- [Overview](#overview)
- [Issue-PR Linking Workflow](#issue-pr-linking-workflow)
- [Closing Keywords](#closing-keywords)
- [Examples](#examples)
- [GitHub Actions Workflow](#github-actions-workflow)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

Our repository uses a GitHub Actions workflow to automatically close issues when linked pull requests are merged. This helps maintain a clean and organized issue tracker and provides clear traceability between issues and their solutions.

## Issue-PR Linking Workflow

The basic workflow is:

1. **Create an issue** describing a bug or feature request
2. **Create a branch** to work on the issue
3. **Make changes** and commit them
4. **Create a pull request** that references the issue using closing keywords
5. **Review and merge** the pull request
6. The issue is **automatically closed** when the PR is merged

## Closing Keywords

GitHub recognizes certain keywords that automatically link PRs to issues and close the issues when the PR is merged. These keywords must be followed by a reference to the issue number:

- `close #issue-number`
- `closes #issue-number`
- `closed #issue-number`
- `fix #issue-number`
- `fixes #issue-number`
- `fixed #issue-number`
- `resolve #issue-number`
- `resolves #issue-number`
- `resolved #issue-number`

These keywords can be used in either:
- The PR title
- The PR description

## Examples

### Example 1: Single Issue

PR Title:
```
Add mobile responsive controls for small screens
```

PR Description:
```
This PR adds responsive controls that work better on mobile devices.

Fixes #42
```

When this PR is merged, issue #42 will be automatically closed.

### Example 2: Multiple Issues

PR Title:
```
Fix navigation bugs and improve accessibility
```

PR Description:
```
This PR addresses several navigation issues and improves keyboard accessibility.

Fixes #123
Closes #456
Resolves #789
```

When this PR is merged, issues #123, #456, and #789 will all be automatically closed.

## GitHub Actions Workflow

Our repository includes a custom GitHub Actions workflow that:

1. Runs when a pull request is merged into the main branch
2. Scans the PR title and description for closing keywords
3. Identifies all referenced issue numbers
4. Closes each referenced issue
5. Adds a comment to each closed issue with a link to the PR that closed it

The workflow file is located at `.github/workflows/close-issues.yml`.

## Troubleshooting

If an issue is not automatically closed when a PR is merged:

1. **Check the syntax**: Make sure you used the correct closing keyword format (e.g., "fixes #123")
2. **Check the workflow run**: Go to the Actions tab in the repository and check if the workflow ran successfully
3. **Check permissions**: The GitHub token needs appropriate permissions to modify issues
4. **Manual trigger**: You can manually trigger the workflow from the Actions tab for testing

## Best Practices

1. **One issue, one PR**: When possible, address a single issue in each PR
2. **Clear references**: Always use the standard closing keywords
3. **Descriptive titles**: Use clear PR titles that describe the changes
4. **Detailed descriptions**: Provide context in the PR description
5. **Link early**: Reference the issue when you create the PR, not just before merging
6. **Check workflow results**: Verify that the issue was properly closed after merging

## Additional Resources

- [GitHub documentation on linking PRs to issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Repository CONTRIBUTING.md](../CONTRIBUTING.md)