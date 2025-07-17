/**
 * StemCell class - Extends Cell with stem cell specific behaviors
 * Represents a stem cell that can produce suppression signals and activate/deactivate
 */
import Cell from './Cell.js';

class StemCell extends Cell {
  /**
   * Stem cell states enum
   * @readonly
   * @enum {string}
   */
  static States = {
    DORMANT: 'dormant',
    ACTIVATING: 'activating',
    ACTIVE: 'active',
    DEPLETED: 'depleted'
  };

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
    this.stemCellState = StemCell.States.DORMANT;
    this.isActive = false;
    this.suppressionStrength = 0;
    this.activationThreshold = 0.3; // Default activation threshold
    this.suppressionLevel = 1.0; // How suppressed this stem cell is (1.0 = fully suppressed)
    this.activationProgress = 0; // Progress towards activation (0-1)
    this.divisionsLeft = 25; // Number of divisions this stem cell can produce
    this.maxDivisions = 25; // Maximum number of divisions
    this.pulsePhase = 0; // For visual pulsing effect
    
    // Visual properties
    this.glowIntensity = 0; // Glow effect intensity
    this.glowColor = this._getGlowColorForClone(clone);
    this.pulseSpeed = 0.1; // Speed of pulsing effect
    this.haloSize = 0; // Size of halo effect
    this.haloOpacity = 0; // Opacity of halo effect
    
    // Suppression field properties
    this.suppressionFieldRadius = 0; // Radius of suppression field
    this.suppressionFieldOpacity = 0; // Opacity of suppression field
    
    // Increase max age for stem cells
    this.maxAge = 2000 + Math.random() * 500;
    
