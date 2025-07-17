/**
 * StemCellManager class
 * Manages stem cell activation, suppression, and clonal succession
 */
import StemCell from './StemCell.js';

class StemCellManager {
  /**
   * Create a new stem cell manager
   * @param {Object} options - Configuration options
   * @param {Function} options.onStemCellActivated - Callback when a stem cell is activated
   * @param {Function} options.onStemCellDeactivated - Callback when a stem cell is deactivated
   * @param {Function} options.onSuccessionEvent - Callback when a succession event occurs
   */
  constructor(options = {}) {
    this.stemCells = {
      red: { cells: [], divisionsLeft: 25, active: true },
      green: { cells: [], divisionsLeft: 25, active: false },
      yellow: { cells: [], divisionsLeft: 25, active: false }
    };
    
    this.activeClone = 'red';
    this.suppressionLevel = 1.0; // Full suppression initially
    this.activationThreshold = 0.3; // Default activation threshold
    this.successionTimer = 0;
    this.dyingCellSignalCount = 0;
    this.dyingCellSignalThreshold = 10;
    this.successionCooldown = 0; // Cooldown period after succession
    this.successionHistory = []; // Track succession events
    
    // Population tracking
    this.populationHistory = {
      red: [],
      green: [],
      yellow: []
    };
    
    // Event callbacks
    this.onStemCellActivated = options.onStemCellActivated || (() => {});
    this.onStemCellDeactivated = options.onStemCellDeactivated || (() => {});
    this.onSuccessionEvent = options.onSuccessionEvent || (() => {});
    
    // Create stem cell creation callback
    this.createStemCellCallback = options.createStemCellCallback || null;
  }
  
  /**
   * Register a stem cell with the manager
   * @param {StemCell} stemCell - The stem cell to register
   */
  registerStemCell(stemCell) {
    const clone = stemCell.clone;
    
    if (this.stemCells[clone]) {
      this.stemCells[clone].cells.push(stemCell);
      
      // Set up event handlers for the stem cell
      stemCell.onActivated = (cell) => this.onStemCellActivated(cell);
      stemCell.onDeactivated = (cell) => this.onStemCellDeactivated(cell);
      
      // If this is the active clone, activate the stem cell
      if (clone === this.activeClone) {
        stemCell.activate();
      }
    }
  }
  
  /**
   * Unregister a stem cell from the manager
   * @param {StemCell} stemCell - The stem cell to unregister
   */
  unregisterStemCell(stemCell) {
    const clone = stemCell.clone;
    
    if (this.stemCells[clone]) {
      const index = this.stemCells[clone].cells.indexOf(stemCell);
      if (index !== -1) {
        this.stemCells[clone].cells.splice(index, 1);
      }
    }
  }
  
  /**
   * Update the suppression signal based on active cell population
   * @param {Array} cells - All cells in the simulation
   * @param {number} maxCells - Maximum cell count for the simulation
   */
  updateSuppressionSignal(cells, maxCells) {
    // Count cells by clone
    const cloneCounts = this._countCellsByClone(cells);
    
    // Update population history
    this._updatePopulationHistory(cloneCounts);
    
    // Calculate active clone population ratio
    const activeCloneCount = cloneCounts[this.activeClone];
    const totalCells = cells.length;
    const populationRatio = totalCells > 0 ? activeCloneCount / totalCells : 0;
    
    // Calculate suppression level based on population health
    this._calculateSuppressionLevel(totalCells, activeCloneCount, populationRatio, maxCells);
    
    // Apply suppression to dormant stem cells
    this._applySuppression();
    
    // Update succession cooldown
    if (this.successionCooldown > 0) {
      this.successionCooldown--;
    }
  }
  
  /**
   * Count cells by clone
   * @param {Array} cells - All cells in the simulation
   * @returns {Object} - Object with counts for each clone
   * @private
   */
  _countCellsByClone(cells) {
    const cloneCounts = {
      red: 0,
      green: 0,
      yellow: 0
    };
    
    cells.forEach(cell => {
      if (cloneCounts[cell.clone] !== undefined) {
        cloneCounts[cell.clone]++;
      }
    });
    
    return cloneCounts;
  }
  
  /**
   * Update population history for each clone
   * @param {Object} cloneCounts - Current counts for each clone
   * @private
   */
  _updatePopulationHistory(cloneCounts) {
    // Keep history at a reasonable size
    const maxHistoryLength = 100;
    
    Object.keys(this.populationHistory).forEach(clone => {
      this.populationHistory[clone].push(cloneCounts[clone]);
      
      if (this.populationHistory[clone].length > maxHistoryLength) {
        this.populationHistory[clone].shift();
      }
    });
  }
  
