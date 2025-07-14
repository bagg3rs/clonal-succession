/**
 * GitHub Workflow Test Script
 * 
 * This script simulates the behavior of the GitHub workflow that closes issues
 * when pull requests are merged. It can be used to test the regex patterns and
 * logic without having to create actual PRs and issues.
 * 
 * Usage:
 * 1. Run this script with Node.js: node github-workflow-test.js
 * 2. Check the console output to see if the issue references are correctly identified
 */

// Sample PR title and body to test
const testCases = [
  {
    title: "Add mobile responsive controls",
    body: "This PR adds responsive controls for mobile devices.\n\nFixes #42",
    expectedIssues: ["42"]
  },
  {
    title: "Fix navigation bug fixes #123",
    body: "Improves navigation on small screens",
    expectedIssues: ["123"]
  },
  {
    title: "Update documentation",
    body: "This PR updates the documentation.\n\nCloses #456\nResolves #789",
    expectedIssues: ["456", "789"]
  },
  {
    title: "Refactor code",
    body: "General code cleanup\n\nThis doesn't fix any specific issue.",
    expectedIssues: []
  },
  {
    title: "Fix multiple bugs",
    body: "This PR addresses several issues:\n- fixes #111\n- closes #222\n- resolves #333",
    expectedIssues: ["111", "222", "333"]
  }
];

// Regular expression to find issue references
const issueRegex = /(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+#(\d+)/gi;

// Test function
function testIssueMatching(testCases) {
  console.log("Testing GitHub Issue-PR linking patterns...\n");
  
  let passedTests = 0;
  
  testCases.forEach((testCase, index) => {
    console.log(`Test Case ${index + 1}:`);
    console.log(`Title: "${testCase.title}"`);
    console.log(`Body: "${testCase.body}"`);
    
    // Find all issue references in PR title and body
    const titleMatches = [...testCase.title.matchAll(issueRegex)] || [];
    const bodyMatches = [...testCase.body.matchAll(issueRegex)] || [];
    
    // Extract issue numbers
    const foundIssues = new Set();
    [...titleMatches, ...bodyMatches].forEach(match => {
      foundIssues.add(match[2]);
    });
    
    const foundIssuesArray = Array.from(foundIssues);
    console.log(`Found issues: [${foundIssuesArray.join(", ")}]`);
    console.log(`Expected issues: [${testCase.expectedIssues.join(", ")}]`);
    
    // Check if found issues match expected issues
    const isMatch = 
      foundIssuesArray.length === testCase.expectedIssues.length &&
      foundIssuesArray.every(issue => testCase.expectedIssues.includes(issue));
    
    if (isMatch) {
      console.log("✅ PASS");
      passedTests++;
    } else {
      console.log("❌ FAIL");
    }
    
    console.log("-----------------------------------");
  });
  
  console.log(`\nTest Results: ${passedTests}/${testCases.length} tests passed`);
}

// Run the tests
testIssueMatching(testCases);

// Export for potential use in other tests
module.exports = {
  testIssueMatching,
  issueRegex
};