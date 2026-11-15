/**
 * PopulationTracker class
 * Tracks population data over time for analysis and visualization
 */
import EventEmitter from './EventEmitter.js';

class PopulationTracker extends EventEmitter {
  /**
   * Create a new population tracker
   * @param {Object} options - Configuration options
   * @param {number} options.maxHistoryLength - Maximum number of data points to store (default: 100)
   * @param {number} options.samplingInterval - Frames between data samples (default: 30)
   */
  constructor(options = {}) {
    super();
    
    // Configuration
    this.maxHistoryLength = options.maxHistoryLength || 100;
    this.samplingInterval = options.samplingInterval || 30;
    
    // Data storage
    this.populationHistory = [];
    this.clonePopulationHistory = {
      red: [],
      green: [],
      yellow: []
    };
    this.statePopulationHistory = {
      dividing: [],
      'non-dividing': [],
      senescent: []
    };
    
    // Current data
    this.currentPopulation = 0;
    this.clonePopulations = {
      red: 0,
      green: 0,
      yellow: 0
    };
    this.statePopulations = {
      dividing: 0,
      'non-dividing': 0,
      senescent: 0
    };
    
    // Tracking
    this.frameCount = 0;
    this.simulationTime = {
      days: 0,
      hours: 0,
      minutes: 0,
      totalFrames: 0
    };
    
    // Events
    this.events = {
      succession: [],
      populationPeak: [],
      populationValley: [],
      cloneDominance: []
    };
  }
  
  /**
   * Update the tracker with current population data
   * @param {Object} data - Current population data
   * @param {number} data.totalPopulation - Total cell count
   * @param {Object} data.clonePopulations - Population by clone
   * @param {Object} data.statePopulations - Population by state
   * @param {Object} data.simulationTime - Current simulation time
   */
  update(data) {
    // Update current data
    this.currentPopulation = data.totalPopulation;
    this.clonePopulations = { ...data.clonePopulations };
    this.statePopulations = { ...data.statePopulations };
    this.simulationTime = { ...data.simulationTime };
    
    // Increment frame counter
    this.frameCount++;
    
    // Sample data at specified interval
    if (this.frameCount % this.samplingInterval === 0) {
      this._sampleData();
    }
    
    // Detect and record events
    this._detectEvents();
    
    // Emit update event
    this.emit('update', {
      currentPopulation: this.currentPopulation,
      clonePopulations: this.clonePopulations,
      statePopulations: this.statePopulations,
      simulationTime: this.simulationTime
    });
  }
  
  /**
   * Sample current data and add to history
   * @private
   */
  _sampleData() {
    // Add total population to history
    this.populationHistory.push({
      value: this.currentPopulation,
      time: { ...this.simulationTime }
    });
    
    // Add clone populations to history
    for (const clone in this.clonePopulations) {
      this.clonePopulationHistory[clone].push({
        value: this.clonePopulations[clone],
        time: { ...this.simulationTime }
      });
    }
    
    // Add state populations to history
    for (const state in this.statePopulations) {
      this.statePopulationHistory[state].push({
        value: this.statePopulations[state],
        time: { ...this.simulationTime }
      });
    }
    
    // Trim histories if they exceed max length
    if (this.populationHistory.length > this.maxHistoryLength) {
      this.populationHistory.shift();
      
      for (const clone in this.clonePopulationHistory) {
        if (this.clonePopulationHistory[clone].length > this.maxHistoryLength) {
          this.clonePopulationHistory[clone].shift();
        }
      }
      
      for (const state in this.statePopulationHistory) {
        if (this.statePopulationHistory[state].length > this.maxHistoryLength) {
          this.statePopulationHistory[state].shift();
        }
      }
    }
  }
  
  /**
   * Detect and record significant events
   * @private
   */
  _detectEvents() {
    // Detect population peaks and valleys
    this._detectPopulationExtremes();
    
    // Detect clone dominance changes
    this._detectCloneDominance();
    
    // Detect succession events (handled externally and added via recordEvent)
  }
  
