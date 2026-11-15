/**
 * Cell class - Base class for all cells in the simulation
 * Represents a single cell with lifecycle states and physical properties
 */
class Cell {
  /**
   * Cell states enum
   * @readonly
   * @enum {string}
   */
  static States = {
    DIVIDING: 'dividing',
    NON_DIVIDING: 'non-dividing',
    SENESCENT: 'senescent'
  };

  /**
   * Create a new cell
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {string} clone - Clone identifier (e.g., 'red', 'green')
   * @param {number} population - Population identifier
   */
  constructor(x, y, clone, population) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.clone = clone;
    this.population = population;
    this.age = 0;
    this.maxAge = 1000 + Math.random() * 500;
    this.state = Cell.States.DIVIDING;
    this.canDivide = true;
    this.divisionCooldown = 0;
    this.isDividing = false;
    this.isNewborn = true;
    this.isStemCell = false;
    this.body = null; // Physics body reference
    
    // State transition thresholds (as percentage of maxAge)
    this.divisionThreshold = 0.4; // When to transition from dividing to non-dividing
    this.senescenceThreshold = 0.7; // When to transition from non-dividing to senescent
    
    // Division limits
    this.divisionsLeft = 25; // Maximum number of divisions a cell can undergo
    this.divisionCount = 0; // Number of divisions this cell has undergone
    
    // Visual indicators
    this.stateTransitionEffect = false; // Visual effect when state changes
    this.stateTransitionTime = 0; // Time counter for transition effect
    
    // Create the physical body for this cell
    this._createBody(x, y);
    
