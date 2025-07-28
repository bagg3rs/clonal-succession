# GitHub Workflow Test

This file contains instructions for testing the GitHub workflow that automatically closes issues when pull requests are merged.

## Testing the Issue-PR Linking Workflow

Follow these steps to test the automatic issue closing functionality:

1. **Create a test issue**
   - Go to the Issues tab in your repository
   - Create a new issue titled "Test issue for workflow verification"
   - Add a description and submit the issue
   - Note the issue number (e.g., #123)

2. **Create a test branch**
   ```bash
   git checkout -b test/workflow-verification
   ```

3. **Make a small change**
   - Edit any file (e.g., add a comment to a file)
   - Commit the change with a descriptive message

4. **Push the branch and create a PR**
   ```bash
   git push origin test/workflow-verification
   ```
   - Go to GitHub and create a pull request
   - In the PR description, include: "This is a test PR that fixes #123" (replace 123 with your actual issue number)

5. **Merge the PR**
   - Review and merge the pull request
   - Wait for the GitHub Actions workflow to run (usually takes less than a minute)

6. **Verify the result**
   - Check that the issue has been automatically closed
   - Verify that a comment was added to the issue referencing the PR that closed it

## Expected Behavior

- The issue should be automatically closed when the PR is merged
- A comment should be added to the issue indicating which PR closed it
- The PR should be linked to the issue in GitHub's interface

## Troubleshooting

If the issue is not automatically closed:

1. Check that you used one of the correct keywords:
   - `closes #issue-number`
   - `fixes #issue-number`
   - `resolves #issue-number`

2. Verify that the GitHub Actions workflow ran successfully:
   - Go to the Actions tab in your repository
   - Check the "Close Linked Issues on PR Merge" workflow run
   - Review any error messages in the workflow logs

3. Ensure that the GitHub token has the necessary permissions:
   - The workflow should have `issues: write` and `pull-requests: write` permissions
   - These are configured in the workflow file

## Manual Testing

You can also manually trigger the workflow for testing purposes:

1. Go to the Actions tab in your repository
2. Select the "Close Linked Issues on PR Merge" workflow
3. Click "Run workflow"
4. Enter the PR number you want to test with
5. Click "Run workflow"

This will simulate the workflow running on a previously merged PR.