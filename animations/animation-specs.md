# Animation Specifications for Clonal Succession

## Overview
This document outlines the requirements and specifications for creating animations that visualise the clonal succession process in tumours.

## Core Animation Requirements

### 1. Population Homeostasis
- **Constant total**: Maintain exactly 100 cells throughout animation
- **Cell replacement**: New cells appear only as old cells die
- **Visual balance**: Clear indication that population remains stable
- **Counter display**: Real-time population count overlay

### 2. Three-Clone System
- **Colour coding**: 
  - Red clone: First expansion phase
  - Green clone: Second expansion phase
  - Yellow clone: Third expansion phase
- **Stem cell visualisation**: Three stem cells positioned in triangular arrangement
- **State indicators**: Clear visual distinction between active/dormant stem cells

### 3. Succession Dynamics
- **Smooth transitions**: Gradual replacement of one clone by another
- **Timing control**: Adjustable succession intervals
- **Pattern recognition**: Clear cyclical pattern (Red → Green → Yellow → Red)
- **Suppression visualisation**: Visual indication of suppression strength

## Technical Specifications

### Animation Framework
- **Platform**: Web-based (HTML5 Canvas or SVG)
- **Frame rate**: 30-60 FPS for smooth visualization
- **Resolution**: Scalable vector graphics preferred
- **Responsiveness**: Adaptable to different screen sizes

### Visual Elements

#### Cell Representation
- **Shape**: Circles or hexagons for individual cells
- **Size**: Consistent size for all cells (5-10 pixels diameter)
- **Colors**: 
  - Red: #FF4444 (active red clone)
  - Green: #44FF44 (active green clone)
  - Yellow: #FFFF44 (active yellow clone)
  - Gray: #888888 (dying/dormant cells)

#### Stem Cell Representation
- **Shape**: Larger circles or stars to distinguish from regular cells
- **Position**: Fixed positions in triangular arrangement
- **States**:
  - Active: Bright color with pulsing animation
  - Dormant: Dim color, static
  - Suppressed: Crossed out or faded

#### Spatial Layout
- **Grid arrangement**: Cells arranged in hexagonal or square grid
- **Vascular network**: Background pattern suggesting blood vessels
- **Niche areas**: Highlighted regions around stem cells
- **Growth zones**: Areas where new cells appear

### Animation Phases

#### Phase 1: Initial State
- **Setup**: All cells gray/dormant
- **Stem cells**: All dormant except one
- **Population**: Minimal starting population
- **Duration**: 2-3 seconds

#### Phase 2: First Clone Expansion
- **Activation**: Red stem cell becomes active
- **Growth**: Red cells appear and multiply exponentially
- **Suppression**: Green and yellow stem cells remain suppressed
- **Duration**: 10-15 seconds

#### Phase 3: Clone Exhaustion
- **Division limit**: Red cells stop dividing
- **Cell death**: Red cells begin dying
- **Population decline**: Total population decreases
- **Suppression weakening**: Visual indication of reduced suppression

#### Phase 4: Succession Event
- **Trigger**: Green stem cell activates
- **Replacement**: Green cells replace dying red cells
- **New suppression**: Red and yellow stem cells become suppressed
- **Population recovery**: Total returns to ~100 cells

#### Phase 5: Continuous Cycling
- **Repeat pattern**: Green → Yellow → Red succession
- **Steady state**: Maintain population homeostasis
- **Periodic behavior**: Regular succession intervals

## Interactive Features

### User Controls
- **Play/Pause**: Start and stop animation
- **Speed control**: Adjust animation speed (0.1x to 10x)
- **Step mode**: Advance frame by frame
- **Reset**: Return to initial state
- **Position**: Controls positioned below the animation canvas

### Parameter Adjustment
- **Growth rates**: Slider for each clone's growth rate
- **Division limits**: Adjust maximum divisions per stem cell
- **Suppression strength**: Control suppression intensity
- **Population capacity**: Set maximum total population

### Visualization Options
- **View modes**:
  - Cell-level: Individual cell visualization
  - Population-level: Aggregate population graphs
  - Hybrid: Both views simultaneously
- **Data overlays**:
  - Population counts
  - Growth rates
  - Division remaining
  - Suppression levels

## Data Visualization Components

### Population Graph
- **Real-time plotting**: Live update of population counts
- **Multi-line graph**: Separate lines for each clone
- **Total population**: Horizontal line showing constant total
- **Time axis**: Scrolling time window

### Suppression Indicator
- **Strength meter**: Visual gauge of suppression level
- **Source indication**: Which clone is providing suppression
- **Threshold markers**: Critical levels for activation

### Division Counter
- **Per-clone counters**: Remaining divisions for each stem cell
- **Progress bars**: Visual representation of division depletion
- **Exhaustion warnings**: Alerts when approaching limits

## Implementation Phases

### Phase 1: Basic Animation (Week 1)
- [ ] Set up animation framework
- [ ] Implement basic cell rendering
- [ ] Create simple growth/death animations
- [ ] Add population counter

### Phase 2: Three-Clone System (Week 2)
- [ ] Add yellow clone
- [ ] Implement stem cell visualization
- [ ] Create suppression mechanism
- [ ] Add succession logic

### Phase 3: Interactive Features (Week 3)
- [ ] Add user controls
- [ ] Implement parameter sliders
- [ ] Create data visualization components
- [ ] Add export functionality

### Phase 4: Polish and Optimization (Week 4)
- [ ] Optimize performance
- [ ] Improve visual design
- [ ] Add documentation
- [ ] User testing and feedback

## Performance Requirements

### Computational Efficiency
- **Cell limit**: Handle up to 1000 cells smoothly
- **Memory usage**: < 100MB for full animation
- **CPU usage**: < 50% on modern browsers
- **Battery impact**: Minimal on mobile devices

### Browser Compatibility
- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **Mobile support**: iOS Safari, Chrome Mobile
- **Fallback options**: Static images if animation fails
- **Progressive enhancement**: Basic functionality for older browsers

## Testing and Validation

### Functional Testing
- [ ] Population homeostasis maintained
- [ ] Succession pattern correct
- [ ] Interactive controls work
- [ ] Data visualization accurate

### Performance Testing
- [ ] Frame rate stability
- [ ] Memory leak detection
- [ ] CPU usage monitoring
- [ ] Mobile device testing

### User Experience Testing
- [ ] Intuitive controls
- [ ] Clear visual communication
- [ ] Educational effectiveness
- [ ] Accessibility compliance

## Documentation Requirements

### User Guide
- [ ] How to use interactive features
- [ ] Interpretation of visualizations
- [ ] Parameter meanings and effects
- [ ] Troubleshooting common issues

### Technical Documentation
- [ ] Code architecture overview
- [ ] API documentation
- [ ] Deployment instructions
- [ ] Maintenance procedures

### Educational Materials
- [ ] Biological background explanation
- [ ] Mathematical model description
- [ ] Research applications
- [ ] Further reading suggestions
