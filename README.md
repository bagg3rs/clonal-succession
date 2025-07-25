# Clonal Succession in Tumors

## Overview
Clonal succession is the process by which tumors maintain their cell populations through cycles of stem cell activation and clonal expansion. This mechanism allows tumors to persist despite individual cell populations having limited lifespans.

## Key Components

### 1. Vascular Cage/Niche
- **Structure**: A protective microenvironment containing stem cells
- **Function**: Houses and maintains dormant stem cells
- **Guardian cells**: Specialized cells that nurture stem cells (similar to how ovaries protect egg cells)
- **Vascular network**: Provides the structural framework for tumor growth

### 2. Stem Cells
- **Location**: Contained within the vascular niche
- **State**: Most remain dormant - only one active at a time
- **Potential**: Each stem cell can undergo 20-30 divisions
- **Output**: One stem cell can produce millions to billions of cells

### 3. Clonal Populations
- **Growth**: Exponential expansion from single activated stem cell
- **Lifespan**: Limited - cells stop dividing after reaching division limit
- **Cause of limit**: Chromosomal degradation (DNA loss with each division)

## The Succession Process

### Phase 1: Clonal Expansion with Suppression
1. One stem cell becomes activated
2. **Suppression mechanism**: Active stem cell suppresses other dormant stem cells
3. Undergoes rapid division (20-30 cycles) while maintaining suppression
4. Creates large population of identical cells (e.g., "red population")
5. Cells eventually reach their division limit and stop growing
6. **Suppression weakens** as active population declines

### Phase 2: Population Decline and Suppression Release
1. Non-dividing cells begin to die off
2. **Total tumor population starts to decrease**
3. **Suppression signal weakens** as active population shrinks
4. This creates a "window of opportunity" for dormant stem cells

### Phase 3: Stem Cell Succession
1. **Trigger**: Population decline + weakened suppression
2. Dormant stem cell "breaks free" from suppression
3. New clone begins expanding (e.g., "green population")
4. **New suppression established** by the newly active clone
5. Process repeats cyclically

## Key Mechanisms

### Suppression System
- **Lateral inhibition**: Active stem cells suppress dormant ones
- **Signal strength**: Proportional to active population size
- **Threshold effect**: Suppression must drop below critical level for activation
- **Biological basis**: Prevents multiple stem cells from activating simultaneously

### Population Control
- **Homeostasis**: Suppression maintains single active clone at a time
- **Succession timing**: New activation only when suppression weakens
- **Emergency override**: Suppression fails if total population crashes
- **Competitive exclusion**: Prevents chaotic multi-clone activation

## Key Observations

### Population Dynamics
- **Total cell count**: **Remains constant at ~100 cells** (tumor homeostasis)
- **Clonal composition**: Changes dramatically over time
- **Succession pattern**: Red → Green → Yellow → Red (continuous cycle)
- **Replacement mechanism**: New clones replace old ones, maintaining total population

### Three-Clone System
- **Red clone**: First expansion phase
- **Green clone**: Second expansion phase  
- **Yellow clone**: Third expansion phase
- **Cyclic succession**: Each clone eventually replaces the previous dominant clone
- **Population maintenance**: Total always ~100 cells regardless of clone composition

### Regulatory Mechanism
- **Population homeostasis**: Tumor maintains fixed size through clone replacement
- **Competitive replacement**: New clones don't add to total, they replace existing cells
- **Threshold response**: New stem cells activate when current clone begins declining
- **Space constraint**: Limited vascular network space maintains population ceiling

## Biological Significance
- Ensures tumor survival despite limited cell lifespans
- Maintains tumor population without requiring immortal cells
- Provides mechanism for tumor persistence and growth
- Demonstrates sophisticated population-level regulation

## Visual Model
- **Red population**: First clonal expansion phase from 1 stem cell to 1000 in 10 seconds, then drop 10% (e.g. 900) then the colour change happens and next stem cell is triggered. 
- **Green population**: Second clonal expansion phase  
- **Pattern**: Alternating waves of growth and decline
- **Net effect**: Stable tumour with fluctuating growth activity 

## 🚀 Live Demo

**[View Interactive Simulation](https://bagg3rs.github.io/clonal-succession/)**

Try the simulation directly in your browser with full interactive controls. The main animation (clonal-succession-cycle.html) demonstrates the complete clonal succession process.

### Mobile Compatibility

The simulation is fully responsive and works on mobile devices, tablets, and desktop browsers. The interface automatically adjusts to different screen sizes for optimal viewing and interaction.

- **Mobile phones**: Optimized controls and vertical layout
- **Tablets**: Responsive canvas and touch-friendly interface
- **Desktop**: Full-featured experience

### User Interface

The simulation features a streamlined interface with:
- A single row of controls under the animation
- Reset button and 2x Speed button on the same line
- Total cell count display
- Simplified UI for better focus on the simulation

## Repository Structure

```
clonal-succession/
├── index.html                # Main demo page
├── README.md                 # This file
├── CONTRIBUTING.md           # Contribution guidelines
├── docs/                     # Documentation
│   ├── research-notes.md     # Detailed research notes
│   ├── audio-transcript.md   # Original audio transcript
│   ├── biological-basis.md   # Scientific background
│   └── github-workflow.md    # GitHub workflow guide
├── models/                   # Mathematical and computational models
├── animations/               # Animation code and assets
│   ├── mobile-responsive.css # Responsive styles for mobile devices
│   ├── mobile-responsive.js  # JavaScript for responsive canvas
│   └── MOBILE_RESPONSIVE_GUIDE.md # Guide for implementing mobile responsiveness
├── data/                     # Experimental data and observations
└── next-steps/               # Development roadmap
```

## Getting Started

1. Review the documentation in the `docs/` folder
2. Examine the current models in `models/`
3. Check the development roadmap in `next-steps/`
4. Run animations to visualize the clonal succession process
5. For mobile development, see `animations/MOBILE_RESPONSIVE_GUIDE.md`
6. For contributing to the project, see `CONTRIBUTING.md` and `docs/github-workflow.md`

## Contributing

This research is focused on understanding tumor biology through computational modeling and visualization. Contributions welcome in:
- Mathematical modeling
- Animation and visualization
- Biological validation
- Documentation improvements

### Contribution Workflow

1. **Find or create an issue** - Before starting work, make sure there's an issue describing the feature or bug
2. **Fork and clone** the repository
3. **Create a branch** for your changes
4. **Make your changes** and commit them with descriptive messages
5. **Push your branch** to your fork
6. **Create a pull request** linking to the issue

### Linking Issues with Pull Requests

When creating a pull request, use one of the following keywords in the PR title or description to automatically close the related issue when the PR is merged:

- `closes #issue-number`
- `fixes #issue-number`
- `resolves #issue-number`

For example:
- "Add mobile responsive controls, fixes #42"
- "PR description that closes #123 and fixes #456"

This will automatically close the referenced issues when the pull request is merged into the main branch.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The MIT License allows anyone to:
- Use the software for any purpose
- Modify and distribute the software
- Include it in proprietary software
- Use it for commercial purposes

We encourage contributions back to the project, though it's not required.
