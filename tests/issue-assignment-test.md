# Issue Assignment Workflow Test

This document outlines how to test the automatic issue assignment workflow.

## Testing Process

1. Create a new issue in the GitHub repository
2. Verify that the issue is automatically assigned to the Q developer agent
3. Check the Actions tab to confirm the workflow ran successfully

## Expected Behavior

When a new issue is created:
- The `issue-assignment.yml` workflow should trigger
- The issue should be assigned to the Q developer agent (GitHub username: `q-developer`)
- The workflow should log a success message

## Troubleshooting

If issues are not being assigned automatically:

1. Check the Actions tab for any workflow failures
2. Verify that the GitHub token has sufficient permissions
3. Ensure the Q developer agent username is correctly specified in the workflow file
4. Check that the workflow is triggered on issue creation events

## Workflow Configuration

The workflow is configured in `.github/workflows/issue-assignment.yml` and uses the GitHub API to assign issues to the specified user.

```yaml
name: Assign Issues to Q Developer

on:
  issues:
    types: [opened, reopened]

jobs:
  assign-issues:
    runs-on: ubuntu-latest
    steps:
      - name: Assign issues to Q developer
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const issueNumber = context.issue.number;
            const owner = context.repo.owner;
            const repo = context.repo.repo;
            
            // Assign the issue to the Q developer agent
            await github.rest.issues.addAssignees({
              owner,
              repo,
              issue_number: issueNumber,
              assignees: ['q-developer']
            });
```

## Modifying the Assignee

To change the assignee, update the `assignees` array in the workflow file with the correct GitHub username.