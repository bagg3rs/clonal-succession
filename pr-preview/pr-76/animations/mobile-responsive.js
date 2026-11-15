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
}

// Call this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', makeCanvasResponsive);