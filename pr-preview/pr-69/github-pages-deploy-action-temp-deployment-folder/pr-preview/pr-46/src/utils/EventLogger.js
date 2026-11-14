/**
 * EventLogger class
 * Logs and manages simulation events with timing and circumstance details
 */
import EventEmitter from './EventEmitter.js';

class EventLogger extends EventEmitter {
  /**
   * Create a new event logger
   * @param {Object} options - Configuration options
   * @param {Object} options.simulation - Reference to the simulation
   * @param {number} options.maxEvents - Maximum number of events to store per type (default: 100)
   */
  constructor(options = {}) {
    super();
    
    this.simulation = options.simulation;
    this.maxEvents = options.maxEvents || 100;
    
    // Event storage by type
    this.events = {
      succession: [],
      stemCellActivation: [],
      stemCellDeactivation: [],
      populationPeak: [],
      populationValley: [],
      cloneDominance: [],
      boundaryExpansion: [],
      boundaryContraction: [],
      simulationMilestone: []
    };
    
    // Event counters
    this.eventCounts = {
      total: 0
    };
    Object.keys(this.events).forEach(type => {
      this.eventCounts[type] = 0;
    });
    
    // Set up event listeners if simulation is provided
    if (this.simulation) {
      this._setupEventListeners();
    }
  }
  
  /**
   * Set up event listeners for the simulation
   * @private
   */
  _setupEventListeners() {
    // Listen for succession events
    this.simulation.on('successionEvent', (details) => {
      this.logEvent('succession', {
        oldClone: details.oldClone,
        newClone: details.newClone,
        populationBefore: details.populationBefore,
        populationAfter: details.populationAfter || this.simulation.cellManager.getCellCount(),
        cloneCountsBefore: details.cloneCountsBefore,
        cloneCountsAfter: details.cloneCountsAfter || this._getCurrentCloneCounts(),
        trigger: details.trigger || 'population_decline'
      });
    });
    
    // Listen for stem cell activation events
    this.simulation.on('stemCellActivated', (stemCell) => {
      this.logEvent('stemCellActivation', {
        clone: stemCell.clone,
        position: stemCell.body ? {
          x: stemCell.body.position.x,
          y: stemCell.body.position.y
        } : null,
        suppressionLevel: this.simulation.stemCellManager.getCurrentSuppressionLevel(),
        activeCells: this.simulation.cellManager.getCellCount(),
        trigger: 'suppression_decrease'
      });
    });
    
    // Listen for stem cell deactivation events
    this.simulation.on('stemCellDeactivated', (stemCell) => {
      this.logEvent('stemCellDeactivation', {
        clone: stemCell.clone,
        position: stemCell.body ? {
          x: stemCell.body.position.x,
          y: stemCell.body.position.y
        } : null,
        divisionsCompleted: stemCell.maxDivisions - stemCell.getDivisionsLeft(),
        totalCells: this.simulation.cellManager.getCellCount(),
        cloneCells: this.simulation.cellManager.getCellsByClone(stemCell.clone).length
      });
    });
    
    // Listen for population peaks and valleys
    if (this.simulation.populationTracker) {
      this.simulation.populationTracker.on('populationPeak', (details) => {
        this.logEvent('populationPeak', {
          value: details.value,
          cloneCounts: this._getCurrentCloneCounts()
        });
      });
      
      this.simulation.populationTracker.on('populationValley', (details) => {
        this.logEvent('populationValley', {
          value: details.value,
          cloneCounts: this._getCurrentCloneCounts()
        });
      });
      
      this.simulation.populationTracker.on('cloneDominance', (details) => {
        this.logEvent('cloneDominance', {
          clone: details.clone,
          population: details.population,
          totalPopulation: details.totalPopulation,
          percentage: details.percentage
        });
      });
    }
    
    // Listen for boundary changes
    this.simulation.on('cageExpansion', (details) => {
      // Only log significant expansions (more than 5% change)
      const previousRadius = this.events.boundaryExpansion.length > 0 ? 
        this.events.boundaryExpansion[this.events.boundaryExpansion.length - 1].details.radius : 0;
      
      const percentChange = previousRadius > 0 ? 
        Math.abs((details.radius - previousRadius) / previousRadius) * 100 : 100;
      
      if (percentChange >= 5) {
        const eventType = details.radius > previousRadius ? 'boundaryExpansion' : 'boundaryContraction';
        
        this.logEvent(eventType, {
          radius: details.radius,
          previousRadius: previousRadius,
          targetRadius: details.targetRadius,
          cellPressure: details.cellPressure,
          populationRatio: details.populationRatio,
          percentChange: percentChange.toFixed(1)
        });
      }
    });
    
    // Listen for time updates to log milestones
    this.simulation.on('timeUpdated', (time) => {
      // Log day milestones (every 5 days)
      if (time.days > 0 && time.days % 5 === 0 && time.hours === 0 && time.minutes < 10) {
        this.logEvent('simulationMilestone', {
          milestone: `Day ${time.days}`,
          totalPopulation: this.simulation.cellManager.getCellCount(),
          cloneCounts: this._getCurrentCloneCounts(),
          stateCounts: this._getCurrentStateCounts()
        });
      }
    });
  }
  
