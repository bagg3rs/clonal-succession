# Issue Assignment Workflow Test

This document outlines how to test the automatic issue assignment workflow with the new consolidated issue templates.

## Testing Process

1. Create a new issue using one of the 3 available templates:
   - **Bug Report** - for bugs, accessibility issues, and performance problems
   - **Feature Request** - for new features, improvements, and enhancements  
   - **Documentation & General** - for documentation issues, questions, and general improvements
2. Verify that the issue is automatically assigned to the Q developer agent
3. Check the Actions tab to confirm the workflow ran successfully

## Expected Behavior

When a new issue is created using any template:
- The `issue-assignment.yml` workflow should trigger
- The issue should be assigned to the Q developer agent (GitHub username: `q-developer`)
- The workflow should log a success message
- The appropriate label should be applied (`bug`, `enhancement`, or `documentation`)

## Template-Specific Testing

### Bug Report Template
- **Label Applied**: `bug`
- **Use Cases**: Bugs, accessibility issues, performance problems
- **Fields**: 5 total (3 required, 2 optional)
- **Mobile Optimization**: Single device/browser dropdown, conversational labels

### Feature Request Template  
- **Label Applied**: `enhancement`
- **Use Cases**: New features, performance improvements, refactoring proposals
- **Fields**: 5 total (3 required, 2 optional)
- **Mobile Optimization**: Simplified impact assessment, clear placeholders

### Documentation & General Template
- **Label Applied**: `documentation` 
- **Use Cases**: Documentation issues, general questions, project improvements
- **Fields**: 5 total (3 required, 2 optional)
- **Mobile Optimization**: Flexible issue type dropdown, conversational language

## Mobile Compatibility Testing

Test each template on:
- [ ] Mobile GitHub app (iOS/Android)
- [ ] Mobile web browser (responsive view)
- [ ] Desktop browser (normal view)
- [ ] Tablet view (medium screen size)

Verify:
- [ ] Forms are easy to scroll through on small screens
- [ ] Dropdown menus work well on touch devices
- [ ] Text areas are appropriately sized
- [ ] Required field indicators are visible
- [ ] Form submission works correctly

## Troubleshooting

If issues are not being assigned automatically:

1. Check the Actions tab for any workflow failures
2. Verify that the GitHub token has sufficient permissions
3. Ensure the Q developer agent username is correctly specified in the workflow file
4. Check that the workflow is triggered on issue creation events
5. Verify that the new template labels (`bug`, `enhancement`, `documentation`) don't interfere with workflows

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
        uses: actions/github-script@v7
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

## Changes from Previous Version

### Template Consolidation
- **Before**: 8 different issue templates
- **After**: 3 consolidated templates
- **Impact**: Simpler user experience, better mobile compatibility

### Label Mapping
- `accessibility` → `bug` (accessibility issues now use bug template)
- `performance` → `bug` (performance issues now use bug template)  
- `enhancement` → `enhancement` (unchanged, but now covers more use cases)
- `documentation` → `documentation` (unchanged, but now covers general issues)

### Mobile Optimizations
- Reduced field count per template (max 5 fields, 3 required)
- Simplified dropdown options
- Better placeholder text and labels
- Consistent YAML format across all templates

## Modifying the Assignee

To change the assignee, update the `assignees` array in the workflow file with the correct GitHub username.

## Validation Checklist

- [ ] All 3 templates trigger the assignment workflow
- [ ] Issues are assigned correctly regardless of template used
- [ ] Labels are applied correctly (`bug`, `enhancement`, `documentation`)
- [ ] Templates work well on mobile devices
- [ ] All original functionality is preserved
- [ ] Forms are easier to complete than previous versions