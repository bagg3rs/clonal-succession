/**
 * CellLifecycleManager class
 * Manages the lifecycle of cells including creation, division, state transitions, and death
 */
import Cell from './Cell.js';

class CellLifecycleManager {
  /**
   * Create a new cell lifecycle manager
   * @param {Object} options - Configuration options
   * @param {Function} options.onCellCreated - Callback when a cell is created
   * @param {Function} options.onCellDivided - Callback when a cell divides
   * @param {Function} options.onCellStateChanged - Callback when a cell changes state
   * @param {Function} options.onCellDied - Callback when a cell dies
   */
  constructor(options = {}) {
    this.cells = [];
    this.constraints = [];
    this.onCellCreated = options.onCellCreated || (() => {});
    this.onCellDivided = options.onCellDivided || (() => {});
    this.onCellStateChanged = options.onCellStateChanged || (() => {});
    this.onCellDied = options.onCellDied || (() => {});
    
    // Division parameters
    this.divisionProbabilityBase = 0.008;
    this.divisionProbabilityHighGrowth = 0.02;
    this.divisionMinAge = 25;
    this.maxCells = 100;
    
    // Population tracking
    this.cellCountHistory = [];
    this.stateCountHistory = {
      dividing: [],
      nonDividing: [],
      senescent: []
    };
    this.cloneCountHistory = {
      red: [],
      green: [],
      yellow: []
    };
    
    // Constraint management
    this.constraintLifetime = 60; // frames
    this.constraintRegistry = new Map(); // Map of constraint IDs to lifetimes
    
    // Cell death tracking
    this.deathCount = 0;
    this.deathsByState = {
      dividing: 0,
      nonDividing: 0,
      senescent: 0
    };
    this.deathsByClone = {
      red: 0,
      green: 0,
      yellow: 0
    };
  }
  
  /**
   * Update all cells for the current frame
   */
  updateCells() {
    // Create a copy of the array to safely handle removals during iteration
    const cellsToUpdate = [...this.cells];
    
    cellsToUpdate.forEach(cell => {
      const oldState = cell.state;
      
      // Update the cell
      cell.update();
      
      // Check if state changed
      if (cell.state !== oldState) {
        this.onCellStateChanged(cell, oldState, cell.state);
        
        // Set up state change handler on the cell if not already set
        if (!cell.onStateChanged) {
          cell.onStateChanged = (oldState, newState) => {
            this.onCellStateChanged(cell, oldState, newState);
          };
        }
      }
      
      // Check if cell should die
      if (cell.age > cell.maxAge) {
        this._handleCellDeath(cell);
      }
      
      // Check for boundary-induced senescence
      cell.checkSenescence();
      
      // Update visual appearance if needed
      if (cell._updateAppearance) {
        cell._updateAppearance();
      }
    });
    
    // Update constraints
    this._updateConstraints();
    
    // Update population tracking
    this._updatePopulationTracking();
  }
  
  /**
   * Process cell divisions for the current frame
   */
  processDivisions() {
    if (this.cells.length >= this.maxCells) return;
    
    const newCells = [];
    
    this.cells.forEach(cell => {
      // Skip if cell is a stem cell (handled separately)
      if (cell.isStemCell) return;
      
      // Determine division probability based on population size and cell state
      let divisionProbability = this._calculateDivisionProbability(cell);
      
      // Attempt division with probability
      if (Math.random() < divisionProbability && cell.age > this.divisionMinAge && cell.canDivide) {
        const childCell = this._divideCell(cell);
        if (childCell) {
          newCells.push(childCell);
          
          // If this is a stem cell division, record it
          if (cell.isStemCell) {
            cell.recordDivision();
          }
        }
      }
    });
    
    // Add all new cells to the simulation
    newCells.forEach(cell => this.addCell(cell));
  }
  
  /**
   * Calculate division probability for a cell based on various factors
   * @param {Cell} cell - The cell to calculate division probability for
   * @returns {number} - Division probability (0-1)
   * @private
   */
  _calculateDivisionProbability(cell) {
    // Base probability depends on population size
    let probability = this.divisionProbabilityBase;
    
    // Higher probability for small populations to encourage growth
    if (this.cells.length < 10) {
      probability = this.divisionProbabilityHighGrowth;
    } 
    // Gradually reduce probability as we approach max cells
    else if (this.cells.length > this.maxCells * 0.8) {
      const ratio = (this.maxCells - this.cells.length) / (this.maxCells * 0.2);
      probability *= Math.max(0.1, ratio);
    }
    
    // Adjust based on cell state
    if (cell.state !== Cell.States.DIVIDING) {
      probability = 0; // Non-dividing cells can't divide
    }
    
    // Adjust based on cell age (younger cells divide less frequently)
    if (cell.age < this.divisionMinAge * 2) {
      probability *= 0.5;
    }
    
    // Stem cells have different division mechanics
    if (cell.isStemCell) {
      probability *= 0.5; // Stem cells divide less frequently
    }
    
    return probability;
  }
  
