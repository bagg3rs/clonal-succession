# Project Structure & Architecture

## Directory Structure

```
clonal-succession/
├── index.html                # Main entry point and demo page
├── animations/               # Animation implementations and examples
│   ├── clonal-succession-cycle.html  # Main simulation
│   ├── mobile-responsive.css         # Mobile styles
│   ├── mobile-responsive.js          # Mobile responsiveness logic
│   └── [other animation variants]    # Alternative simulations
├── src/                      # Source code
│   ├── core/                 # Core simulation components
│   │   ├── Simulation.js     # Main simulation controller
│   │   ├── Cell.js           # Base cell class
│   │   ├── StemCell.js       # Stem cell implementation
│   │   ├── CellLifecycleManager.js  # Manages cell lifecycle
│   │   └── StemCellManager.js       # Manages stem cell activation
│   └── utils/                # Utility functions and helpers
│       └── EventEmitter.js   # Event system for component communication
├── docs/                     # Documentation
│   ├── research-notes.md     # Detailed research findings
│   ├── biological-basis.md   # Scientific background
│   └── github-workflow.md    # GitHub workflow guide
└── next-steps/              # Development roadmap
```

## Core Components

### Simulation Architecture
- **Simulation.js** - Main controller that integrates all components
- **EventEmitter.js** - Communication system between components
- **Cell.js** - Base class for all cells with lifecycle states
- **StemCell.js** - Extended cell with stem cell behaviors
- **CellLifecycleManager.js** - Manages cell creation, division, and death
- **StemCellManager.js** - Manages stem cell activation and suppression

### Component Relationships
1. **Simulation** orchestrates all components and handles rendering
2. **CellLifecycleManager** tracks and updates all cells
3. **StemCellManager** controls stem cell activation and succession
4. **EventEmitter** enables communication between components

## Key Patterns

### Event System
- Components communicate through events rather than direct references
- Events include: cellCreated, cellDivided, cellStateChanged, cellDied, stemCellActivated, etc.

### Object-Oriented Design
- Inheritance hierarchy: EventEmitter → Simulation, Cell → StemCell
- Composition: Simulation contains CellLifecycleManager and StemCellManager

### State Management
- Cell states: dividing → non-dividing → senescent → death
- Stem cell states: dormant → active → dormant
- Clone states: active → suppressed → active

## Implementation Notes

### Physics Integration
- Matter.js physics engine handles cell movement and collisions
- Cells are represented as circular bodies with physical properties
- Constraints temporarily connect parent-child cells during division

### Rendering
- HTML5 Canvas API for all rendering
- Each cell type has distinct visual representation
- Suppression field visualized as gradient overlay

### Mobile Responsiveness
- Canvas resizes based on device dimensions
- Touch controls replace mouse interactions on mobile
- UI elements adapt to screen size