  /**
   * Get current clone counts
   * @returns {Object} - Clone counts
   * @private
   */
  _getCurrentCloneCounts() {
    if (!this.simulation || !this.simulation.cellManager) return {};
    
    return {
      red: this.simulation.cellManager.getCellsByClone('red').length,
      green: this.simulation.cellManager.getCellsByClone('green').length,
      yellow: this.simulation.cellManager.getCellsByClone('yellow').length
    };
  }
  
  /**
   * Get current state counts
   * @returns {Object} - State counts
   * @private
   */
  _getCurrentStateCounts() {
    if (!this.simulation || !this.simulation.cellManager) return {};
    
    return {
      dividing: this.simulation.cellManager.getCellsByState('dividing').length,
      nonDividing: this.simulation.cellManager.getCellsByState('non-dividing').length,
      senescent: this.simulation.cellManager.getCellsByState('senescent').length
    };
  }
  
  /**
   * Log an event
   * @param {string} eventType - Type of event
   * @param {Object} details - Event details
   */
  logEvent(eventType, details) {
    // Check if event type is valid
    if (!this.events[eventType]) {
      console.warn(`Unknown event type: ${eventType}`);
      return;
    }
    
    // Get current time from simulation
    const time = this.simulation ? { ...this.simulation.time } : {
      days: 0,
      hours: 0,
      minutes: 0,
      totalFrames: 0
    };
    
    // Create event object
    const event = {
      id: `${eventType}_${this.eventCounts.total}`,
      type: eventType,
      time: time,
      timestamp: new Date().toISOString(),
      details: details
    };
    
    // Add to events array
    this.events[eventType].push(event);
    
    // Trim events if exceeding max
    if (this.events[eventType].length > this.maxEvents) {
      this.events[eventType].shift();
    }
    
    // Update counters
    this.eventCounts.total++;
    this.eventCounts[eventType]++;
    
    // Emit event
    this.emit('eventLogged', event);
    this.emit(`${eventType}Logged`, event);
  }
  
  /**
   * Get events of a specific type
   * @param {string} eventType - Event type
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of events to return
   * @param {Function} options.filter - Filter function
   * @param {string} options.sort - Sort direction ('asc' or 'desc')
   * @returns {Array} - Filtered events
   */
  getEvents(eventType, options = {}) {
    // Check if event type exists
    if (!this.events[eventType]) {
      return [];
    }
    
    // Get events
    let events = [...this.events[eventType]];
    
    // Apply filter if provided
    if (options.filter && typeof options.filter === 'function') {
      events = events.filter(options.filter);
    }
    
    // Apply sort if provided
    if (options.sort) {
      const sortDirection = options.sort.toLowerCase() === 'asc' ? 1 : -1;
      events.sort((a, b) => {
        const timeA = a.time.totalFrames || 
          (a.time.days * 24 * 60 + a.time.hours * 60 + a.time.minutes);
        const timeB = b.time.totalFrames || 
          (b.time.days * 24 * 60 + b.time.hours * 60 + b.time.minutes);
        return (timeA - timeB) * sortDirection;
      });
    } else {
      // Default sort is descending (newest first)
      events.reverse();
    }
    
    // Apply limit if provided
    if (options.limit && options.limit > 0) {
      events = events.slice(0, options.limit);
    }
    
    return events;
  }
  
  /**
   * Get all events
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of events to return per type
   * @param {Function} options.filter - Filter function
   * @param {string} options.sort - Sort direction ('asc' or 'desc')
   * @returns {Object} - All events by type
   */
  getAllEvents(options = {}) {
    const result = {};
    
    Object.keys(this.events).forEach(eventType => {
      result[eventType] = this.getEvents(eventType, options);
    });
    
    return result;
  }
  