  /**
   * Calculate suppression level based on population metrics
   * @param {number} totalCells - Total cell count
   * @param {number} activeCloneCount - Count of cells in active clone
   * @param {number} populationRatio - Ratio of active clone to total population
   * @param {number} maxCells - Maximum cell count for the simulation
   * @private
   */
  _calculateSuppressionLevel(totalCells, activeCloneCount, populationRatio, maxCells) {
    // Check population trends
    const isPopulationNearMax = totalCells >= maxCells * 0.9;
    const isActiveCloneDeclining = this._isCloneDeclining(this.activeClone);
    const isActiveCloneSmall = activeCloneCount < maxCells * 0.3;
    const isActiveCloneDominant = populationRatio > 0.8 && activeCloneCount > maxCells * 0.5;
    
    if (isPopulationNearMax) {
      // Near max capacity, maintain high suppression
      this.suppressionLevel = Math.min(1.0, this.suppressionLevel + 0.05);
    } else if (isActiveCloneDeclining && isActiveCloneSmall) {
      // Active clone is declining and small - rapidly reduce suppression
      this.suppressionLevel = Math.max(0.1, this.suppressionLevel - 0.08);
    } else if (isActiveCloneDeclining) {
      // Active clone is declining but still significant - moderately reduce suppression
      this.suppressionLevel = Math.max(0.1, this.suppressionLevel - 0.05);
    } else if (isActiveCloneDominant) {
      // Active clone is dominant and healthy - increase suppression
      this.suppressionLevel = Math.min(1.0, this.suppressionLevel + 0.03);
    } else {
      // Gradual reduction in suppression over time
      this.suppressionLevel = Math.max(0.1, this.suppressionLevel - 0.01);
    }
  }
  
  /**
   * Check if a clone's population is declining
   * @param {string} clone - Clone identifier
   * @returns {boolean} - Whether the clone is declining
   * @private
   */
  _isCloneDeclining(clone) {
    const history = this.populationHistory[clone];
    if (history.length < 10) return false;
    
    // Compare current to average of last 5-10 entries
    const current = history[history.length - 1];
    const recent = history.slice(-10, -5);
    const recentAvg = recent.reduce((sum, count) => sum + count, 0) / recent.length;
    
    return current < recentAvg * 0.8; // 20% decline indicates trend
  }
  
  /**
   * Apply suppression to all dormant stem cells
   * @private
   */
  _applySuppression() {
    Object.keys(this.stemCells).forEach(clone => {
      if (clone !== this.activeClone) {
        this.stemCells[clone].cells.forEach(stemCell => {
          stemCell.suppress(this.suppressionLevel);
        });
      }
    });
  }
  
  /**
   * Check if conditions are right for a new stem cell activation
   * @param {Array} cells - All cells in the simulation
   * @param {number} maxCells - Maximum cell count for the simulation
   * @returns {boolean} - Whether a succession event occurred
   */
  checkActivationConditions(cells, maxCells) {
    // Don't check during cooldown period
    if (this.successionCooldown > 0) {
      return false;
    }
    
    // Count cells by state
    const senescentCells = cells.filter(cell => cell.state === 'senescent');
    const totalCells = cells.length;
    const cloneCounts = this._countCellsByClone(cells);
    const activeCloneCount = cloneCounts[this.activeClone];
    
    // Check for emergency activation (population crash)
    const isPopulationCrash = totalCells < maxCells * 0.3;
    
    // Check if we have enough dying cell signals to trigger a new cycle
    const hasSufficientDyingSignals = this.dyingCellSignalCount >= this.dyingCellSignalThreshold;
    
    // Check if population is declining significantly
    const isHighSenescence = senescentCells.length > totalCells * 0.6;
    const isPopulationDeclining = totalCells < maxCells * 0.7 && activeCloneCount < maxCells * 0.4;
    
    // Check if suppression is low enough for activation
    const isSuppressionLow = this.suppressionLevel < this.activationThreshold;
    
    // Determine if succession should occur
    let shouldSucceed = false;
    let trigger = '';
    
    if (isPopulationCrash) {
      shouldSucceed = true;
      trigger = 'population_crash';
    } else if (hasSufficientDyingSignals) {
      shouldSucceed = true;
      trigger = 'dying_cell_signals';
    } else if (isHighSenescence && isPopulationDeclining && isSuppressionLow) {
      this.successionTimer++;
      
      // Wait a bit before succession to show decline
      if (this.successionTimer > 60) { // 1 second at 60fps
        shouldSucceed = true;
        trigger = 'population_decline';
      }
    } else {
      this.successionTimer = 0;
    }
    
    // Trigger succession if conditions are met
    if (shouldSucceed) {
      this._triggerSuccession(cells, maxCells, trigger);
      return true;
    }
    
    return false;
  }
  
