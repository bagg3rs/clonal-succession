/**
 * StemCellManager class
 * Manages stem cell activation, suppression, and clonal succession
 */
import StemCell from './StemCell.js';
import Cell from './Cell.js';
import EventEmitter from '../utils/EventEmitter.js';

class StemCellManager extends EventEmitter {
  /**
   * Create a new stem cell manager
   * @param {Object} options - Configuration options
   * @param {Function} options.onStemCellActivated - Callback when a stem cell is activated
   * @param {Function} options.onStemCellDeactivated - Callback when a stem cell is deactivated
   * @param {Function} options.onSuccessionEvent - Callback when a succession event occurs
   */
  constructor(options = {}) {
    super();
    
    this.stemCells = {
      red: { cells: [], divisionsLeft: 25, active: true },
      green: { cells: [], divisionsLeft: 25, active: false },
      yellow: { cells: [], divisionsLeft: 25, active: false }
    };
    
    this.activeClone = 'red';
    this.suppressionLevel = 1.0; // Full suppression initially
    this.activationThreshold = 0.3; // Default activation threshold
    this.suppressionStrengthMultiplier = 1.0; // Configurable suppression strength
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
    
    // Stem cell activation metrics
    this.activationMetrics = {
      lastActivationTime: 0,
      activationCount: 0,
      averageActivationInterval: 0,
      activationTriggers: {}
    };
    
    // Event callbacks
    this.onStemCellActivated = options.onStemCellActivated || ((stemCell) => {
      this.emit('stemCellActivated', stemCell);
    });
    
    this.onStemCellDeactivated = options.onStemCellDeactivated || ((stemCell) => {
      this.emit('stemCellDeactivated', stemCell);
    });
    
    this.onSuccessionEvent = options.onSuccessionEvent || ((details) => {
      this.emit('successionEvent', details);
    });
    
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
    
    // Calculate base suppression level
    let baseSuppression = 0;
    
    if (isPopulationNearMax) {
      // Near max capacity, maintain high suppression
      baseSuppression = Math.min(1.0, this.suppressionLevel + 0.05);
    } else if (isActiveCloneDeclining && isActiveCloneSmall) {
      // Active clone is declining and small - rapidly reduce suppression
      baseSuppression = Math.max(0.1, this.suppressionLevel - 0.08);
    } else if (isActiveCloneDeclining) {
      // Active clone is declining but still significant - moderately reduce suppression
      baseSuppression = Math.max(0.1, this.suppressionLevel - 0.05);
    } else if (isActiveCloneDominant) {
      // Active clone is dominant and healthy - increase suppression
      baseSuppression = Math.min(1.0, this.suppressionLevel + 0.03);
    } else {
      // Gradual reduction in suppression over time
      baseSuppression = Math.max(0.1, this.suppressionLevel - 0.01);
    }
    
    // Calculate senescence factor - higher senescence reduces suppression
    const senescentRatio = this._calculateSenescentRatio(this.activeClone);
    const senescenceFactor = Math.max(0, 1 - senescentRatio * 2); // Reduce suppression as senescence increases
    
    // Calculate active stem cell health factor
    const stemCellHealthFactor = this._calculateStemCellHealthFactor(this.activeClone);
    
    // Apply modifiers to base suppression
    let finalSuppression = baseSuppression * senescenceFactor * stemCellHealthFactor;
    
    // Apply global suppression strength multiplier
    finalSuppression *= this.suppressionStrengthMultiplier;
    
    // Ensure suppression stays within valid range
    this.suppressionLevel = Math.max(0.1, Math.min(1.0, finalSuppression));
    
    // Emit suppression level change event
    this.emit('suppressionLevelChanged', this.suppressionLevel);
  }
  
  /**
   * Calculate the ratio of senescent cells to total cells for a clone
   * @param {string} clone - Clone identifier
   * @returns {number} - Ratio of senescent cells (0-1)
   * @private
   */
  _calculateSenescentRatio(clone) {
    // This would ideally use actual cell state data from CellLifecycleManager
    // For now, estimate based on population trends
    const history = this.populationHistory[clone];
    if (history.length < 5) return 0;
    
    const current = history[history.length - 1];
    const peak = Math.max(...history.slice(-20));
    
    // If current population is significantly below peak, assume high senescence
    if (peak > 0 && current < peak * 0.7) {
      return Math.min(1.0, (peak - current) / peak);
    }
    
    return 0;
  }
  
