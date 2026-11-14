# Design Document: Single Row Controls

## Overview

This design document outlines the approach for reorganizing the simulation controls and statistics into a single horizontal row at the bottom of the canvas. The goal is to create a more streamlined and space-efficient interface, particularly beneficial for mobile devices.

## Architecture

The implementation will primarily involve CSS changes to the layout structure, with minimal HTML modifications. We'll leverage flexbox for horizontal alignment and responsive behavior.

### Components and Interfaces

1. **Control Container**
   - A single flex container that holds all controls and statistics
   - Horizontal layout with wrap capability for smaller screens
   - Consistent spacing and alignment

2. **Control Elements**
   - Reset button
   - Speed toggle button
   - Total cell count display

3. **Responsive Behavior**
   - Primary controls remain in the first row when wrapping occurs
   - Consistent sizing across different screen sizes
   - Touch-friendly target sizes on mobile

## Data Models

No changes to the underlying data models are required. This is purely a UI layout enhancement.

## Implementation Details

### HTML Structure

The current HTML structure in `clonal-succession-cycle.html` has separate sections for controls and statistics:

```html
<div class="controls">
  <button onclick="resetSimulation()">🔄 Reset</button>
  <button onclick="cycleSpeed()" id="speed-button">2x Speed</button>
  <!-- Other controls -->
</div>

<div class="stats">
  <!-- Statistics items -->
  <div class="stat-item">
    <div class="stat-value" id="total-count">1</div>
    <div>Total Cells</div>
  </div>
  <!-- Other stats -->
</div>
```

We will modify this to combine controls and essential statistics into a single container:

```html
<div class="controls">
  <button onclick="resetSimulation()">🔄 Reset</button>
  <button onclick="cycleSpeed()" id="speed-button">2x Speed</button>
  
  <div class="stat-item">
    <div class="stat-value" id="total-count">1</div>
    <div>Total Cells</div>
  </div>
</div>
```

### CSS Changes

The primary changes will be in `mobile-responsive.css`:

1. **Horizontal Layout**:
   ```css
   .controls {
     display: flex;
     flex-direction: row;
     flex-wrap: wrap;
     justify-content: center;
     align-items: center;
     gap: 10px;
     width: 100%;
     max-width: 600px;
     margin: 10px auto;
   }
   ```

2. **Button Styling**:
   ```css
   .controls button {
     flex: 0 0 auto;
     padding: 8px 16px;
     margin: 0;
     height: 40px;
   }
   ```

3. **Stat Item Styling**:
   ```css
   .stat-item {
     display: flex;
     flex-direction: column;
     align-items: center;
     justify-content: center;
     margin: 0 10px;
     flex: 0 0 auto;
   }
   ```

4. **Responsive Adjustments**:
   ```css
   @media (max-width: 480px) {
     .controls {
       gap: 5px;
     }
     
     .controls button {
       padding: 6px 12px;
       font-size: 14px;
     }
     
     .stat-item {
       margin: 0 5px;
       font-size: 12px;
     }
   }
   ```

## Error Handling

No specific error handling is required for this UI enhancement. The layout should gracefully adapt to different screen sizes through CSS.

## Testing Strategy

1. **Desktop Testing**:
   - Verify controls appear in a single row
   - Check proper spacing and alignment
   - Test button functionality

2. **Tablet Testing**:
   - Verify controls scale appropriately
   - Test touch interaction with buttons
   - Verify readability of statistics

3. **Mobile Testing**:
   - Verify controls wrap properly on narrow screens
   - Ensure primary controls remain accessible
   - Test touch targets are large enough
   - Verify all elements are visible without horizontal scrolling

4. **Cross-Browser Testing**:
   - Test in Chrome, Firefox, Safari, and Edge
   - Verify consistent appearance and behavior