  /**
   * Get events within a time range
   * @param {Object} timeRange - Time range
   * @param {Object} timeRange.start - Start time
   * @param {Object} timeRange.end - End time
   * @param {string} eventType - Optional event type filter
   * @returns {Array} - Events within time range
   */
  getEventsByTimeRange(timeRange, eventType = null) {
    const filter = (event) => {
      const eventTime = event.time.totalFrames || 
        (event.time.days * 24 * 60 + event.time.hours * 60 + event.time.minutes);
      
      const startTime = timeRange.start.totalFrames || 
        (timeRange.start.days * 24 * 60 + timeRange.start.hours * 60 + timeRange.start.minutes);
      
      const endTime = timeRange.end.totalFrames || 
        (timeRange.end.days * 24 * 60 + timeRange.end.hours * 60 + timeRange.end.minutes);
      
      return eventTime >= startTime && eventTime <= endTime;
    };
    
    if (eventType) {
      return this.getEvents(eventType, { filter });
    }
    
    // Get events from all types
    const result = [];
    Object.keys(this.events).forEach(type => {
      result.push(...this.getEvents(type, { filter }));
    });
    
    // Sort by time
    result.sort((a, b) => {
      const timeA = a.time.totalFrames || 
        (a.time.days * 24 * 60 + a.time.hours * 60 + a.time.minutes);
      const timeB = b.time.totalFrames || 
        (b.time.days * 24 * 60 + b.time.hours * 60 + b.time.minutes);
      return timeA - timeB;
    });
    
    return result;
  }
  
  /**
   * Search events by keyword
   * @param {string} keyword - Search keyword
   * @param {string} eventType - Optional event type filter
   * @returns {Array} - Matching events
   */
  searchEvents(keyword, eventType = null) {
    const searchTerm = keyword.toLowerCase();
    
    const filter = (event) => {
      // Search in event type
      if (event.type.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Search in details
      const detailsStr = JSON.stringify(event.details).toLowerCase();
      return detailsStr.includes(searchTerm);
    };
    
    if (eventType) {
      return this.getEvents(eventType, { filter });
    }
    
    // Search in all event types
    const result = [];
    Object.keys(this.events).forEach(type => {
      result.push(...this.getEvents(type, { filter }));
    });
    
    return result;
  }
  
  /**
   * Get event statistics
   * @returns {Object} - Event statistics
   */
  getEventStatistics() {
    const stats = {
      totalEvents: this.eventCounts.total,
      eventsByType: {},
      eventFrequency: {},
      recentEvents: []
    };
    
    // Count events by type
    Object.keys(this.events).forEach(type => {
      stats.eventsByType[type] = this.eventCounts[type];
    });
    
    // Calculate event frequency (events per day)
    if (this.simulation && this.simulation.time.days > 0) {
      Object.keys(this.events).forEach(type => {
        stats.eventFrequency[type] = (this.eventCounts[type] / this.simulation.time.days).toFixed(2);
      });
    }
    
    // Get recent events (last 10 of any type)
    const allEvents = [];
    Object.keys(this.events).forEach(type => {
      allEvents.push(...this.events[type]);
    });
    
    // Sort by time (descending)
    allEvents.sort((a, b) => {
      const timeA = a.time.totalFrames || 
        (a.time.days * 24 * 60 + a.time.hours * 60 + a.time.minutes);
      const timeB = b.time.totalFrames || 
        (b.time.days * 24 * 60 + b.time.hours * 60 + b.time.minutes);
      return timeB - timeA;
    });
    
    stats.recentEvents = allEvents.slice(0, 10);
    
    return stats;
  }
  
  /**
   * Export events as JSON
   * @param {string} eventType - Optional event type filter
   * @returns {string} - JSON string
   */
  exportEventsJSON(eventType = null) {
    let exportData;
    
    if (eventType) {
      exportData = {
        eventType: eventType,
        count: this.eventCounts[eventType] || 0,
        events: this.events[eventType] || []
      };
    } else {
      exportData = {
        totalEvents: this.eventCounts.total,
        eventCounts: { ...this.eventCounts },
        events: { ...this.events }
      };
    }
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Reset the event logger
   */
  reset() {
    // Clear events
    Object.keys(this.events).forEach(type => {
      this.events[type] = [];
    });
    
    // Reset counters
    this.eventCounts = {
      total: 0
    };
    Object.keys(this.events).forEach(type => {
      this.eventCounts[type] = 0;
    });
    
    // Emit reset event
    this.emit('reset');
  }
}

export default EventLogger;