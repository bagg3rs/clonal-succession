/**
 * StemCell class - Extends Cell with stem cell specific behaviors
 * Represents a stem cell that can produce suppression signals and activate/deactivate
 */
import Cell from './Cell.js';

class StemCell extends Cell {
  /**
   * Create a new stem cell
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {string} clone - Clone identifier (e.g., 'red', 'green')
   * @param {number} population - Population identifier
   */
  constructor(x, y, clone, population) {
    super(x, y, clone, population);
    
    // Override base cell properties
    this.isStemCell = true;
    this.isActive = false;
    this.suppressionStrength = 0;
    this.activationThreshold = 0.3; // Default activation threshold
    this.suppressionLevel = 1.0; // How suppressed this stem cell is (1.0 = fully suppressed)
    this.activationProgress = 0; // Progress towards activation (0-1)
    this.divisionsLeft = 25; // Number of divisions this stem cell can produce
    this.pulsePhase = 0; // For visual pulsing effect
    
    // Increase max age for stem cells
    this.maxAge = 2000 + Math.random() * 500;
  }
  
  /**
   * Get the color for rendering based on stem cell state
   * @returns {string} - CSS color string
   */
  getColor() {
    // Get base color from parent
    const baseColor = super.getColor();
    
    // For inactive stem cells, adjust transparency based on suppression level
    if (!this.isActive) {
      // More transparent when highly suppressed
      const alpha = Math.max(0.3, 1 - this.suppressionLevel);
      return this._addAlpha(baseColor, alpha);
    }
    
    // For active stem cells, add pulsing effect
    if (this.isActive) {
      // Pulse brightness based on phase
      const brightness = Math.sin(this.pulsePhase) * 0.2;
      return this._adjustColorBrightness(baseColor, brightness * 100);
    }
    
    return baseColor;
  }
  
  /**
   * Add alpha channel to a hex color
   * @param {string} hex - Hex color string
   * @param {number} alpha - Alpha value (0-1)
   * @returns {string} - RGBA color string
   * @private
   */
  _addAlpha(hex, alpha) {
    // Convert hex to RGB
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    
    // Return as rgba
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  /**
   * Update stem cell state for current frame
   * Handles suppression signal production and other stem cell specific behaviors
   */
  update() {
    // Call the parent update method
    super.update();
    
    // Update pulse phase for visual effect
    this.pulsePhase += 0.1;
    if (this.pulsePhase > Math.PI * 2) {
      this.pulsePhase -= Math.PI * 2;
    }
    
    // Additional stem cell specific updates
    if (this.isActive) {
      this._produceSuppressionSignal();
    } else {
      // Update activation progress based on suppression level
      if (this.suppressionLevel < this.activationThreshold) {
        this.activationProgress += (1 - this.suppressionLevel) * 0.01;
        
        // Check if ready to activate
        if (this.activationProgress >= 1) {
          // Reset activation progress but don't activate here
          // Activation should be controlled by StemCellManager
          this.activationProgress = 0;
        }
      } else {
        // Decrease activation progress when suppression is high
        this.activationProgress = Math.max(0, this.activationProgress - 0.005);
      }
    }
  }
  
  /**
   * Produce suppression signal that affects other stem cells
   * @private
   */
  _produceSuppressionSignal() {
    // Base suppression strength is proportional to remaining divisions
    const baseStrength = this.divisionsLeft / 25;
    
    // Adjust based on cell state
    let multiplier = 1.0;
    if (this.state === 'non-dividing') {
      multiplier = 0.7; // Reduced suppression when non-dividing
    } else if (this.state === 'senescent') {
      multiplier = 0.3; // Greatly reduced suppression when senescent
    }
    
    // Update suppression strength
    this.suppressionStrength = baseStrength * multiplier;
  }
  
  /**
   * Apply suppression from other stem cells
   * @param {number} strength - Strength of the suppression signal
   */
  suppress(strength) {
    // Update suppression level with some inertia
    this.suppressionLevel = this.suppressionLevel * 0.9 + strength * 0.1;
    
    // Ensure suppression level stays in valid range
    this.suppressionLevel = Math.max(0, Math.min(1, this.suppressionLevel));
  }
  
  /**
   * Check if this stem cell can activate based on current suppression level
   * @param {number} currentSuppressionLevel - Current global suppression level
   * @returns {boolean} - Whether this stem cell can activate
   */
  canActivate(currentSuppressionLevel) {
    // Check if suppression is below activation threshold
    // and this stem cell has divisions left
    return currentSuppressionLevel < this.activationThreshold && 
           this.divisionsLeft > 0 &&
           !this.isActive;
  }
  
  /**
   * Activate this stem cell
   */
  activate() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.suppressionLevel = 0;
    this.activationProgress = 0;
    
    // Reset state to dividing when activated
    if (this.state !== 'dividing') {
      const oldState = this.state;
      this.state = 'dividing';
      this.canDivide = true;
      
      // Notify of state change
      if (this.onStateChanged) {
        this.onStateChanged(oldState, this.state);
      }
    }
    
    // Visual indication of activation
    this._updateAppearance();
    
    // Emit activation event if handler exists
    if (this.onActivated) {
      this.onActivated(this);
    }
  }
  
  /**
   * Deactivate this stem cell
   */
  deactivate() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.suppressionStrength = 0;
    
    // Visual indication of deactivation
    this._updateAppearance();
    
    // Emit deactivation event if handler exists
    if (this.onDeactivated) {
      this.onDeactivated(this);
    }
  }
  
  /**
   * Record a successful division from this stem cell
   */
  recordDivision() {
    if (this.isActive && this.divisionsLeft > 0) {
      this.divisionsLeft--;
      
      // If no divisions left, transition to non-dividing state
      if (this.divisionsLeft <= 0) {
        const oldState = this.state;
        this.state = 'non-dividing';
        this.canDivide = false;
        
        // Notify of state change
        if (this.onStateChanged) {
          this.onStateChanged(oldState, this.state);
        }
      }
    }
  }
  
  /**
   * Get the activation progress of this stem cell
   * @returns {number} - Activation progress (0-1)
   */
  getActivationProgress() {
    return this.activationProgress;
  }
  
  /**
   * Get the number of divisions left for this stem cell
   * @returns {number} - Divisions left
   */
  getDivisionsLeft() {
    return this.divisionsLeft;
  }
}

// Export the StemCell class
export default StemCell;