  /**
   * Divide a cell to create a new child cell
   * @param {Cell} parentCell - The parent cell to divide
   * @returns {Cell|null} - The new child cell, or null if division failed
   * @private
   */
  _divideCell(parentCell) {
    // Check if cell can divide
    if (!parentCell.canDivide || parentCell.state !== Cell.States.DIVIDING) {
      return null;
    }
    
    // Set division cooldown on parent
    parentCell.divisionCooldown = 60; // 1 second at 60fps
    parentCell.canDivide = false;
    parentCell.isDividing = true;
    
    // Increment division count on parent
    parentCell.divisionCount = (parentCell.divisionCount || 0) + 1;
    
    // Calculate position for new cell (slightly offset from parent)
    const angle = Math.random() * Math.PI * 2;
    const distance = 5; // Small distance to prevent overlap
    const childX = parentCell.body ? parentCell.body.position.x + Math.cos(angle) * distance : 0;
    const childY = parentCell.body ? parentCell.body.position.y + Math.sin(angle) * distance : 0;
    
    // Create new cell of same type
    let childCell;
    if (parentCell.isStemCell) {
      // Create regular cell from stem cell
      const CellClass = parentCell.constructor.prototype.constructor;
      childCell = new CellClass(childX, childY, parentCell.clone, parentCell.population);
      childCell.isStemCell = false; // Ensure it's not a stem cell
      
      // Inherit properties from stem cell parent
      childCell.divisionsLeft = Math.max(0, parentCell.divisionsLeft - 5); // Fewer divisions for cells from stem cells
      
      // Inherit some genetic properties (like resistance to senescence)
      childCell.senescenceThreshold = parentCell.senescenceThreshold;
      childCell.divisionThreshold = parentCell.divisionThreshold;
    } else {
      // Create regular cell from regular cell
      const CellClass = parentCell.constructor;
      childCell = new CellClass(childX, childY, parentCell.clone, parentCell.population);
      
      // Inherit properties from parent
      childCell.divisionsLeft = Math.max(0, parentCell.divisionsLeft - 1);
      
      // Inherit state transition thresholds with slight variation
      childCell.senescenceThreshold = parentCell.senescenceThreshold * (0.95 + Math.random() * 0.1); // ±5% variation
      childCell.divisionThreshold = parentCell.divisionThreshold * (0.95 + Math.random() * 0.1); // ±5% variation
      
      // Inherit max age with slight variation
      childCell.maxAge = parentCell.maxAge * (0.9 + Math.random() * 0.2); // ±10% variation
    }
    
    // Create division visual effects
    this._createDivisionVisualEffects(parentCell, childCell);
    
    // Create temporary constraint between parent and child
    this._createDivisionConstraint(parentCell, childCell);
    
    // Notify of division
    this.onCellDivided(parentCell, childCell);
    
    // Reset division flag after short delay
    parentCell._divisionResetTimeout = setTimeout(() => {
      parentCell.isDividing = false;
      parentCell.canDivide = true;
    }, 500);
    
    return childCell;
  }
  
  /**
   * Create visual effects for cell division
   * @param {Cell} parentCell - The parent cell
   * @param {Cell} childCell - The newly created child cell
   * @private
   */
  _createDivisionVisualEffects(parentCell, childCell) {
    // Set division visual effect properties on both cells
    parentCell.divisionEffectTime = 0;
    parentCell.divisionEffectDuration = 20; // 0.33 seconds at 60fps
    parentCell.divisionPartner = childCell;
    
    childCell.divisionEffectTime = 0;
    childCell.divisionEffectDuration = 20;
    childCell.divisionPartner = parentCell;
    childCell.isNewborn = true;
    
    // Create division effect properties for renderer
    const divisionEffectProps = {
      active: true,
      duration: 20,
      connectionOpacity: 1.0,
      glowIntensity: 1.0,
      pulseSize: 1.0
    };
    
    parentCell.divisionEffectProperties = { ...divisionEffectProps };
    childCell.divisionEffectProperties = { ...divisionEffectProps };
  }
  
  /**
   * Create a temporary constraint between parent and child cells during division
   * @param {Cell} parentCell - The parent cell
   * @param {Cell} childCell - The newly created child cell
   * @private
   */
  _createDivisionConstraint(parentCell, childCell) {
    // Create a unique ID for this constraint
    const constraintId = `${parentCell.id}_${childCell.id}`;
    
    // Register the constraint with its lifetime
    this.constraintRegistry.set(constraintId, this.constraintLifetime);
    
    // Store the constraint (actual physics constraint would be created here)
    const constraint = {
      id: constraintId,
      parentCell: parentCell,
      childCell: childCell,
      // Physics constraint properties would be added here
    };
    
    this.constraints.push(constraint);
  }
  