  /**
   * Detect population peaks and valleys
   * @private
   */
  _detectPopulationExtremes() {
    // Need at least 3 data points to detect peaks/valleys
    if (this.populationHistory.length < 3) return;
    
    const lastIndex = this.populationHistory.length - 1;
    const current = this.populationHistory[lastIndex].value;
    const previous = this.populationHistory[lastIndex - 1].value;
    const beforePrevious = this.populationHistory[lastIndex - 2].value;
    
    // Detect peak (previous value higher than both adjacent values)
    if (previous > current && previous > beforePrevious) {
      this.events.populationPeak.push({
        time: { ...this.populationHistory[lastIndex - 1].time },
        value: previous
      });
      
      // Emit event
      this.emit('populationPeak', {
        time: { ...this.populationHistory[lastIndex - 1].time },
        value: previous
      });
    }
    
    // Detect valley (previous value lower than both adjacent values)
    if (previous < current && previous < beforePrevious) {
      this.events.populationValley.push({
        time: { ...this.populationHistory[lastIndex - 1].time },
        value: previous
      });
      
      // Emit event
      this.emit('populationValley', {
        time: { ...this.populationHistory[lastIndex - 1].time },
        value: previous
      });
    }
  }
  
  /**
   * Detect changes in clone dominance
   * @private
   */
  _detectCloneDominance() {
    // Find the currently dominant clone
    let dominantClone = null;
    let maxPopulation = 0;
    
    for (const clone in this.clonePopulations) {
      if (this.clonePopulations[clone] > maxPopulation) {
        maxPopulation = this.clonePopulations[clone];
        dominantClone = clone;
      }
    }
    
    // Check if dominance has changed
    if (dominantClone && this.events.cloneDominance.length > 0) {
      const lastDominant = this.events.cloneDominance[this.events.cloneDominance.length - 1].clone;
      
      if (dominantClone !== lastDominant && maxPopulation > 0) {
        // Record dominance change
        this._recordCloneDominance(dominantClone, maxPopulation);
      }
    } else if (dominantClone && maxPopulation > 0) {
      // First dominant clone
      this._recordCloneDominance(dominantClone, maxPopulation);
    }
  }
  
  /**
   * Record a clone dominance event
   * @param {string} clone - Dominant clone
   * @param {number} population - Population of dominant clone
   * @private
   */
  _recordCloneDominance(clone, population) {
    const event = {
      time: { ...this.simulationTime },
      clone: clone,
      population: population,
      totalPopulation: this.currentPopulation,
      percentage: Math.round((population / this.currentPopulation) * 100)
    };
    
    this.events.cloneDominance.push(event);
    
    // Emit event
    this.emit('cloneDominance', event);
  }
  
  /**
   * Record a succession event
   * @param {Object} event - Succession event details
   * @param {string} event.oldClone - Previously dominant clone
   * @param {string} event.newClone - Newly activated clone
   * @param {Object} event.populations - Population data at succession time
   */
  recordSuccessionEvent(event) {
    const successionEvent = {
      time: { ...this.simulationTime },
      oldClone: event.oldClone,
      newClone: event.newClone,
      populations: { ...event.populations },
      totalPopulation: this.currentPopulation
    };
    
    this.events.succession.push(successionEvent);
    
    // Emit event
    this.emit('succession', successionEvent);
  }
  
  /**
   * Get the population history
   * @param {number} limit - Optional limit on number of data points to return
   * @returns {Array} - Population history data
   */
  getPopulationHistory(limit = null) {
    if (limit && limit < this.populationHistory.length) {
      return this.populationHistory.slice(-limit);
    }
    return [...this.populationHistory];
  }
  
  /**
   * Get the clone population history
   * @param {string} clone - Clone identifier (optional, returns all if not specified)
   * @param {number} limit - Optional limit on number of data points to return
   * @returns {Object|Array} - Clone population history data
   */
  getClonePopulationHistory(clone = null, limit = null) {
    if (clone) {
      if (!this.clonePopulationHistory[clone]) {
        return [];
      }
      
      if (limit && limit < this.clonePopulationHistory[clone].length) {
        return this.clonePopulationHistory[clone].slice(-limit);
      }
      
      return [...this.clonePopulationHistory[clone]];
    }
    
    // Return all clone histories
    const result = {};
    for (const c in this.clonePopulationHistory) {
      if (limit && limit < this.clonePopulationHistory[c].length) {
        result[c] = this.clonePopulationHistory[c].slice(-limit);
      } else {
        result[c] = [...this.clonePopulationHistory[c]];
      }
    }
    
    return result;
  }
  
  /**
   * Get the state population history
   * @param {string} state - State identifier (optional, returns all if not specified)
   * @param {number} limit - Optional limit on number of data points to return
   * @returns {Object|Array} - State population history data
   */
  getStatePopulationHistory(state = null, limit = null) {
    if (state) {
      if (!this.statePopulationHistory[state]) {
        return [];
      }
      
      if (limit && limit < this.statePopulationHistory[state].length) {
        return this.statePopulationHistory[state].slice(-limit);
      }
      
      return [...this.statePopulationHistory[state]];
    }
    
    // Return all state histories
    const result = {};
    for (const s in this.statePopulationHistory) {
      if (limit && limit < this.statePopulationHistory[s].length) {
        result[s] = this.statePopulationHistory[s].slice(-limit);
      } else {
        result[s] = [...this.statePopulationHistory[s]];
      }
    }
    
    return result;
  }
  
