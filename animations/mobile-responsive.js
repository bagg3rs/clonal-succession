// Mobile responsive functionality for animation files

// Make canvas responsive
function makeCanvasResponsive() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  function resizeCanvas() {
    const container = document.querySelector('body');
    const containerWidth = Math.min(container.clientWidth - 20, 600); // Max width 600px, with 10px padding on each side
    
    // Set canvas size maintaining 1:1 aspect ratio
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerWidth + 'px';
  }
  
  // Call resize on page load and window resize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Fix for mobile scrolling issues when embedded in iframe
  fixMobileScrolling(canvas);
}

// Fix mobile scrolling issues
function fixMobileScrolling(canvas) {
  // Only apply this fix when inside an iframe
  if (window.self !== window.top) {
    // Prevent canvas from capturing touch events when user is trying to scroll the parent page
    let touchStartY = 0;
    let touchMoveY = 0;
    
    canvas.addEventListener('touchstart', function(e) {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    canvas.addEventListener('touchmove', function(e) {
      touchMoveY = e.touches[0].clientY;
      
      // If vertical movement is significant, it might be a scroll attempt
      const verticalDelta = Math.abs(touchMoveY - touchStartY);
      
      // If the user is clearly trying to scroll vertically
      if (verticalDelta > 10) {
        // Allow the event to propagate to parent for scrolling
        e.stopPropagation();
      }
    }, { passive: true });
  }
}

// Call this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', makeCanvasResponsive);