  /**
   * Trigger a succession event, activating a new stem cell
   * @param {Array} cells - All cells in the simulation
   * @param {number} maxCells - Maximum cell count for the simulation
   * @param {string} trigger - What triggered the succession
   * @private
   */
  _triggerSuccession(cells, maxCells, trigger) {
    // Reset counters
    this.dyingCellSignalCount = 0;
    this.successionTimer = 0;
    this.successionCooldown = 120; // 2 seconds at 60fps
    
    // Get current population before succession
    const populationBefore = cells.length;
    const cloneCountsBefore = this._countCellsByClone(cells);
    
    // Determine which clone should be activated next
    const oldClone = this.activeClone;
    const nextClone = this._selectNextClone();
    
    // Deactivate current stem cells
    this.stemCells[oldClone].cells.forEach(stemCell => {
      stemCell.deactivate();
    });
    
    // Update active clone
    this.activeClone = nextClone;
    
    // Reset divisions for the new active clone
    this.stemCells[this.activeClone].divisionsLeft = 25;
    
    // Activate stem cells of the new clone
    this.stemCells[this.activeClone].cells.forEach(stemCell => {
      stemCell.activate();
    });
    
    // If no stem cells exist for this clone, create one
    if (this.stemCells[this.activeClone].cells.length === 0) {
      this._createNewStemCell();
    }
    
    // Record succession event
    const successionEvent = {
      time: Date.now(),
      oldClone: oldClone,
      newClone: nextClone,
      populationBefore: populationBefore,
      cloneCountsBefore: { ...cloneCountsBefore },
      trigger: trigger
    };
    
    this.successionHistory.push(successionEvent);
    
    // Keep history at a reasonable size
    if (this.successionHistory.length > 20) {
      this.successionHistory.shift();
    }
    
    // Notify about succession event
    this.onSuccessionEvent(successionEvent);
  }
  
  /**
   * Select the next clone to activate
   * @returns {string} - The next clone identifier
   * @private
   */
  _selectNextClone() {
    // Cycle through red, green, yellow
    const clones = ['red', 'green', 'yellow'];
    const currentIndex = clones.indexOf(this.activeClone);
    const nextIndex = (currentIndex + 1) % clones.length;
    return clones[nextIndex];
  }
  
  /**
   * Create a new stem cell for the active clone
   * @private
   */
  _createNewStemCell() {
    // Use callback if provided
    if (this.createStemCellCallback) {
      this.createStemCellCallback(this.activeClone);
    }
  }
  
  /**
   * Record a dying cell signal
   * Accumulates signals that can trigger succession
   */
  recordDyingCellSignal() {
    this.dyingCellSignalCount++;
  }
  
  /**
   * Set the activation threshold for stem cells
   * @param {number} value - New activation threshold (0-1)
   */
  setActivationThreshold(value) {
    this.activationThreshold = Math.max(0, Math.min(1, value));
    
    // Update all stem cells with the new threshold
    Object.keys(this.stemCells).forEach(clone => {
      this.stemCells[clone].cells.forEach(stemCell => {
        stemCell.activationThreshold = this.activationThreshold;
      });
    });
  }
  
  /**
   * Get the current suppression level
   * @returns {number} - Current suppression level (0-1)
   */
  getSuppressionLevel() {
    return this.suppressionLevel;
  }
  
  /**
   * Get the active clone identifier
   * @returns {string} - Active clone identifier
   */
  getActiveClone() {
    return this.activeClone;
  }
  
  /**
   * Get population history for all clones
   * @returns {Object} - Population history by clone
   */
  getPopulationHistory() {
    return this.populationHistory;
  }
  
  /**
   * Get succession event history
   * @returns {Array} - Array of succession events
   */
  getSuccessionHistory() {
    return this.successionHistory;
  }
  
  /**
   * Set the stem cell creation callback
   * @param {Function} callback - Function to call when a new stem cell needs to be created
   */
  setCreateStemCellCallback(callback) {
    this.createStemCellCallback = callback;
  }
}

// Export the StemCellManager class
export default StemCellManager;