  /**
   * Get events of a specific type
   * @param {string} eventType - Event type (succession, populationPeak, populationValley, cloneDominance)
   * @param {number} limit - Optional limit on number of events to return
   * @returns {Array} - Event data
   */
  getEvents(eventType, limit = null) {
    if (!this.events[eventType]) {
      return [];
    }
    
    if (limit && limit < this.events[eventType].length) {
      return this.events[eventType].slice(-limit);
    }
    
    return [...this.events[eventType]];
  }
  
  /**
   * Get all events
   * @returns {Object} - All event data by type
   */
  getAllEvents() {
    const result = {};
    for (const eventType in this.events) {
      result[eventType] = [...this.events[eventType]];
    }
    return result;
  }
  
  /**
   * Get current population statistics
   * @returns {Object} - Current population statistics
   */
  getCurrentStatistics() {
    // Calculate clone percentages
    const clonePercentages = {};
    for (const clone in this.clonePopulations) {
      clonePercentages[clone] = this.currentPopulation > 0 ? 
        Math.round((this.clonePopulations[clone] / this.currentPopulation) * 100) : 0;
    }
    
    // Calculate state percentages
    const statePercentages = {};
    for (const state in this.statePopulations) {
      statePercentages[state] = this.currentPopulation > 0 ? 
        Math.round((this.statePopulations[state] / this.currentPopulation) * 100) : 0;
    }
    
    return {
      totalPopulation: this.currentPopulation,
      clonePopulations: { ...this.clonePopulations },
      statePopulations: { ...this.statePopulations },
      clonePercentages,
      statePercentages,
      time: { ...this.simulationTime }
    };
  }
  
  /**
   * Reset the tracker
   */
  reset() {
    // Reset data storage
    this.populationHistory = [];
    this.clonePopulationHistory = {
      red: [],
      green: [],
      yellow: []
    };
    this.statePopulationHistory = {
      dividing: [],
      'non-dividing': [],
      senescent: []
    };
    
    // Reset current data
    this.currentPopulation = 0;
    this.clonePopulations = {
      red: 0,
      green: 0,
      yellow: 0
    };
    this.statePopulations = {
      dividing: 0,
      'non-dividing': 0,
      senescent: 0
    };
    
    // Reset tracking
    this.frameCount = 0;
    this.simulationTime = {
      days: 0,
      hours: 0,
      minutes: 0,
      totalFrames: 0
    };
    
    // Reset events
    this.events = {
      succession: [],
      populationPeak: [],
      populationValley: [],
      cloneDominance: []
    };
    
    // Emit reset event
    this.emit('reset');
  }
  
  /**
   * Export population data as CSV
   * @returns {string} - CSV formatted data
   */
  exportPopulationDataCSV() {
    // Create header row
    let csv = 'Time,TotalPopulation,RedPopulation,GreenPopulation,YellowPopulation,DividingCells,NonDividingCells,SenescentCells\n';
    
    // Add data rows
    for (let i = 0; i < this.populationHistory.length; i++) {
      const time = this.populationHistory[i].time;
      const timeString = `${time.days}d ${time.hours}h ${time.minutes}m`;
      
      // Get corresponding clone data (may not exist for all time points)
      const redValue = this.clonePopulationHistory.red[i]?.value || 0;
      const greenValue = this.clonePopulationHistory.green[i]?.value || 0;
      const yellowValue = this.clonePopulationHistory.yellow[i]?.value || 0;
      
      // Get corresponding state data
      const dividingValue = this.statePopulationHistory.dividing[i]?.value || 0;
      const nonDividingValue = this.statePopulationHistory['non-dividing'][i]?.value || 0;
      const senescentValue = this.statePopulationHistory.senescent[i]?.value || 0;
      
      // Add row
      csv += `${timeString},${this.populationHistory[i].value},${redValue},${greenValue},${yellowValue},${dividingValue},${nonDividingValue},${senescentValue}\n`;
    }
    
    return csv;
  }
  
  /**
   * Export events data as JSON
   * @returns {string} - JSON formatted event data
   */
  exportEventsJSON() {
    return JSON.stringify(this.events, null, 2);
  }
}

// Export the PopulationTracker class
export default PopulationTracker;