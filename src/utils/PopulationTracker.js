/**
 * PopulationTracker class
 * Tracks and analyzes population data for different clones over time
 */
import EventEmitter from './EventEmitter.js';

class PopulationTracker extends EventEmitter {
  /**
   * Create a new population tracker
   * @param {Object} options - Configuration options
   * @param {Object} options.simulation - Reference to the simulation
   */
  constructor(options = {}) {
    super();
    
    this.simulation = options.simulation;
    
    // Initialize data structures
    this.populationHistory = [];
    this.clonePopulationHistory = {
      red: [],
      green: [],
      yellow: []
    };
    
    this.statePopulationHistory = {
      dividing: [],
      nonDividing: [],
      senescent: []
    };
    
    // Clone-specific state tracking
    this.cloneStateHistory = {
      red: { dividing: [], nonDividing: [], senescent: [] },
      green: { dividing: [], nonDividing: [], senescent: [] },
      yellow: { dividing: [], nonDividing: [], senescent: [] }
    };
    
    // Population metrics
    this.metrics = {
      peakPopulation: 0,
      peakClonePopulations: { red: 0, green: 0, yellow: 0 },
      averagePopulation: 0,
      populationVariance: 0,
      cloneDominance: { clone: null, value: 0 },
      cloneGrowthRates: { red: 0, green: 0, yellow: 0 }
    };
    
    // Configuration
    this.maxHistoryLength = 200;
    this.updateInterval = 5; // Update every 5 frames
    this.frameCounter = 0;
    
    // Set up event listeners
    this._initEventListeners();
  }
  
  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    if (this.simulation) {
      this.simulation.on('cellCreated', (cell) => this._markForUpdate());
      this.simulation.on('cellDied', (cell) => this._markForUpdate());
      this.simulation.on('successionEvent', (details) => this._onSuccessionEvent(details));
    }
  }
  
  /**
   * Mark the tracker for update
   * @private
   */
  _markForUpdate() {
    this.needsUpdate = true;
  }
  
  /**
   * Handle succession events
   * @param {Object} details - Succession event details
   * @private
   */
  _onSuccessionEvent(details) {
    // Record succession in history with population data
    const successionData = {
      ...details,
      time: Date.now(),
      populationSnapshot: {
        total: this.getCurrentPopulation(),
        byClone: this.getClonePopulations(),
        byState: this.getStatePopulations()
      }
    };
    
    // Add to succession history
    if (!this.successionHistory) {
      this.successionHistory = [];
    }
    
    this.successionHistory.push(successionData);
    
    // Keep history at a reasonable size
    if (this.successionHistory.length > 20) {
      this.successionHistory.shift();
    }
    
    // Emit event
    this.emit('successionRecorded', successionData);
  }
  
  /**
   * Update population tracking data
   */
  update() {
    if (!this.simulation || !this.simulation.cellManager) return;
    
    this.frameCounter++;
    
    // Only update at specified interval or when marked for update
    if (this.frameCounter < this.updateInterval && !this.needsUpdate) return;
    
    // Reset counter and update flag
    this.frameCounter = 0;
    this.needsUpdate = false;
    
    const cellManager = this.simulation.cellManager;
    
    // Get current population counts
    const totalPopulation = cellManager.getCellCount();
    
    // Get clone populations
    const clonePopulations = {
      red: cellManager.getCellsByClone('red').length,
      green: cellManager.getCellsByClone('green').length,
      yellow: cellManager.getCellsByClone('yellow').length
    };
    
    // Get state populations
    const statePopulations = {
      dividing: cellManager.getCellsByState('dividing').length,
      nonDividing: cellManager.getCellsByState('non-dividing').length,
      senescent: cellManager.getCellsByState('senescent').length
    };
    
    // Get clone-specific state populations
    const cloneStatePopulations = {
      red: {
        dividing: cellManager.getCellsByClone('red').filter(cell => cell.state === 'dividing').length,
        nonDividing: cellManager.getCellsByClone('red').filter(cell => cell.state === 'non-dividing').length,
        senescent: cellManager.getCellsByClone('red').filter(cell => cell.state === 'senescent').length
      },
      green: {
        dividing: cellManager.getCellsByClone('green').filter(cell => cell.state === 'dividing').length,
        nonDividing: cellManager.getCellsByClone('green').filter(cell => cell.state === 'non-dividing').length,
        senescent: cellManager.getCellsByClone('green').filter(cell => cell.state === 'senescent').length
      },
      yellow: {
        dividing: cellManager.getCellsByClone('yellow').filter(cell => cell.state === 'dividing').length,
        nonDividing: cellManager.getCellsByClone('yellow').filter(cell => cell.state === 'non-dividing').length,
        senescent: cellManager.getCellsByClone('yellow').filter(cell => cell.state === 'senescent').length
      }
    };
    
    // Add to history
    this.populationHistory.push(totalPopulation);
    
    Object.keys(clonePopulations).forEach(clone => {
      this.clonePopulationHistory[clone].push(clonePopulations[clone]);
    });
    
    Object.keys(statePopulations).forEach(state => {
      this.statePopulationHistory[state].push(statePopulations[state]);
    });
    
    // Add clone-specific state data
    Object.keys(cloneStatePopulations).forEach(clone => {
      Object.keys(cloneStatePopulations[clone]).forEach(state => {
        this.cloneStateHistory[clone][state].push(cloneStatePopulations[clone][state]);
      });
    });
    
    // Trim histories to max length
    if (this.populationHistory.length > this.maxHistoryLength) {
      this.populationHistory.shift();
      
      Object.keys(this.clonePopulationHistory).forEach(clone => {
        this.clonePopulationHistory[clone].shift();
      });
      
      Object.keys(this.statePopulationHistory).forEach(state => {
        this.statePopulationHistory[state].shift();
      });
      
      Object.keys(this.cloneStateHistory).forEach(clone => {
        Object.keys(this.cloneStateHistory[clone]).forEach(state => {
          this.cloneStateHistory[clone][state].shift();
        });
      });
    }
    
    // Update metrics
    this._updateMetrics();
    
    // Emit update event
    this.emit('populationDataUpdated', {
      total: totalPopulation,
      byClone: clonePopulations,
      byState: statePopulations,
      byCloneAndState: cloneStatePopulations
    });
  }
  
  /**
   * Update population metrics
   * @private
   */
  _updateMetrics() {
    // Update peak population
    const currentPopulation = this.populationHistory[this.populationHistory.length - 1] || 0;
    this.metrics.peakPopulation = Math.max(this.metrics.peakPopulation, currentPopulation);
    
    // Update peak clone populations
    Object.keys(this.clonePopulationHistory).forEach(clone => {
      const currentClonePopulation = this.clonePopulationHistory[clone][this.clonePopulationHistory[clone].length - 1] || 0;
      this.metrics.peakClonePopulations[clone] = Math.max(this.metrics.peakClonePopulations[clone], currentClonePopulation);
    });
    
    // Calculate average population (over last 50 data points)
    const recentHistory = this.populationHistory.slice(-50);
    if (recentHistory.length > 0) {
      this.metrics.averagePopulation = recentHistory.reduce((sum, val) => sum + val, 0) / recentHistory.length;
    }
    
    // Calculate population variance
    if (recentHistory.length > 0) {
      const mean = this.metrics.averagePopulation;
      const variance = recentHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentHistory.length;
      this.metrics.populationVariance = variance;
    }
    
    // Calculate clone dominance
    const currentClonePopulations = {};
    Object.keys(this.clonePopulationHistory).forEach(clone => {
      currentClonePopulations[clone] = this.clonePopulationHistory[clone][this.clonePopulationHistory[clone].length - 1] || 0;
    });
    
    if (currentPopulation > 0) {
      let dominantClone = null;
      let dominanceValue = 0;
      
      Object.keys(currentClonePopulations).forEach(clone => {
        const ratio = currentClonePopulations[clone] / currentPopulation;
        if (ratio > dominanceValue) {
          dominantClone = clone;
          dominanceValue = ratio;
        }
      });
      
      this.metrics.cloneDominance = {
        clone: dominantClone,
        value: dominanceValue
      };
    }
    
    // Calculate clone growth rates (over last 20 data points)
    Object.keys(this.clonePopulationHistory).forEach(clone => {
      const history = this.clonePopulationHistory[clone];
      if (history.length >= 20) {
        const recent = history.slice(-20);
        const start = recent[0];
        const end = recent[recent.length - 1];
        
        if (start > 0) {
          // Calculate growth rate as percentage change
          this.metrics.cloneGrowthRates[clone] = (end - start) / start;
        } else if (end > 0) {
          // If starting from zero, use a high growth rate
          this.metrics.cloneGrowthRates[clone] = 1.0;
        } else {
          // No growth
          this.metrics.cloneGrowthRates[clone] = 0;
        }
      }
    });
  }
  
  /**
   * Get current total population
   * @returns {number} - Current population count
   */
  getCurrentPopulation() {
    return this.populationHistory[this.populationHistory.length - 1] || 0;
  }
  
  /**
   * Get current clone populations
   * @returns {Object} - Object with clone population counts
   */
  getClonePopulations() {
    const result = {};
    Object.keys(this.clonePopulationHistory).forEach(clone => {
      result[clone] = this.clonePopulationHistory[clone][this.clonePopulationHistory[clone].length - 1] || 0;
    });
    return result;
  }
  
  /**
   * Get current state populations
   * @returns {Object} - Object with state population counts
   */
  getStatePopulations() {
    const result = {};
    Object.keys(this.statePopulationHistory).forEach(state => {
      result[state] = this.statePopulationHistory[state][this.statePopulationHistory[state].length - 1] || 0;
    });
    return result;
  }
  
  /**
   * Get population history
   * @param {number} limit - Maximum number of data points to return (optional)
   * @returns {Array} - Population history array
   */
  getPopulationHistory(limit) {
    if (limit && limit > 0) {
      return this.populationHistory.slice(-limit);
    }
    return [...this.populationHistory];
  }
  
  /**
   * Get clone population history
   * @param {string} clone - Clone identifier (optional)
   * @param {number} limit - Maximum number of data points to return (optional)
   * @returns {Object|Array} - Clone population history
   */
  getClonePopulationHistory(clone, limit) {
    if (clone && this.clonePopulationHistory[clone]) {
      if (limit && limit > 0) {
        return this.clonePopulationHistory[clone].slice(-limit);
      }
      return [...this.clonePopulationHistory[clone]];
    }
    
    const result = {};
    Object.keys(this.clonePopulationHistory).forEach(c => {
      if (limit && limit > 0) {
        result[c] = this.clonePopulationHistory[c].slice(-limit);
      } else {
        result[c] = [...this.clonePopulationHistory[c]];
      }
    });
    return result;
  }
  
  /**
   * Get state population history
   * @param {string} state - State identifier (optional)
   * @param {number} limit - Maximum number of data points to return (optional)
   * @returns {Object|Array} - State population history
   */
  getStatePopulationHistory(state, limit) {
    if (state && this.statePopulationHistory[state]) {
      if (limit && limit > 0) {
        return this.statePopulationHistory[state].slice(-limit);
      }
      return [...this.statePopulationHistory[state]];
    }
    
    const result = {};
    Object.keys(this.statePopulationHistory).forEach(s => {
      if (limit && limit > 0) {
        result[s] = this.statePopulationHistory[s].slice(-limit);
      } else {
        result[s] = [...this.statePopulationHistory[s]];
      }
    });
    return result;
  }
  
  /**
   * Get clone-specific state population history
   * @param {string} clone - Clone identifier
   * @param {string} state - State identifier
   * @param {number} limit - Maximum number of data points to return (optional)
   * @returns {Object|Array} - Clone-specific state population history
   */
  getCloneStateHistory(clone, state, limit) {
    if (clone && state && this.cloneStateHistory[clone] && this.cloneStateHistory[clone][state]) {
      if (limit && limit > 0) {
        return this.cloneStateHistory[clone][state].slice(-limit);
      }
      return [...this.cloneStateHistory[clone][state]];
    }
    
    const result = {};
    Object.keys(this.cloneStateHistory).forEach(c => {
      result[c] = {};
      Object.keys(this.cloneStateHistory[c]).forEach(s => {
        if (limit && limit > 0) {
          result[c][s] = this.cloneStateHistory[c][s].slice(-limit);
        } else {
          result[c][s] = [...this.cloneStateHistory[c][s]];
        }
      });
    });
    return result;
  }
  
  /**
   * Get population metrics
   * @returns {Object} - Population metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Get succession history
   * @returns {Array} - Succession history
   */
  getSuccessionHistory() {
    return this.successionHistory ? [...this.successionHistory] : [];
  }
  
  /**
   * Export population data as CSV
   * @returns {string} - CSV data
   */
  exportPopulationDataCSV() {
    // Create CSV header
    let csv = 'Frame,Total,Red,Green,Yellow,Dividing,NonDividing,Senescent\n';
    
    // Calculate the number of data points
    const dataPoints = this.populationHistory.length;
    
    // Create CSV rows
    for (let i = 0; i < dataPoints; i++) {
      const total = this.populationHistory[i];
      const red = this.clonePopulationHistory.red[i] || 0;
      const green = this.clonePopulationHistory.green[i] || 0;
      const yellow = this.clonePopulationHistory.yellow[i] || 0;
      const dividing = this.statePopulationHistory.dividing[i] || 0;
      const nonDividing = this.statePopulationHistory.nonDividing[i] || 0;
      const senescent = this.statePopulationHistory.senescent[i] || 0;
      
      csv += [
        i,
        total,
        red,
        green,
        yellow,
        dividing,
        nonDividing,
        senescent
      ].join(',') + '\n';
    }
    
    return csv;
  }
  
  /**
   * Export clone-specific state data as CSV
   * @returns {string} - CSV data
   */
  exportCloneStateDataCSV() {
    // Create CSV header
    let csv = 'Frame,Red_Dividing,Red_NonDividing,Red_Senescent,Green_Dividing,Green_NonDividing,Green_Senescent,Yellow_Dividing,Yellow_NonDividing,Yellow_Senescent\n';
    
    // Calculate the number of data points
    const dataPoints = this.populationHistory.length;
    
    // Create CSV rows
    for (let i = 0; i < dataPoints; i++) {
      const redDividing = this.cloneStateHistory.red.dividing[i] || 0;
      const redNonDividing = this.cloneStateHistory.red.nonDividing[i] || 0;
      const redSenescent = this.cloneStateHistory.red.senescent[i] || 0;
      
      const greenDividing = this.cloneStateHistory.green.dividing[i] || 0;
      const greenNonDividing = this.cloneStateHistory.green.nonDividing[i] || 0;
      const greenSenescent = this.cloneStateHistory.green.senescent[i] || 0;
      
      const yellowDividing = this.cloneStateHistory.yellow.dividing[i] || 0;
      const yellowNonDividing = this.cloneStateHistory.yellow.nonDividing[i] || 0;
      const yellowSenescent = this.cloneStateHistory.yellow.senescent[i] || 0;
      
      csv += [
        i,
        redDividing,
        redNonDividing,
        redSenescent,
        greenDividing,
        greenNonDividing,
        greenSenescent,
        yellowDividing,
        yellowNonDividing,
        yellowSenescent
      ].join(',') + '\n';
    }
    
    return csv;
  }
}

export default PopulationTracker;