  /**
   * Calculate health factor of active stem cells for a clone
   * @param {string} clone - Clone identifier
   * @returns {number} - Health factor (0-1)
   * @private
   */
  _calculateStemCellHealthFactor(clone) {
    const stemCells = this.stemCells[clone].cells;
    if (stemCells.length === 0) return 0.5; // Neutral if no stem cells
    
    // Calculate average divisions left as percentage of max divisions
    let totalDivisionsLeft = 0;
    let totalMaxDivisions = 0;
    
    stemCells.forEach(cell => {
      if (cell.isActive) {
        totalDivisionsLeft += cell.getDivisionsLeft();
        totalMaxDivisions += cell.maxDivisions;
      }
    });
    
    if (totalMaxDivisions === 0) return 0.5; // Neutral if no active stem cells
    
    // Higher health = higher suppression
    return 0.5 + 0.5 * (totalDivisionsLeft / totalMaxDivisions);
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
      this.successionCooldown--;
      return false;
    }
    
    // Count cells by state and clone
    const senescentCells = cells.filter(cell => cell.state === Cell.States.SENESCENT);
    const totalCells = cells.length;
    const cloneCounts = this._countCellsByClone(cells);
    const activeCloneCount = cloneCounts[this.activeClone];
    
    // Get state counts for active clone
    const activeCloneStateCount = this._countCellStatesByClone(cells, this.activeClone);
    
    // Calculate population metrics
    const populationRatio = totalCells / maxCells;
    const activeCloneRatio = activeCloneCount / totalCells;
    const senescentRatio = senescentCells.length / totalCells;
    const activeCloneSenescentRatio = activeCloneStateCount.senescent / activeCloneCount;
    
    // Check for emergency activation (population crash)
    const isPopulationCrash = totalCells < maxCells * 0.3;
    
    // Check if we have enough dying cell signals to trigger a new cycle
    const hasSufficientDyingSignals = this.dyingCellSignalCount >= this.dyingCellSignalThreshold;
    
    // Check if population is declining significantly
    const isHighSenescence = senescentRatio > 0.6;
    const isActiveCloneHighSenescence = activeCloneSenescentRatio > 0.5;
    const isPopulationDeclining = this._isCloneDeclining(this.activeClone);
    const isActiveCloneSmall = activeCloneCount < maxCells * 0.4;
    
    // Check if active stem cells are depleted
    const activeStemCells = this.stemCells[this.activeClone].cells.filter(cell => cell.isActive);
    const areActiveStemCellsDepleted = activeStemCells.every(cell => 
      cell.stemCellState === StemCell.States.DEPLETED || 
      cell.getDivisionsLeft() < 5
    );
    
    // Check if suppression is low enough for activation
    const isSuppressionLow = this.suppressionLevel < this.activationThreshold;
    
    // Check if there are dormant stem cells ready to activate
    const hasDormantStemCellsReady = this._hasDormantStemCellsReadyToActivate();
    
    // Determine if succession should occur and the trigger reason
    let shouldSucceed = false;
    let trigger = '';
    let urgency = 0; // 0-10 scale, higher means more urgent
    
    // Check different succession triggers with different urgency levels
    if (isPopulationCrash) {
      shouldSucceed = true;
      trigger = 'population_crash';
      urgency = 10; // Highest urgency
    } else if (areActiveStemCellsDepleted && isSuppressionLow) {
      shouldSucceed = true;
      trigger = 'stem_cell_depletion';
      urgency = 9;
    } else if (hasSufficientDyingSignals && isSuppressionLow) {
      shouldSucceed = true;
      trigger = 'dying_cell_signals';
      urgency = 8;
    } else if (isActiveCloneHighSenescence && isPopulationDeclining && isSuppressionLow) {
      shouldSucceed = true;
      trigger = 'high_senescence';
      urgency = 7;
    } else if (isPopulationDeclining && isActiveCloneSmall && isSuppressionLow) {
      // Increment succession timer for declining population
      this.successionTimer++;
      
      // Wait a bit before succession to show decline
      if (this.successionTimer > 60) { // 1 second at 60fps
        shouldSucceed = true;
        trigger = 'population_decline';
        urgency = 6;
      }
    } else if (isSuppressionLow && hasDormantStemCellsReady && this.successionTimer > 120) {
      // Allow succession after a long period of low suppression
      shouldSucceed = true;
      trigger = 'natural_succession';
      urgency = 5;
    } else {
      // Increment timer but at a slower rate when no urgent conditions are met
      this.successionTimer += 0.2;
    }
    
