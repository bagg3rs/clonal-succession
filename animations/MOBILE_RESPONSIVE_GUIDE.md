# Mobile Responsive Implementation Guide

This guide explains how to make the animation files in this project mobile-friendly and responsive.

## Quick Implementation Steps

To make any animation file in this project mobile responsive, follow these steps:

1. Add the viewport meta tag in the `<head>` section:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```

2. Include the mobile responsive CSS file:
   ```html
   <link rel="stylesheet" href="mobile-responsive.css">
   ```

3. Include the mobile responsive JavaScript file before your main script:
   ```html
   <script src="mobile-responsive.js"></script>
   ```

4. Make sure your canvas has the `id="canvas"` attribute:
   ```html
   <canvas id="canvas" width="600" height="600"></canvas>
   ```

5. Ensure the HTML elements are in the correct order:
   ```html
   <canvas id="canvas" width="600" height="600"></canvas>
   <div class="controls">
     <!-- Controls content -->
   </div>
   <div class="stats">
     <!-- Stats content -->
   </div>
   ```

## What These Files Do

### mobile-responsive.css

This CSS file provides:
- Responsive layout for the body and container elements
- Proper scaling for the canvas element on different screen sizes
- Responsive controls and stats display positioned below the canvas
- Media queries for tablets and mobile phones

### mobile-responsive.js

This JavaScript file:
- Automatically resizes the canvas to fit the screen width while maintaining aspect ratio
- Adds event listeners to handle window resize events
- Ensures the simulation looks good on all device sizes
- Fixes mobile scrolling issues when animations are embedded in iframes

## Manual Implementation

If you need to implement responsiveness manually in a file, here are the key components:

1. Add the viewport meta tag

2. Make the canvas responsive with CSS:
   ```css
   canvas {
     max-width: 100%;
     width: 100%;
     max-height: 70vh;
     height: auto;
     aspect-ratio: 1/1;
     margin-bottom: 20px; /* Add margin below canvas */
   }
   ```

3. Position controls below the canvas:
   ```css
   .controls {
     margin-top: 0;
     margin-bottom: 20px;
     width: 100%;
     max-width: 600px;
     display: flex;
     flex-wrap: wrap;
     justify-content: center;
     order: 1; /* Controls after canvas */
   }
   
   .stats {
     margin-top: 0;
     width: 100%;
     max-width: 600px;
     display: flex;
     flex-wrap: wrap;
     justify-content: center;
     order: 2; /* Stats after controls */
   }
   ```

4. Add JavaScript to handle canvas resizing:
   ```javascript
   function resizeCanvas() {
     const canvas = document.getElementById('canvas');
     const container = document.querySelector('body');
     const containerWidth = Math.min(container.clientWidth - 20, 600);
     
     canvas.style.width = containerWidth + 'px';
     canvas.style.height = containerWidth + 'px';
   }
   
   resizeCanvas();
   window.addEventListener('resize', resizeCanvas);
   ```

## Mobile Scrolling Fix

When embedding animations in iframes, users may experience issues with scrolling on mobile devices. The iframe can capture touch events, preventing users from scrolling the main page. To fix this:

1. Add the `scrolling="no"` attribute to your iframe:
   ```html
   <iframe src="animations/your-animation.html" scrolling="no"></iframe>
   ```

2. Use the touch event handling code in the parent page:
   ```javascript
   // Fix for mobile scrolling issue
   let touchStartY = 0;
   let touchMoveY = 0;
   let isScrolling = false;
   
   // Add touch event listeners to detect scrolling
   document.addEventListener('touchstart', function(e) {
     touchStartY = e.touches[0].clientY;
     isScrolling = false;
   }, { passive: false });
   
   document.addEventListener('touchmove', function(e) {
     touchMoveY = e.touches[0].clientY;
     
     // If user is scrolling vertically (up or down)
     if (Math.abs(touchMoveY - touchStartY) > 10) {
       isScrolling = true;
       
       // Temporarily disable pointer events on iframe to allow page scrolling
       iframe.style.pointerEvents = 'none';
     }
   }, { passive: false });
   
   document.addEventListener('touchend', function() {
     // Re-enable pointer events after scrolling stops
     setTimeout(function() {
       iframe.style.pointerEvents = 'auto';
       isScrolling = false;
     }, 100);
   }, { passive: false });
   ```

3. The `mobile-responsive.js` file already includes code to help animations work properly when embedded in iframes.

## Testing

After implementation, test your animation on:
- Desktop browsers at various window sizes
- Mobile devices in portrait and landscape orientation
- Tablets
- Ensure controls are usable on touch devices

## Testing Mobile Scrolling

To test if the mobile scrolling fix is working:
1. Open the test page at `/tests/mobile-scroll-test.html`
2. Click the play button to load the simulation
3. Try scrolling the page on a mobile device
4. Verify that you can scroll the page while still interacting with the simulation