  /**
   * Update constraints, removing expired ones
   * @private
   */
  _updateConstraints() {
    // Update constraint lifetimes
    for (const [id, lifetime] of this.constraintRegistry.entries()) {
      const newLifetime = lifetime - 1;
      
      if (newLifetime <= 0) {
        // Remove expired constraint
        this.constraintRegistry.delete(id);
        const index = this.constraints.findIndex(c => c.id === id);
        if (index !== -1) {
          // Remove the physics constraint (would be implemented here)
          this.constraints.splice(index, 1);
        }
      } else {
        // Update lifetime
        this.constraintRegistry.set(id, newLifetime);
      }
    }
  }
  
  /**
   * Handle cell death process
   * @param {Cell} cell - The cell that is dying
   * @param {string} cause - Cause of death (default: 'age')
   * @private
   */
  _handleCellDeath(cell, cause = 'age') {
    // Skip if cell is already dying
    if (cell.isDying) return;
    
    // Prepare cell for death with visual effects
    const deathEvent = cell.prepareForDeath(cause);
    
    // Track death statistics
    this.deathCount++;
    
    // Track deaths by state
    if (cell.state === Cell.States.DIVIDING) {
      this.deathsByState.dividing++;
    } else if (cell.state === Cell.States.NON_DIVIDING) {
      this.deathsByState.nonDividing++;
    } else if (cell.state === Cell.States.SENESCENT) {
      this.deathsByState.senescent++;
    }
    
    // Track deaths by clone
    if (this.deathsByClone[cell.clone] !== undefined) {
      this.deathsByClone[cell.clone]++;
    }
    
    // Add death event to history
    if (!this.deathEvents) {
      this.deathEvents = [];
    }
    this.deathEvents.push(deathEvent);
    
    // Keep death events history at a reasonable size
    if (this.deathEvents.length > 100) {
      this.deathEvents.shift();
    }
    
    // Schedule cell removal after death animation completes
    setTimeout(() => {
      this.removeCell(cell);
    }, 500); // 0.5 seconds for death animation
    
    // Emit death signals to nearby cells
    this._emitDeathSignals(cell, cause);
    
    // Notify of cell death with cause
    this.onCellDied(cell, cause);
  }
  
  /**
   * Emit death signals to nearby cells
   * @param {Cell} dyingCell - The cell that is dying
   * @param {string} cause - Cause of death
   * @private
   */
  _emitDeathSignals(dyingCell, cause) {
    // Skip if no body (physics not initialized)
    if (!dyingCell.body) return;
    
    const position = dyingCell.body.position;
    const signalRadius = 30; // Radius for death signal
    
    // Find cells within signal radius
    const nearbyCells = this.cells.filter(cell => {
      if (!cell.body || cell === dyingCell) return false;
      
      const dx = cell.body.position.x - position.x;
      const dy = cell.body.position.y - position.y;
      const distanceSquared = dx * dx + dy * dy;
      
      return distanceSquared < signalRadius * signalRadius;
    });
    
    // Apply effects based on death cause
    nearbyCells.forEach(cell => {
      // Different effects based on cause of death
      switch (cause) {
        case 'age':
          // Age death has minimal effect on neighbors
          break;
          
        case 'boundary':
          // Boundary deaths increase chance of senescence in neighbors
          if (Math.random() < 0.2 && cell.state === Cell.States.DIVIDING) {
            cell.transitionState(Cell.States.NON_DIVIDING);
          }
          break;
          
        case 'resource':
          // Resource competition deaths affect division probability
          cell.divisionCooldown = Math.max(cell.divisionCooldown, 30);
          break;
      }
      
      // Visual effect on nearby cells
      cell.nearbyDeathEffect = {
        active: true,
        time: 0,
        duration: 15,
        intensity: 0.5,
        source: position
      };
    });
  }
  
  /**
   * Update population tracking statistics
   * @private
   */
  _updatePopulationTracking() {
    // Track total cell count
    this.cellCountHistory.push(this.cells.length);
    if (this.cellCountHistory.length > 100) {
      this.cellCountHistory.shift();
    }
    
    // Track cells by state
    const stateCounts = {
      dividing: this.cells.filter(cell => cell.state === Cell.States.DIVIDING).length,
      nonDividing: this.cells.filter(cell => cell.state === Cell.States.NON_DIVIDING).length,
      senescent: this.cells.filter(cell => cell.state === Cell.States.SENESCENT).length
    };
    
    Object.keys(stateCounts).forEach(state => {
      this.stateCountHistory[state].push(stateCounts[state]);
      if (this.stateCountHistory[state].length > 100) {
        this.stateCountHistory[state].shift();
      }
    });
    
    // Track cells by clone
    const cloneCounts = {
      red: this.cells.filter(cell => cell.clone === 'red').length,
      green: this.cells.filter(cell => cell.clone === 'green').length,
      yellow: this.cells.filter(cell => cell.clone === 'yellow').length
    };
    
    Object.keys(cloneCounts).forEach(clone => {
      this.cloneCountHistory[clone].push(cloneCounts[clone]);
      if (this.cloneCountHistory[clone].length > 100) {
        this.cloneCountHistory[clone].shift();
      }
    });
  }
  