    // Log potential succession conditions for debugging
    this._logSuccessionConditions({
      time: Date.now(),
      totalCells,
      maxCells,
      activeCloneCount,
      senescentRatio,
      activeCloneSenescentRatio,
      isPopulationDeclining,
      isSuppressionLow,
      suppressionLevel: this.suppressionLevel,
      activationThreshold: this.activationThreshold,
      dyingCellSignalCount: this.dyingCellSignalCount,
      dyingCellSignalThreshold: this.dyingCellSignalThreshold,
      successionTimer: this.successionTimer,
      shouldSucceed,
      trigger,
      urgency
    });
    
    // Trigger succession if conditions are met
    if (shouldSucceed) {
      this._triggerSuccession(cells, maxCells, trigger, urgency);
      return true;
    }
    
    return false;
  }
  
  /**
   * Count cells by state for a specific clone
   * @param {Array} cells - All cells in the simulation
   * @param {string} clone - Clone identifier
   * @returns {Object} - Object with counts for each state
   * @private
   */
  _countCellStatesByClone(cells, clone) {
    const stateCounts = {
      dividing: 0,
      nonDividing: 0,
      senescent: 0
    };
    
    cells.forEach(cell => {
      if (cell.clone === clone) {
        if (cell.state === Cell.States.DIVIDING) {
          stateCounts.dividing++;
        } else if (cell.state === Cell.States.NON_DIVIDING) {
          stateCounts.nonDividing++;
        } else if (cell.state === Cell.States.SENESCENT) {
          stateCounts.senescent++;
        }
      }
    });
    
    return stateCounts;
  }
  
  /**
   * Check if there are dormant stem cells ready to activate
   * @returns {boolean} - Whether there are dormant stem cells ready to activate
   * @private
   */
  _hasDormantStemCellsReadyToActivate() {
    // Check all clones except the active one
    const clones = Object.keys(this.stemCells).filter(clone => clone !== this.activeClone);
    
    for (const clone of clones) {
      const dormantStemCells = this.stemCells[clone].cells.filter(cell => 
        !cell.isActive && 
        cell.stemCellState !== StemCell.States.DEPLETED &&
        cell.getActivationProgress() > 0.7
      );
      
      if (dormantStemCells.length > 0) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Log succession conditions for debugging and analysis
   * @param {Object} conditions - Succession conditions
   * @private
   */
  _logSuccessionConditions(conditions) {
    // Initialize succession conditions log if not exists
    if (!this.successionConditionsLog) {
      this.successionConditionsLog = [];
    }
    
    // Add conditions to log
    this.successionConditionsLog.push(conditions);
    
    // Keep log at a reasonable size
    if (this.successionConditionsLog.length > 100) {
      this.successionConditionsLog.shift();
    }
    
    // Emit event for significant conditions
    if (conditions.shouldSucceed || conditions.urgency > 3) {
      this.emit('successionConditionsChanged', conditions);
    }
  }
  
  /**
   * Trigger a succession event, activating a new stem cell
   * @param {Array} cells - All cells in the simulation
   * @param {number} maxCells - Maximum cell count for the simulation
   * @param {string} trigger - What triggered the succession
   * @param {number} urgency - How urgent the succession is (0-10)
   * @private
   */
  _triggerSuccession(cells, maxCells, trigger, urgency = 5) {
    // Reset counters
    this.dyingCellSignalCount = 0;
    this.successionTimer = 0;
    
    // Set cooldown based on urgency - more urgent events have shorter cooldown
    this.successionCooldown = Math.max(60, 180 - urgency * 12); // Between 1-3 seconds at 60fps
    
    // Get current population before succession
    const populationBefore = cells.length;
    const cloneCountsBefore = this._countCellsByClone(cells);
    const stateCountsBefore = {};
    
    // Get state counts for each clone
    Object.keys(this.stemCells).forEach(clone => {
      stateCountsBefore[clone] = this._countCellStatesByClone(cells, clone);
    });
    
    // Calculate population metrics
    const populationRatio = populationBefore / maxCells;
    const cloneRatios = {};
    Object.keys(cloneCountsBefore).forEach(clone => {
      cloneRatios[clone] = populationBefore > 0 ? cloneCountsBefore[clone] / populationBefore : 0;
    });
    
    // Determine which clone should be activated next
    const oldClone = this.activeClone;
    const nextClone = this._selectNextClone(cells);
    
    // Update activation metrics
    const now = Date.now();
    if (this.activationMetrics.lastActivationTime > 0) {
      const interval = now - this.activationMetrics.lastActivationTime;
      
      // Update average interval
      if (this.activationMetrics.activationCount > 0) {
        const oldAvg = this.activationMetrics.averageActivationInterval;
        const newAvg = oldAvg + (interval - oldAvg) / this.activationMetrics.activationCount;
        this.activationMetrics.averageActivationInterval = newAvg;
      } else {
        this.activationMetrics.averageActivationInterval = interval;
      }
    }
    
    this.activationMetrics.lastActivationTime = now;
    this.activationMetrics.activationCount++;
    
    // Track activation triggers
    if (!this.activationMetrics.activationTriggers[trigger]) {
      this.activationMetrics.activationTriggers[trigger] = 1;
    } else {
      this.activationMetrics.activationTriggers[trigger]++;
    }
    
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
    
    // Record succession event with detailed information
    const successionEvent = {
      time: now,
      oldClone: oldClone,
      newClone: nextClone,
      populationBefore: populationBefore,
      populationRatio: populationRatio,
      cloneCountsBefore: { ...cloneCountsBefore },
      cloneRatios: { ...cloneRatios },
      stateCountsBefore: { ...stateCountsBefore },
      trigger: trigger,
      urgency: urgency,
      suppressionLevel: this.suppressionLevel,
      activationThreshold: this.activationThreshold,
      dyingCellSignals: this.dyingCellSignalCount,
      selectionStrategy: this._determineSelectionStrategy(cells),
      activationInterval: this.activationMetrics.averageActivationInterval,
      activationCount: this.activationMetrics.activationCount
    };
    
    // Add to succession history
    this.successionHistory.push(successionEvent);
    
    // Keep history at a reasonable size
    if (this.successionHistory.length > 20) {
      this.successionHistory.shift();
    }
    
    // Notify about succession event
    this.onSuccessionEvent(successionEvent);
    
    // Emit detailed event for logging and visualization
    this.emit('successionEvent', successionEvent);
    
    // Log the event
    console.log(`Succession event: ${oldClone} → ${nextClone} (Trigger: ${trigger}, Urgency: ${urgency})`);
    
    return successionEvent;
  }
  
  /**
   * Select the next clone to activate based on defined criteria
   * @param {Array} cells - All cells in the simulation (optional)
   * @returns {string} - The next clone identifier
   * @private
   */
  _selectNextClone(cells = []) {
    const clones = ['red', 'green', 'yellow'];
    
    // Default to cycling through clones if no specific selection criteria are met
    const defaultNextClone = () => {
      const currentIndex = clones.indexOf(this.activeClone);
      const nextIndex = (currentIndex + 1) % clones.length;
      return clones[nextIndex];
    };
    
    // Check if we should use a specific selection strategy
    const selectionStrategy = this._determineSelectionStrategy(cells);
    
    switch (selectionStrategy) {
      case 'least_recent':
        return this._selectLeastRecentClone();
        
      case 'spatial_proximity':
        return this._selectByProximityToResources(cells);
        
      case 'healthiest_stem_cells':
        return this._selectCloneWithHealthiestStemCells();
        
      case 'random_weighted':
        return this._selectRandomWeightedClone();
        
      default:
        return defaultNextClone();
    }
  }
  
  /**
   * Determine which selection strategy to use based on current conditions
   * @param {Array} cells - All cells in the simulation
   * @returns {string} - Selection strategy to use
   * @private
   */
  _determineSelectionStrategy(cells) {
    // Population crash - use healthiest stem cells strategy
    if (cells.length < this.maxCells * 0.3) {
      return 'healthiest_stem_cells';
    }
    
    // Spatial distribution is important when population is moderate
    if (cells.length < this.maxCells * 0.7) {
      return 'spatial_proximity';
    }
    
    // Use least recent for normal succession to ensure all clones get activated
    if (this.successionHistory.length >= 3) {
      return 'least_recent';
    }
    
    // Default to random weighted selection
    return 'random_weighted';
  }
  
  /**
   * Select the clone that was activated least recently
   * @returns {string} - Clone identifier
   * @private
   */
  _selectLeastRecentClone() {
    const clones = ['red', 'green', 'yellow'];
    
    // If no succession history, just cycle through
    if (this.successionHistory.length === 0) {
      const currentIndex = clones.indexOf(this.activeClone);
      const nextIndex = (currentIndex + 1) % clones.length;
      return clones[nextIndex];
    }
    
    // Find the last activation time for each clone
    const lastActivated = {};
    clones.forEach(clone => {
      lastActivated[clone] = 0; // Default to 0 (never activated)
    });
    
    // Go through history in reverse to find most recent activation for each clone
    for (let i = this.successionHistory.length - 1; i >= 0; i--) {
      const event = this.successionHistory[i];
      if (lastActivated[event.newClone] === 0) {
        lastActivated[event.newClone] = event.time;
      }
    }
    
    // Find the clone with the oldest (smallest) timestamp or 0
    let leastRecentClone = this.activeClone;
    let oldestTime = Date.now();
    
    Object.keys(lastActivated).forEach(clone => {
      // Skip current active clone
      if (clone === this.activeClone) return;
      
      // If never activated (0) or oldest time, select this clone
      if (lastActivated[clone] === 0 || lastActivated[clone] < oldestTime) {
        oldestTime = lastActivated[clone];
        leastRecentClone = clone;
      }
    });
    
    return leastRecentClone;
  }
  
  /**
   * Select clone based on proximity to resources or spatial distribution
   * @param {Array} cells - All cells in the simulation
   * @returns {string} - Clone identifier
   * @private
   */
  _selectByProximityToResources(cells) {
    // This is a placeholder implementation
    // In a real implementation, this would analyze the spatial distribution
    // of cells and resources to select the clone with best access to resources
    
    // For now, just use random weighted selection
    return this._selectRandomWeightedClone();
  }
  
  /**
   * Select the clone with the healthiest stem cells
   * @returns {string} - Clone identifier
   * @private
   */
  _selectCloneWithHealthiestStemCells() {
    const clones = ['red', 'green', 'yellow'];
    let bestClone = this.activeClone;
    let highestHealth = -1;
    
    clones.forEach(clone => {
      // Skip current active clone
      if (clone === this.activeClone) return;
      
      const stemCells = this.stemCells[clone].cells;
      if (stemCells.length === 0) return;
      
      // Calculate average health of stem cells for this clone
      let totalHealth = 0;
      let healthyStemCells = 0;
      
      stemCells.forEach(cell => {
        if (cell.stemCellState !== StemCell.States.DEPLETED) {
          totalHealth += cell.getDivisionsLeft() / cell.maxDivisions;
          healthyStemCells++;
        }
      });
      
      const avgHealth = healthyStemCells > 0 ? totalHealth / healthyStemCells : 0;
      
      if (avgHealth > highestHealth) {
        highestHealth = avgHealth;
        bestClone = clone;
      }
    });
    
    return bestClone;
  }
  
  /**
   * Select a clone randomly with weights based on various factors
   * @returns {string} - Clone identifier
   * @private
   */
  _selectRandomWeightedClone() {
    const clones = ['red', 'green', 'yellow'];
    const weights = {};
    
    // Skip current active clone
    clones.forEach(clone => {
      if (clone === this.activeClone) {
        weights[clone] = 0;
      } else {
        // Base weight
        weights[clone] = 1;
        
        // Adjust based on stem cell count
        const stemCellCount = this.stemCells[clone].cells.length;
        weights[clone] *= (1 + stemCellCount * 0.5);
        
        // Adjust based on time since last activation
        const timeSinceActivation = this._getTimeSinceLastActivation(clone);
        weights[clone] *= (1 + timeSinceActivation * 0.01); // Increase weight over time
      }
    });
    
    // Calculate total weight
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    // If no valid options (all weights are 0), use default cycling
    if (totalWeight <= 0) {
      const currentIndex = clones.indexOf(this.activeClone);
      const nextIndex = (currentIndex + 1) % clones.length;
      return clones[nextIndex];
    }
    
    // Select based on weights
    let random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    
    for (const clone of clones) {
      cumulativeWeight += weights[clone];
      if (random <= cumulativeWeight) {
        return clone;
      }
    }
    
    // Fallback to default cycling
    const currentIndex = clones.indexOf(this.activeClone);
    const nextIndex = (currentIndex + 1) % clones.length;
    return clones[nextIndex];
  }
  
  /**
   * Get time since a clone was last activated
   * @param {string} clone - Clone identifier
   * @returns {number} - Time in milliseconds since last activation
   * @private
   */
  _getTimeSinceLastActivation(clone) {
    // Find the most recent activation of this clone
    for (let i = this.successionHistory.length - 1; i >= 0; i--) {
      const event = this.successionHistory[i];
      if (event.newClone === clone) {
        return Date.now() - event.time;
      }
    }
    
    // If never activated, return a large value
    return 1000000; // 1000 seconds
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
    
    // Emit event with current signal count
    this.emit('dyingCellSignalRecorded', {
      count: this.dyingCellSignalCount,
      threshold: this.dyingCellSignalThreshold,
      time: Date.now()
    });emit('dyingCellSignalRecorded', {
      count: this.dyingCellSignalCount,
      threshold: this.dyingCellSignalThreshold,
      time: Date.now()
    });emit('dyingCellSignalRecorded', {
      count: this.dyingCellSignalCount,
      threshold: this.dyingCellSignalThreshold,
      time: Date.now()
    });emit('dyingCellSignalRecorded', {
      count: this.dyingCellSignalCount,
      threshold: this.dyingCellSignalThreshold,
      time: Date.now()
    });emit('dyingCellSignalRecorded', {
      count: this.dyingCellSignalCount,
      threshold: this.dyingCellSignalThreshold,
      time: Date.now()
    });emit('dyingCellSignalRecorded', {
      count: this.dyingCellSignalCount,
      threshold: this.dyingCellSignalThreshold,
      time: Date.now()
    });emit('dyingCellSignalRecorded', {
      count: this.dyingCellSignalCount,
      threshold: this.dyingCellSignalThreshold,
      time: Date.now()
    });emit('dyingCellSignalRecorded', {
      count: this.dyingCellSignalCount,
      threshold: this.dyingCellSignalThreshold,
      time: Date.now()
    });
  }
  
  /**
   * Get the current activation threshold
   * @returns {number} - The current activation threshold
   */
  getActivationThreshold() {
    return this.activationThreshold;
  }
  
  /**
   * Set the activation threshold for a specific clone
   * @param {string} clone - Clone identifier
   * @param {number} threshold - New activation threshold
   */
  setCloneActivationThreshold(clone, threshold) {
    // Initialize clone-specific thresholds if not exists
    if (!this.cloneActivationThresholds) {
      this.cloneActivationThresholds = {
        red: this.activationThreshold,
        green: this.activationThreshold,
        yellow: this.activationThreshold
      };
    }
    
    // Set threshold for the specified clone
    if (this.cloneActivationThresholds[clone] !== undefined) {
      this.cloneActivationThresholds[clone] = threshold;
      
      // Emit event
      this.emit('cloneActivationThresholdChanged', {
        clone: clone,
        threshold: threshold,
        time: Date.now()
      });
    }
  }
  
  /**
   * Get the active clone identifier
   * @returns {string} - The active clone identifier
   */
  getActiveClone() {
    return this.activeClone;
  }
  
  /**
   * Set the suppression strength multiplier
   * @param {number} multiplier - Suppression strength multiplier (0-2)
   */
  setSuppressionStrengthMultiplier(multiplier) {
    this.suppressionStrengthMultiplier = Math.max(0.1, Math.min(2.0, multiplier));
    
    // Emit event
    this.emit('suppressionStrengthChanged', this.suppressionStrengthMultiplier);
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
    
    // Emit event for activation threshold change
    this.emit('activationThresholdChanged', this.activationThreshold);
  }
  
  /**
   * Set the suppression strength multiplier
   * @param {number} value - New suppression strength multiplier (0-2)
   */
  setSuppressionStrengthMultiplier(value) {
    this.suppressionStrengthMultiplier = Math.max(0, Math.min(2, value));
    
    // Emit event for suppression strength change
    this.emit('suppressionStrengthChanged', this.suppressionStrengthMultiplier);
  }
  
  /**
   * Set the dying cell signal threshold
   * @param {number} value - New threshold for dying cell signals
   */
  setDyingCellSignalThreshold(value) {
    this.dyingCellSignalThreshold = Math.max(1, Math.floor(value));
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
export default StemCellManager;  /*
*
   * Get the succession conditions log
   * @returns {Array} - Array of succession condition logs
   */
  getSuccessionConditionsLog() {
    return this.successionConditionsLog || [];
  }
  
  /**
   * Get the activation metrics
   * @returns {Object} - Activation metrics
   */
  getActivationMetrics() {
    return this.activationMetrics;
  }
  
  /**
   * Get the most recent succession event
   * @returns {Object|null} - Most recent succession event or null if none
   */
  getMostRecentSuccessionEvent() {
    if (this.successionHistory.length === 0) {
      return null;
    }
    
    return this.successionHistory[this.successionHistory.length - 1];
  }
  
  /**
   * Reset succession metrics for testing or debugging
   */
  resetSuccessionMetrics() {
    this.successionTimer = 0;
    this.dyingCellSignalCount = 0;
    this.successionCooldown = 0;
    this.activationMetrics = {
      lastActivationTime: 0,
      activationCount: 0,
      averageActivationInterval: 0,
      activationTriggers: {}
    };
  }
  
  /**
   * Get the current activation threshold
   * @returns {number} - The current activation threshold
   */
  getActivationThreshold() {
    return this.activationThreshold;
  }
  
  /**
   * Set the activation threshold for a specific clone
   * @param {string} clone - Clone identifier
   * @param {number} threshold - New activation threshold
   */
  setCloneActivationThreshold(clone, threshold) {
    // Initialize clone-specific thresholds if not exists
    if (!this.cloneActivationThresholds) {
      this.cloneActivationThresholds = {
        red: this.activationThreshold,
        green: this.activationThreshold,
        yellow: this.activationThreshold
      };
    }
    
    // Set threshold for the specified clone
    if (this.cloneActivationThresholds[clone] !== undefined) {
      this.cloneActivationThresholds[clone] = threshold;
      
      // Emit event
      this.emit('cloneActivationThresholdChanged', {
        clone: clone,
        threshold: threshold,
        time: Date.now()
      });
    }
  }
  
  /**
   * Get the active clone identifier
   * @returns {string} - The active clone identifier
   */
  getActiveClone() {
    return this.activeClone;
  }
  
  /**
   * Set the suppression strength multiplier
   * @param {number} multiplier - Suppression strength multiplier (0-2)
   */
  setSuppressionStrengthMultiplier(multiplier) {
    this.suppressionStrengthMultiplier = Math.max(0.1, Math.min(2.0, multiplier));
    
    // Emit event
    this.emit('suppressionStrengthChanged', this.suppressionStrengthMultiplier);
  }
  
  /**
   * Get the current activation threshold
   * @returns {number} - The current activation threshold
   */
  getActivationThreshold() {
    return this.activationThreshold;
  }
  
  /**
   * Set the activation threshold for a specific clone
   * @param {string} clone - Clone identifier
   * @param {number} threshold - New activation threshold
   */
  setCloneActivationThreshold(clone, threshold) {
    // Initialize clone-specific thresholds if not exists
    if (!this.cloneActivationThresholds) {
      this.cloneActivationThresholds = {
        red: this.activationThreshold,
        green: this.activationThreshold,
        yellow: this.activationThreshold
      };
    }
    
    // Set threshold for the specified clone
    if (this.cloneActivationThresholds[clone] !== undefined) {
      this.cloneActivationThresholds[clone] = threshold;
      
      // Emit event
      this.emit('cloneActivationThresholdChanged', {
        clone: clone,
        threshold: threshold,
        time: Date.now()
      });
    }
  }