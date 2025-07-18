# GitHub Setup Instructions

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Name it: `clonal-succession`
4. Description: `Interactive physics-based simulation of clonal succession in tumours`
5. Make it **Public** (for GitHub Pages)
6. **DO NOT** check "Add a README file" (we already have one)
7. **DO NOT** check "Add .gitignore" (we already have one)
8. **DO NOT** choose a license (we already have MIT)
9. Click "Create repository"

## Step 2: Push to GitHub

After creating the repository, GitHub will show you the repository URL. Run these commands:

```bash
cd /Users/bag/clonal-succession

# Add the GitHub repository as origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/clonal-succession.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "GitHub Actions"
5. The site will be available at: `https://YOUR_USERNAME.github.io/clonal-succession/`

## Step 4: Verify Deployment

- The GitHub Action will automatically deploy your site
- Check the "Actions" tab to see the deployment progress
- Once complete, visit your GitHub Pages URL to see the live simulation

## Repository Features

✅ **Complete simulation** with clonal succession mechanism
✅ **Interactive controls** for speed and population limits  
✅ **Comprehensive documentation** with research notes
✅ **MIT License** for open collaboration
✅ **GitHub Pages deployment** with automatic updates
✅ **Professional README** with live demo links

## Next Steps

- Share the GitHub Pages URL to showcase your research
- Collaborate with other researchers by sharing the repository
- Continue development by pushing new commits (auto-deploys)
- Use GitHub Issues to track future enhancements

## Issue and Pull Request Workflow

### Creating and Managing Issues

1. Go to the "Issues" tab in your repository
2. Click "New issue" to create a new task or bug report
3. Add a descriptive title and detailed description
4. Assign labels, milestone, and assignee as needed
5. Click "Submit new issue"

### Linking Issues with Pull Requests

When creating a pull request to address an issue:

1. Include one of these keywords in the PR title or description:
   - `closes #issue-number`
   - `fixes #issue-number`
   - `resolves #issue-number`

2. When the PR is merged into the main branch, the referenced issues will automatically close

3. Example PR description:
   ```
   This PR adds mobile responsive controls for small screens.
   
   Fixes #42
   ```

### Automated Issue Closing

This repository is configured with a GitHub Actions workflow that:
- Runs when a pull request is merged into the main branch
- Identifies issues referenced in the PR title or description
- Automatically closes those issues
- Adds a comment to the closed issues referencing the PR that closed them

For more details, see the [CONTRIBUTING.md](CONTRIBUTING.md) file.