  /**
   * Add a cell to the simulation
   * @param {Cell} cell - The cell to add
   */
  addCell(cell) {
    this.cells.push(cell);
    
    // Set up state change handler on the cell
    cell.onStateChanged = (oldState, newState) => {
      this.onCellStateChanged(cell, oldState, newState);
    };
    
    this.onCellCreated(cell);
  }
  
  /**
   * Remove a cell from the simulation
   * @param {Cell} cell - The cell to remove
   */
  removeCell(cell) {
    const index = this.cells.indexOf(cell);
    if (index !== -1) {
      this.cells.splice(index, 1);
      
      // Remove any constraints involving this cell
      this._removeConstraintsForCell(cell);
      
      // Destroy the cell
      cell.destroy();
      
      // Notify of cell death
      this.onCellDied(cell);
    }
  }
  
  /**
   * Remove all constraints involving a specific cell
   * @param {Cell} cell - The cell to remove constraints for
   * @private
   */
  _removeConstraintsForCell(cell) {
    // Find constraints involving this cell
    const constraintsToRemove = this.constraints.filter(
      c => c.parentCell === cell || c.childCell === cell
    );
    
    // Remove each constraint
    constraintsToRemove.forEach(constraint => {
      const index = this.constraints.indexOf(constraint);
      if (index !== -1) {
        // Remove from registry
        this.constraintRegistry.delete(constraint.id);
        
        // Remove from array
        this.constraints.splice(index, 1);
        
        // Remove the physics constraint (would be implemented here)
      }
    });
  }
  
  /**
   * Get the current cell count
   * @returns {number} - Number of cells in the simulation
   */
  getCellCount() {
    return this.cells.length;
  }
  
  /**
   * Get cells by state
   * @param {string} state - Cell state to filter by ('dividing', 'non-dividing', 'senescent')
   * @returns {Array} - Array of cells in the specified state
   */
  getCellsByState(state) {
    return this.cells.filter(cell => cell.state === state);
  }
  
  /**
   * Get cells by clone
   * @param {string} clone - Clone identifier to filter by
   * @returns {Array} - Array of cells in the specified clone
   */
  getCellsByClone(clone) {
    return this.cells.filter(cell => cell.clone === clone);
  }
  
  /**
   * Get stem cells
   * @returns {Array} - Array of stem cells
   */
  getStemCells() {
    return this.cells.filter(cell => cell.isStemCell);
  }
  
  /**
   * Get cell count history
   * @returns {Array} - Array of cell counts over time
   */
  getCellCountHistory() {
    return this.cellCountHistory;
  }
  
  /**
   * Get state count history
   * @returns {Object} - Object with arrays of state counts over time
   */
  getStateCountHistory() {
    return this.stateCountHistory;
  }
  
  /**
   * Get clone count history
   * @returns {Object} - Object with arrays of clone counts over time
   */
  getCloneCountHistory() {
    return this.cloneCountHistory;
  }
  
  /**
   * Get death statistics
   * @returns {Object} - Object with death statistics
   */
  getDeathStatistics() {
    return {
      total: this.deathCount,
      byState: { ...this.deathsByState },
      byClone: { ...this.deathsByClone }
    };
  }
  
  /**
   * Clear all cells from the simulation
   */
  clear() {
    // Create a copy of the array to safely handle removals during iteration
    const cellsToRemove = [...this.cells];
    
    cellsToRemove.forEach(cell => {
      this.removeCell(cell);
    });
    
    this.cells = [];
    this.constraints = [];
    this.constraintRegistry.clear();
    
    // Reset tracking data
    this.deathCount = 0;
    this.deathsByState = {
      dividing: 0,
      nonDividing: 0,
      senescent: 0
    };
    this.deathsByClone = {
      red: 0,
      green: 0,
      yellow: 0
    };
  }
  
  /**
   * Set the maximum number of cells
   * @param {number} maxCells - New maximum cell count
   */
  setMaxCells(maxCells) {
    this.maxCells = Math.max(10, maxCells);
  }
}

// Export the CellLifecycleManager class
export default CellLifecycleManager;