    // Set newborn state timeout
    setTimeout(() => {
      this.isNewborn = false;
    }, 800);
  }
  
  /**
   * Create the physical body for this cell
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @private
   */
  _createBody(x, y) {
    // This will be implemented by the physics system
    // Placeholder for now
  }
  
  /**
   * Get the color for rendering based on cell state and clone
   * @returns {string} - CSS color string
   */
  getColor() {
    // Base colors for each clone
    const baseColors = {
      red: '#ff4444',
      green: '#44ff44',
      yellow: '#ffff44'
    };
    
    // Get base color for this clone, default to red if not found
    const baseColor = baseColors[this.clone] || baseColors.red;
    
    // Modify color based on cell state
    switch (this.state) {
      case Cell.States.DIVIDING:
        return baseColor; // Full brightness for dividing cells
      case Cell.States.NON_DIVIDING:
        return this._adjustColorBrightness(baseColor, -20); // Slightly darker
      case Cell.States.SENESCENT:
        return this._adjustColorBrightness(baseColor, -50); // Much darker
      default:
        return baseColor;
    }
  }
  
  /**
   * Get the visual indicator for the current cell state
   * @returns {Object} - Visual indicator properties
   */
  getStateIndicator() {
    switch (this.state) {
      case Cell.States.DIVIDING:
        return {
          borderColor: '#ffffff',
          borderWidth: 1,
          pattern: null
        };
      case Cell.States.NON_DIVIDING:
        return {
          borderColor: '#aaaaaa',
          borderWidth: 1,
          pattern: 'dotted'
        };
      case Cell.States.SENESCENT:
        return {
          borderColor: '#888888',
          borderWidth: 2,
          pattern: 'cross'
        };
      default:
        return {
          borderColor: '#ffffff',
          borderWidth: 1,
          pattern: null
        };
    }
  }
  
  /**
   * Adjust the brightness of a hex color
   * @param {string} hex - Hex color string
   * @param {number} percent - Percentage to adjust brightness (-100 to 100)
   * @returns {string} - Adjusted hex color
   * @private
   */
  _adjustColorBrightness(hex, percent) {
    // Convert hex to RGB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    // Adjust brightness
    r = Math.max(0, Math.min(255, r + (percent / 100) * 255));
    g = Math.max(0, Math.min(255, g + (percent / 100) * 255));
    b = Math.max(0, Math.min(255, b + (percent / 100) * 255));
    
    // Convert back to hex
    return '#' + 
      Math.round(r).toString(16).padStart(2, '0') +
      Math.round(g).toString(16).padStart(2, '0') +
      Math.round(b).toString(16).padStart(2, '0');
  }
  
  /**
   * Update cell state for current frame
   * Handles aging, state transitions, and physical behaviors
   */
  update() {
    this.age++;
    
    // Handle division cooldown
    if (this.divisionCooldown > 0) {
      this.divisionCooldown--;
      if (this.divisionCooldown === 0) {
        this.canDivide = true;
      }
    }
    
    // State transitions based on age
    this._updateState();
    
    // Physical behaviors
    this._maintainPosition();
  }
  
  /**
   * Update cell state based on age and conditions
   * @private
   */
  _updateState() {
    const oldState = this.state;
    
    // Transition from dividing to non-dividing based on age or division count
    if (this.state === Cell.States.DIVIDING && 
        (this.age > this.maxAge * this.divisionThreshold || 
         this.divisionCount >= this.divisionsLeft)) {
      this.transitionState(Cell.States.NON_DIVIDING);
    } 
    // Transition from non-dividing to senescent
    else if (this.state === Cell.States.NON_DIVIDING && 
             this.age > this.maxAge * this.senescenceThreshold) {
      this.transitionState(Cell.States.SENESCENT);
    }
    
    // Senescent cells age faster
    if (this.state === Cell.States.SENESCENT) {
      this.age += 3; // Age 4x faster (1 normal + 3 extra)
    }
    
    // Update state transition effect if active
    if (this.stateTransitionEffect) {
      this.stateTransitionTime++;
      if (this.stateTransitionTime > 30) { // Effect lasts for 30 frames (0.5 seconds)
        this.stateTransitionEffect = false;
        this.stateTransitionTime = 0;
      }
    }
  }
  
  /**
   * Update the cell's visual appearance based on its state
   * @private
   */
  _updateAppearance() {
    // This method will be called when the cell's state changes
    // It updates visual properties that will be used by the rendering system
    
    // Get state indicator properties
    const indicator = this.getStateIndicator();
    
    // Store visual properties on the cell for the renderer to use
    this.visualProperties = {
      // Base color is determined by getColor() method
      borderColor: indicator.borderColor,
      borderWidth: indicator.borderWidth,
      pattern: indicator.pattern,
      
      // Add state-specific visual effects
      glowColor: this.stateTransitionEffect ? this._getTransitionGlowColor() : null,
      glowIntensity: this.stateTransitionEffect ? 
        Math.sin(this.stateTransitionTime / 30 * Math.PI) : 0, // Fade in and out
      
      // Add state-specific size adjustments
      sizeMultiplier: this._getStateSizeMultiplier(),
      
      // Add opacity adjustments for senescent cells
      opacity: this.state === Cell.States.SENESCENT ? 
        0.7 + 0.3 * Math.sin(this.age / 10) : 1.0 // Pulsing effect for senescent cells
    };
  }
  
  /**
   * Get the glow color for state transition effects
   * @returns {string} - CSS color string for glow effect
   * @private
   */
  _getTransitionGlowColor() {
    switch (this.state) {
      case Cell.States.DIVIDING:
        return '#ffffff'; // White glow for dividing cells
      case Cell.States.NON_DIVIDING:
        return '#aaaaaa'; // Gray glow for non-dividing cells
      case Cell.States.SENESCENT:
        return '#ffaa00'; // Orange glow for senescent cells
      default:
        return '#ffffff';
    }
  }
  
  /**
   * Get size multiplier based on cell state
   * @returns {number} - Size multiplier for rendering
   * @private
   */
  _getStateSizeMultiplier() {
    switch (this.state) {
      case Cell.States.DIVIDING:
        return 1.0;
      case Cell.States.NON_DIVIDING:
        return 0.9; // Slightly smaller
      case Cell.States.SENESCENT:
        return 1.1; // Slightly larger (swollen appearance)
      default:
        return 1.0;
    }
  }
  
  /**
   * Keep the cell within boundaries and handle interactions with other cells
   * @private
   */
  _maintainPosition() {
    this._stayWithinBoundary();
    this._maintainCohesion();
    this._dampenMovement();
  }
  
  /**
   * Keep the cell within the simulation boundary
   * @private
   */
  _stayWithinBoundary() {
    // Will be implemented by the physics system
    // Placeholder for now
  }
  
  /**
   * Maintain cohesion with nearby cells
   * @private
   */
  _maintainCohesion() {
    // Will be implemented by the physics system
    // Placeholder for now
  }
  
  /**
   * Dampen excessive movement
   * @private
   */
  _dampenMovement() {
    // Will be implemented by the physics system
    // Placeholder for now
  }
  
  /**
   * Transition the cell to a new state
   * @param {string} newState - The new state to transition to
   * @returns {boolean} - Whether the transition was successful
   */
  transitionState(newState) {
    // Validate the new state
    if (!Object.values(Cell.States).includes(newState)) {
      console.error(`Invalid cell state: ${newState}`);
      return false;
    }
    
    // Don't transition to the same state
    if (this.state === newState) {
      return false;
    }
    
    const oldState = this.state;
    
    // Apply state-specific changes
    switch (newState) {
      case Cell.States.DIVIDING:
        // Can only transition to dividing from creation
        if (oldState !== null) {
          return false;
        }
        this.canDivide = true;
        break;
        
      case Cell.States.NON_DIVIDING:
        // Can only transition from dividing to non-dividing
        if (oldState !== Cell.States.DIVIDING) {
          return false;
        }
        this.canDivide = false;
        break;
        
      case Cell.States.SENESCENT:
        // Can transition to senescent from any state
        this.canDivide = false;
        break;
    }
    
    // Update the state
    this.state = newState;
    
    // Trigger visual effect for state transition
    this.stateTransitionEffect = true;
    this.stateTransitionTime = 0;
    
    // Update appearance
    this._updateAppearance();
    
    // Notify of state change
    if (this.onStateChanged) {
      this.onStateChanged(oldState, this.state);
    }
    
    return true;
  }

  /**
   * Check if the cell should become senescent based on position and resource competition
   * Cells near the boundary or in crowded areas are more likely to become senescent
   * This method is called by the PopulationController for homeostasis mechanisms
   */
  checkSenescence() {
    // Skip if already senescent
    if (this.state === Cell.States.SENESCENT) return;
    
    // Skip if no body (physics not initialized)
    if (!this.body) return;
    
    // This method is now primarily handled by PopulationController
    // for more sophisticated homeostasis mechanisms
    // Individual cells can still have basic senescence checks
    
    // Basic age-based senescence check
    const agePercentage = this.getAgePercentage();
    if (agePercentage > 0.9 && Math.random() < 0.1) {
      this.transitionState(Cell.States.SENESCENT);
    }
  }
  
  /**
   * Calculate the crowding factor around this cell
   * @returns {number} - Crowding factor (0-1), higher means more crowded
   * @private
   */
  _calculateCrowdingFactor() {
    // This is a placeholder - actual implementation would use physics system
    // to count nearby cells and calculate density
    
    // For now, we'll use a simple approximation based on nearby cells
    const nearbyCells = this._countNearbyCells();
    const maxNearbyCells = 8; // Maximum expected cells in close proximity
    
    return Math.min(1.0, nearbyCells / maxNearbyCells);
  }
  
  /**
   * Count the number of cells in close proximity
   * @returns {number} - Number of nearby cells
   * @private
   */
  _countNearbyCells() {
    // This is a placeholder - actual implementation would use physics system
    // For now, return a random value for testing
    return Math.floor(Math.random() * 10); // Random number between 0-9
  }
  
  /**
   * Get the distance to the boundary as a percentage of radius
   * @returns {number} - Distance as percentage (0-1)
   * @private
   */
  _getDistanceToBoundary() {
    // This is a placeholder - actual implementation would use physics system
    // For now, return a random value for testing
    return Math.random() * 0.2; // Random distance between 0-20% of radius
  }
  
  /**
   * Attempt to divide this cell
   * @returns {Cell|null} - New cell if division successful, null otherwise
   */
  divide() {
    // Cannot divide if not in dividing state
    if (this.state !== Cell.States.DIVIDING) {
      return null;
    }
    
    // Check basic division conditions
    if (!this.canDivide || this.divisionCooldown > 0) {
      return null;
    }
    
    // Check division limit
    if (this.divisionCount >= this.divisionsLeft) {
      // Transition to non-dividing if we've reached division limit
      this.transitionState(Cell.States.NON_DIVIDING);
      return null;
    }
    
    // Increment division count
    this.divisionCount++;
    
    // Set division cooldown
    this.divisionCooldown = 60; // 1 second at 60fps
    this.isDividing = true;
    
    // Calculate position for new cell (slightly offset from parent)
    const angle = Math.random() * Math.PI * 2;
    const distance = 5; // Small distance to prevent overlap
    const childX = this.body ? this.body.position.x + Math.cos(angle) * distance : 0;
    const childY = this.body ? this.body.position.y + Math.sin(angle) * distance : 0;
    
    // Create new cell of same type
    const CellClass = this.constructor;
    const childCell = new CellClass(childX, childY, this.clone, this.population);
    
    // Inherit some properties from parent
    childCell.divisionsLeft = this.divisionsLeft - 1; // Child has one less division available
    
    // Reset division flag after short delay
    setTimeout(() => {
      this.isDividing = false;
    }, 500);
    
    // Reset division cooldown after longer delay
    setTimeout(() => {
      this.canDivide = true;
    }, 1000);
    
    return childCell;
  }
  
  /**
   * Get the number of divisions left before this cell can no longer divide
   * @returns {number} - Number of divisions left
   */
  getDivisionsLeft() {
    if (this.state !== Cell.States.DIVIDING) {
      return 0;
    }
    return Math.max(0, this.divisionsLeft - this.divisionCount);
  }
  
  /**
   * Get the cell's age as a percentage of its maximum age
   * @returns {number} - Age percentage (0-1)
   */
  getAgePercentage() {
    return Math.min(1.0, this.age / this.maxAge);
  }
  
  /**
   * Prepare cell for death with visual effects
   * @param {string} cause - Cause of death (age, boundary, resource, etc.)
   * @returns {Object} - Death event details
   */
  prepareForDeath(cause = 'age') {
    // Create death event details
    const deathEvent = {
      cellId: this.id,
      clone: this.clone,
      state: this.state,
      position: this.body ? { x: this.body.position.x, y: this.body.position.y } : null,
      age: this.age,
      cause: cause,
      isStemCell: this.isStemCell,
      time: Date.now()
    };
    
    // Set death visual effect properties
    this.isDying = true;
    this.deathCause = cause;
    this.deathTime = 0;
    this.deathEffectDuration = 30; // 0.5 seconds at 60fps
    
    // Update appearance for death effect
    this._updateAppearance();
    
    return deathEvent;
  }
  
  /**
   * Update death effect animation
   * @returns {boolean} - Whether the death effect is complete
   */
  updateDeathEffect() {
    if (!this.isDying) return false;
    
    this.deathTime++;
    
    // Update death-specific visual properties
    const progress = this.deathTime / this.deathEffectDuration;
    
    // Store death effect properties for renderer
    this.deathEffectProperties = {
      progress: progress,
      opacity: 1 - progress,
      scale: 1 - progress * 0.5,
      rotation: progress * Math.PI * 2,
      particleCount: Math.floor(10 * (1 - progress)),
      particleSize: 2 * (1 - progress),
      particleSpread: 10 * progress
    };
    
    // Return true when effect is complete
    return this.deathTime >= this.deathEffectDuration;
  }

  /**
   * Destroy this cell and remove it from the simulation
   */
  destroy() {
    // Clean up any resources
    this.body = null;
    
    // Clear any timeouts or intervals
    if (this._divisionResetTimeout) {
      clearTimeout(this._divisionResetTimeout);
      this._divisionResetTimeout = null;
    }
  }
}

// Export the Cell class
export default Cell;