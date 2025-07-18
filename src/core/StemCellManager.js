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
   */
  constructor(options = {}) {
    super();
    
    this.stemCells = {
      red: { cells: [], divisionsLeft: 25, active: true },
      green: { cells: [], divisionsLeft: 25, active: false },
      yellow: { cells: [], divisionsLeft: 25, active: false }
    };
    
    this.activeClone = 'red';
    this.suppressionLevel = 1.0;
    this.activationThreshold = 0.3;
    this.suppressionStrengthMultiplier = 1.0;
    this.successionTimer = 0;
    this.dyingCellSignalCount = 0;
    this.dyingCellSignalThreshold = 10;
    this.successionCooldown = 0;
    this.successionHistory = [];
    
    // Clone-specific activation thresholds
    this.cloneActivationThresholds = {
      red: this.activationThreshold,
      green: this.activationThreshold,
      yellow: this.activationThreshold
    };
    
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
      
      if (clone === this.activeClone) {
        stemCell.activate();
      }
    }
  }
  
  /**
   * Update the suppression signal based on active cell population
   * @param {Array} cells - All cells in the simulation
   * @param {number} maxCells - Maximum cell count for the simulation
   */
  updateSuppressionSignal(cells, maxCells) {
    const cloneCounts = this._countCellsByClone(cells);
    this._updatePopulationHistory(cloneCounts);
    
    const activeCloneCount = cloneCounts[this.activeClone];
    const totalCells = cells.length;
    const populationRatio = totalCells > 0 ? activeCloneCount / totalCells : 0;
    
    this._calculateSuppressionLevel(totalCells, activeCloneCount, populationRatio, maxCells);
    this._applySuppression();
    
    if (this.successionCooldown > 0) {
      this.successionCooldown--;
    }
  }
  
  /**
   * Check if conditions are right for a new stem cell activation
   * @param {Array} cells - All cells in the simulation
   * @param {number} maxCells - Maximum cell count for the simulation
   * @returns {boolean} - Whether a succession event occurred
   */
  checkActivationConditions(cells, maxCells) {
    if (this.successionCooldown > 0) {
      this.successionCooldown--;
      return false;
    }
    
    const totalCells = cells.length;
    const senescentCells = cells.filter(cell => cell.state === 'senescent');
    const senescentRatio = senescentCells.length / totalCells;
    
    // Check for succession triggers
    const isPopulationCrash = totalCells < maxCells * 0.3;
    const isHighSenescence = senescentRatio > 0.6;
    const hasSufficientDyingSignals = this.dyingCellSignalCount >= this.dyingCellSignalThreshold;
    const isSuppressionLow = this.suppressionLevel < this.activationThreshold;
    
    let shouldSucceed = false;
    let trigger = '';
    
    if (isPopulationCrash) {
      shouldSucceed = true;
      trigger = 'population_crash';
    } else if (isHighSenescence && isSuppressionLow) {
      shouldSucceed = true;
      trigger = 'high_senescence';
    } else if (hasSufficientDyingSignals && isSuppressionLow) {
      shouldSucceed = true;
      trigger = 'dying_cell_signals';
    }
    
    if (shouldSucceed) {
      this._triggerSuccession(cells, maxCells, trigger);
      return true;
    }
    
    return false;
  }
  
  /**
   * Record a dying cell signal
   */
  recordDyingCellSignal() {
    this.dyingCellSignalCount++;
  }
  
  /**
   * Get the current activation threshold
   * @returns {number} - The current activation threshold
   */
  getActivationThreshold() {
    return this.activationThreshold;
  }
  
  /**
   * Set the activation threshold for all clones
   * @param {number} threshold - New activation threshold
   */
  setActivationThreshold(threshold) {
    this.activationThreshold = Math.max(0.1, Math.min(0.9, threshold));
    
    Object.keys(this.cloneActivationThresholds).forEach(clone => {
      this.cloneActivationThresholds[clone] = this.activationThreshold;
    });
    
    this.emit('activationThresholdChanged', this.activationThreshold);
  }
  
  /**
   * Set the activation threshold for a specific clone
   * @param {string} clone - Clone identifier
   * @param {number} threshold - New activation threshold
   */
  setCloneActivationThreshold(clone, threshold) {
    if (this.cloneActivationThresholds[clone] !== undefined) {
      this.cloneActivationThresholds[clone] = Math.max(0.1, Math.min(0.9, threshold));
      
      this.emit('cloneActivationThresholdChanged', {
        clone: clone,
        threshold: this.cloneActivationThresholds[clone],
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
    this.emit('suppressionStrengthChanged', this.suppressionStrengthMultiplier);
  }
  
  // Private methods
  
  _countCellsByClone(cells) {
    const cloneCounts = { red: 0, green: 0, yellow: 0 };
    
    cells.forEach(cell => {
      if (cloneCounts[cell.clone] !== undefined) {
        cloneCounts[cell.clone]++;
      }
    });
    
    return cloneCounts;
  }
  
  _updatePopulationHistory(cloneCounts) {
    const maxHistoryLength = 100;
    
    Object.keys(this.populationHistory).forEach(clone => {
      this.populationHistory[clone].push(cloneCounts[clone]);
      
      if (this.populationHistory[clone].length > maxHistoryLength) {
        this.populationHistory[clone].shift();
      }
    });
  }
  
  _calculateSuppressionLevel(totalCells, activeCloneCount, populationRatio, maxCells) {
    const isPopulationNearMax = totalCells >= maxCells * 0.9;
    const isActiveCloneDeclining = this._isCloneDeclining(this.activeClone);
    const isActiveCloneSmall = activeCloneCount < maxCells * 0.3;
    
    let baseSuppression = this.suppressionLevel;
    
    if (isPopulationNearMax) {
      baseSuppression = Math.min(1.0, this.suppressionLevel + 0.05);
    } else if (isActiveCloneDeclining && isActiveCloneSmall) {
      baseSuppression = Math.max(0.1, this.suppressionLevel - 0.08);
    } else if (isActiveCloneDeclining) {
      baseSuppression = Math.max(0.1, this.suppressionLevel - 0.05);
    } else {
      baseSuppression = Math.max(0.1, this.suppressionLevel - 0.01);
    }
    
    this.suppressionLevel = Math.max(0.1, Math.min(1.0, baseSuppression));
    this.emit('suppressionLevelChanged', this.suppressionLevel);
  }
  
  _isCloneDeclining(clone) {
    const history = this.populationHistory[clone];
    if (history.length < 10) return false;
    
    const current = history[history.length - 1];
    const recent = history.slice(-10, -5);
    const recentAvg = recent.reduce((sum, count) => sum + count, 0) / recent.length;
    
    return current < recentAvg * 0.8;
  }
  
  _applySuppression() {
    Object.keys(this.stemCells).forEach(clone => {
      if (clone !== this.activeClone) {
        this.stemCells[clone].cells.forEach(stemCell => {
          if (stemCell.suppress) {
            stemCell.suppress(this.suppressionLevel);
          }
        });
      }
    });
  }
  
  _triggerSuccession(cells, maxCells, trigger) {
    this.dyingCellSignalCount = 0;
    this.successionTimer = 0;
    this.successionCooldown = 120; // 2 seconds at 60fps
    
    const oldClone = this.activeClone;
    const nextClone = this._selectNextClone();
    
    // Deactivate current stem cells
    this.stemCells[oldClone].cells.forEach(stemCell => {
      if (stemCell.deactivate) {
        stemCell.deactivate();
      }
    });
    
    // Update active clone
    this.activeClone = nextClone;
    
    // Activate stem cells of the new clone
    this.stemCells[this.activeClone].cells.forEach(stemCell => {
      if (stemCell.activate) {
        stemCell.activate();
      }
    });
    
    // Create succession event
    const successionEvent = {
      time: Date.now(),
      oldClone: oldClone,
      newClone: nextClone,
      populationBefore: cells.length,
      trigger: trigger
    };
    
    this.successionHistory.push(successionEvent);
    
    if (this.successionHistory.length > 20) {
      this.successionHistory.shift();
    }
    
    this.onSuccessionEvent(successionEvent);
    this.emit('successionEvent', successionEvent);
    
    console.log(`Succession event: ${oldClone} → ${nextClone} (Trigger: ${trigger})`);
  }
  
  _selectNextClone() {
    const clones = ['red', 'green', 'yellow'];
    const currentIndex = clones.indexOf(this.activeClone);
    const nextIndex = (currentIndex + 1) % clones.length;
    return clones[nextIndex];
  }
}

export default StemCellManager;