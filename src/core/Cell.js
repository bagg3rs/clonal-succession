/**
 * Cell class - Base class for all cells in the simulation
 * Represents a single cell with lifecycle states and physical properties
 */
class Cell {
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
    this.state = 'dividing'; // States: 'dividing', 'non-dividing', 'senescent'
    this.canDivide = true;
    this.divisionCooldown = 0;
    this.isDividing = false;
    this.isNewborn = true;
    this.isStemCell = false;
    this.body = null; // Physics body reference
    
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
      case 'dividing':
        return baseColor; // Full brightness for dividing cells
      case 'non-dividing':
        return this._adjustColorBrightness(baseColor, -20); // Slightly darker
      case 'senescent':
        return this._adjustColorBrightness(baseColor, -50); // Much darker
      default:
        return baseColor;
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
    
    // Transition from dividing to non-dividing
    if (this.state === 'dividing' && this.age > this.maxAge * 0.4) {
      this.state = 'non-dividing';
      this.canDivide = false;
    } 
    // Transition from non-dividing to senescent
    else if (this.state === 'non-dividing' && this.age > this.maxAge * 0.7) {
      this.state = 'senescent';
    }
    
    // If state changed, update appearance
    if (oldState !== this.state) {
      this._updateAppearance();
      
      // Emit state change event if possible
      if (this.onStateChanged) {
        this.onStateChanged(oldState, this.state);
      }
    }
    
    // Senescent cells age faster
    if (this.state === 'senescent') {
      this.age += 3; // Age 4x faster (1 normal + 3 extra)
    }
  }
  
  /**
   * Update the cell's visual appearance based on its state
   * @private
   */
  _updateAppearance() {
    // Will be implemented by the rendering system
    // Placeholder for now
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
   * Check if the cell should become senescent based on position
   * Cells near the boundary are more likely to become senescent
   */
  checkSenescence() {
    // Skip if already senescent or not in dividing state
    if (this.state === 'senescent') return;
    
    // Skip if no body (physics not initialized)
    if (!this.body) return;
    
    // Calculate distance to boundary (assuming circular boundary)
    // This would be implemented with the actual physics system
    const distanceToBoundary = this._getDistanceToBoundary();
    
    // Boundary threshold (percentage of radius)
    const boundaryThreshold = 0.1; // 10% of radius
    
    // If close to boundary, chance to become senescent
    if (distanceToBoundary < boundaryThreshold) {
      // Probability increases as distance decreases
      const probability = 0.05 * (1 - distanceToBoundary / boundaryThreshold);
      
      if (Math.random() < probability) {
        const oldState = this.state;
        this.state = 'senescent';
        this.canDivide = false;
        
        // Update appearance
        this._updateAppearance();
        
        // Notify of state change
        if (this.onStateChanged) {
          this.onStateChanged(oldState, this.state);
        }
      }
    }
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
    if (this.state !== 'dividing') {
      return null;
    }
    
    // Check basic division conditions
    if (!this.canDivide || this.divisionCooldown > 0) {
      return null;
    }
    
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
   * Destroy this cell and remove it from the simulation
   */
  destroy() {
    // Will be implemented by the simulation system
    // Placeholder for now
  }
}

// Export the Cell class
export default Cell;