    // Override state transition thresholds for stem cells
    this.divisionThreshold = 0.6; // Stem cells stay in dividing state longer
    this.senescenceThreshold = 0.8; // Stem cells become senescent later
  }
  
  /**
   * Get the glow color based on clone
   * @param {string} clone - Clone identifier
   * @returns {string} - CSS color string
   * @private
   */
  _getGlowColorForClone(clone) {
    switch (clone) {
      case 'red':
        return '#ff6666';
      case 'green':
        return '#66ff66';
      case 'yellow':
        return '#ffff66';
      default:
        return '#ffffff';
    }
  }

  /**
   * Get the color for rendering based on stem cell state
   * @returns {string} - CSS color string
   */
  getColor() {
    // Get base color from parent
    const baseColor = super.getColor();
    
    // Adjust color based on stem cell state
    switch (this.stemCellState) {
      case StemCell.States.DORMANT:
        // More transparent when highly suppressed
        const alpha = Math.max(0.3, 1 - this.suppressionLevel);
        return this._addAlpha(baseColor, alpha);
        
      case StemCell.States.ACTIVATING:
        // Brighter color during activation
        return this._adjustColorBrightness(baseColor, 20);
        
      case StemCell.States.ACTIVE:
        // Pulsing effect for active stem cells
        const brightness = Math.sin(this.pulsePhase) * 0.2;
        return this._adjustColorBrightness(baseColor, brightness * 100);
        
      case StemCell.States.DEPLETED:
        // Darker color for depleted stem cells
        return this._adjustColorBrightness(baseColor, -30);
        
      default:
        return baseColor;
    }
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
    this.pulsePhase += this.pulseSpeed;
    if (this.pulsePhase > Math.PI * 2) {
      this.pulsePhase -= Math.PI * 2;
    }
    
    // Update stem cell specific state
    this._updateStemCellState();
    
    // Update visual properties based on state
    this._updateVisualProperties();
    
    // Additional stem cell specific updates
    if (this.isActive) {
      this._produceSuppressionSignal();
    } else {
      // Update activation progress based on suppression level
      if (this.suppressionLevel < this.activationThreshold) {
        // Increase activation progress faster when suppression is lower
        const progressRate = (1 - this.suppressionLevel) * 0.01;
        this.activationProgress += progressRate;
        
        // Update stem cell state if progressing towards activation
        if (this.stemCellState === StemCell.States.DORMANT && this.activationProgress > 0.3) {
          this.stemCellState = StemCell.States.ACTIVATING;
        }
        
        // Check if ready to activate
        if (this.activationProgress >= 1) {
          // Reset activation progress but don't activate here
          // Activation should be controlled by StemCellManager
          this.activationProgress = 0;
        }
      } else {
        // Decrease activation progress when suppression is high
        this.activationProgress = Math.max(0, this.activationProgress - 0.005);
        
        // Return to dormant state if activation progress is low
        if (this.stemCellState === StemCell.States.ACTIVATING && this.activationProgress < 0.2) {
          this.stemCellState = StemCell.States.DORMANT;
        }
      }
    }
  }
  
  /**
   * Update stem cell specific state based on current conditions
   * @private
   */
  _updateStemCellState() {
    // Update stem cell state based on activity and divisions left
    if (this.isActive) {
      // Active stem cells
      if (this.divisionsLeft <= 0) {
        this.stemCellState = StemCell.States.DEPLETED;
      } else {
        this.stemCellState = StemCell.States.ACTIVE;
      }
    } else {
      // Inactive stem cells
      if (this.divisionsLeft <= 0) {
        this.stemCellState = StemCell.States.DEPLETED;
      } else if (this.activationProgress > 0.3) {
        this.stemCellState = StemCell.States.ACTIVATING;
      } else {
        this.stemCellState = StemCell.States.DORMANT;
      }
    }
  }
  
  /**
   * Update visual properties based on stem cell state
   * @private
   */
  _updateVisualProperties() {
    // Update visual properties based on stem cell state
    switch (this.stemCellState) {
      case StemCell.States.DORMANT:
        this.glowIntensity = 0;
        this.haloSize = 0;
        this.haloOpacity = 0;
        this.suppressionFieldRadius = 0;
        this.suppressionFieldOpacity = 0;
        this.pulseSpeed = 0.05;
        break;
        
      case StemCell.States.ACTIVATING:
        this.glowIntensity = 0.3 + 0.2 * Math.sin(this.pulsePhase);
        this.haloSize = 2 + this.activationProgress * 3;
        this.haloOpacity = 0.3 + this.activationProgress * 0.4;
        this.suppressionFieldRadius = 0;
        this.suppressionFieldOpacity = 0;
        this.pulseSpeed = 0.15;
        break;
        
      case StemCell.States.ACTIVE:
        this.glowIntensity = 0.5 + 0.3 * Math.sin(this.pulsePhase);
        this.haloSize = 5;
        this.haloOpacity = 0.7;
        this.suppressionFieldRadius = 50 + 10 * Math.sin(this.pulsePhase);
        this.suppressionFieldOpacity = 0.2 + 0.1 * Math.sin(this.pulsePhase);
        this.pulseSpeed = 0.1;
        break;
        
      case StemCell.States.DEPLETED:
        this.glowIntensity = 0.1;
        this.haloSize = 1;
        this.haloOpacity = 0.2;
        this.suppressionFieldRadius = 0;
        this.suppressionFieldOpacity = 0;
        this.pulseSpeed = 0.03;
        break;
    }
  }
  
  /**
   * Produce suppression signal that affects other stem cells
   * @private
   */
  _produceSuppressionSignal() {
    // Base suppression strength is proportional to remaining divisions
    const baseStrength = this.divisionsLeft / this.maxDivisions;
    
    // Adjust based on cell state
    let multiplier = 1.0;
    if (this.state === Cell.States.NON_DIVIDING) {
      multiplier = 0.7; // Reduced suppression when non-dividing
    } else if (this.state === Cell.States.SENESCENT) {
      multiplier = 0.3; // Greatly reduced suppression when senescent
    }
    
    // Adjust based on stem cell state
    if (this.stemCellState === StemCell.States.DEPLETED) {
      multiplier *= 0.2; // Greatly reduced suppression when depleted
    }
    
    // Update suppression strength
    this.suppressionStrength = baseStrength * multiplier;
    
    // Update suppression field visual properties
    this.suppressionFieldRadius = 50 + 20 * this.suppressionStrength;
    this.suppressionFieldOpacity = 0.1 + 0.2 * this.suppressionStrength;
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
    
    // Update visual properties based on suppression level
    if (this.stemCellState === StemCell.States.DORMANT || 
        this.stemCellState === StemCell.States.ACTIVATING) {
      // Higher suppression means less glow and visual effects
      this.glowIntensity = Math.max(0, 0.3 - this.suppressionLevel * 0.3);
      this.haloOpacity = Math.max(0, 0.4 - this.suppressionLevel * 0.4);
    }
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
           !this.isActive &&
           this.stemCellState !== StemCell.States.DEPLETED;
  }
  
  /**
   * Activate this stem cell
   */
  activate() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.suppressionLevel = 0;
    this.activationProgress = 0;
    this.stemCellState = StemCell.States.ACTIVE;
    
    // Reset state to dividing when activated
    if (this.state !== Cell.States.DIVIDING) {
      const oldState = this.state;
      this.state = Cell.States.DIVIDING;
      this.canDivide = true;
      
      // Notify of state change
      if (this.onStateChanged) {
        this.onStateChanged(oldState, this.state);
      }
    }
    
    // Create activation visual effect
    this.stateTransitionEffect = true;
    this.stateTransitionTime = 0;
    
    // Visual indication of activation
    this._updateAppearance();
    this._updateVisualProperties();
    
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
    
    // Update stem cell state
    if (this.divisionsLeft <= 0) {
      this.stemCellState = StemCell.States.DEPLETED;
    } else {
      this.stemCellState = StemCell.States.DORMANT;
    }
    
    // Create deactivation visual effect
    this.stateTransitionEffect = true;
    this.stateTransitionTime = 0;
    
    // Visual indication of deactivation
    this._updateAppearance();
    this._updateVisualProperties();
    
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
      
      // If no divisions left, transition to non-dividing state and depleted stem cell state
      if (this.divisionsLeft <= 0) {
        const oldState = this.state;
        this.state = Cell.States.NON_DIVIDING;
        this.canDivide = false;
        this.stemCellState = StemCell.States.DEPLETED;
        
        // Create visual effect for depletion
        this.stateTransitionEffect = true;
        this.stateTransitionTime = 0;
        
        // Update visual properties
        this._updateAppearance();
        this._updateVisualProperties();
        
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