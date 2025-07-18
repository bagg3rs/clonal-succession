/**
 * EventLogDisplay class
 * Displays event log data in the UI
 */
class EventLogDisplay {
  /**
   * Create a new event log display
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - Container element for the display
   * @param {Object} options.simulation - Reference to the simulation
   * @param {number} options.maxEvents - Maximum number of events to display (default: 10)
   */
  constructor(options = {}) {
    this.container = options.container;
    this.simulation = options.simulation;
    this.maxEvents = options.maxEvents || 10;
    this.selectedEventType = 'all';
    this.searchTerm = '';
    
    // Create elements
    this._createElements();
    
    // Set up event listeners
    if (this.simulation && this.simulation.eventLogger) {
      this.simulation.eventLogger.on('eventLogged', () => this._updateEventList());
      this.simulation.eventLogger.on('reset', () => this._updateEventList());
    }
  }
  
  /**
   * Create the HTML elements for the event log display
   * @private
   */
  _createElements() {
    if (!this.container) return;
    
    // Clear container
    this.container.innerHTML = '';
    
    // Create main sections
    this.header = this._createElement('div', 'event-log-header', this.container);
    this.filterControls = this._createElement('div', 'event-log-filters', this.container);
    this.eventList = this._createElement('div', 'event-log-list', this.container);
    
    // Create header
    this.header.innerHTML = '<h3>Event Log</h3>';
    
    // Create filter controls
    this.eventTypeSelect = this._createElement('select', 'event-type-filter', this.filterControls);
    this.eventTypeSelect.innerHTML = `
      <option value="all">All Events</option>
      <option value="succession">Succession</option>
      <option value="stemCellActivation">Stem Cell Activation</option>
      <option value="stemCellDeactivation">Stem Cell Deactivation</option>
      <option value="populationPeak">Population Peak</option>
      <option value="populationValley">Population Valley</option>
      <option value="cloneDominance">Clone Dominance</option>
      <option value="boundaryExpansion">Boundary Expansion</option>
      <option value="boundaryContraction">Boundary Contraction</option>
      <option value="simulationMilestone">Simulation Milestone</option>
    `;
    
    this.searchInput = this._createElement('input', 'event-search', this.filterControls);
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Search events...';
    
    this.filterButton = this._createElement('button', 'filter-button', this.filterControls);
    this.filterButton.textContent = 'Filter';
    
    // Add event listeners to filter controls
    this.eventTypeSelect.addEventListener('change', () => {
      this.selectedEventType = this.eventTypeSelect.value;
      this._updateEventList();
    });
    
    this.searchInput.addEventListener('input', () => {
      this.searchTerm = this.searchInput.value;
    });
    
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this._updateEventList();
      }
    });
    
    this.filterButton.addEventListener('click', () => {
      this._updateEventList();
    });
    
    // Create event list
    this.eventItems = this._createElement('div', 'event-items', this.eventList);
    
    // Add styles
    this._addStyles();
    
    // Initial update
    this._updateEventList();
  }
  
  /**
   * Create an HTML element with the specified class and append it to a parent
   * @param {string} tag - HTML tag name
   * @param {string} className - CSS class name
   * @param {HTMLElement} parent - Parent element
   * @returns {HTMLElement} - The created element
   * @private
   */
  _createElement(tag, className, parent) {
    const element = document.createElement(tag);
    element.className = className;
    if (parent) {
      parent.appendChild(element);
    }
    return element;
  }
  
  /**
   * Add CSS styles for the event log display
   * @private
   */
  _addStyles() {
    // Check if styles already exist
    if (document.getElementById('event-log-display-styles')) return;
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'event-log-display-styles';
    
    // Add CSS rules
    style.textContent = `
      .event-log-header, .event-log-filters, .event-log-list {
        margin-bottom: 10px;
        padding: 10px;
        background: rgba(30, 30, 30, 0.7);
        border-radius: 5px;
      }
      
      .event-log-header h3 {
        margin-top: 0;
        margin-bottom: 5px;
        font-size: 16px;
        color: #ccc;
      }
      
      .event-log-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }
      
      .event-type-filter, .event-search {
        padding: 5px;
        background: rgba(50, 50, 50, 0.7);
        border: 1px solid #555;
        border-radius: 3px;
        color: #eee;
        font-size: 14px;
      }
      
      .filter-button {
        padding: 5px 10px;
        background: #2a6b9c;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .filter-button:hover {
        background: #3a7bac;
      }
      
      .event-log-list {
        max-height: 300px;
        overflow-y: auto;
      }
      
      .event-item {
        padding: 8px;
        margin-bottom: 8px;
        border-left: 3px solid;
        background: rgba(50, 50, 50, 0.5);
        font-size: 12px;
        color: #ddd;
      }
      
      .event-item:last-child {
        margin-bottom: 0;
      }
      
      .event-item.succession { border-color: #ff5555; }
      .event-item.stemCellActivation { border-color: #55ff55; }
      .event-item.stemCellDeactivation { border-color: #5555ff; }
      .event-item.populationPeak { border-color: #ffff55; }
      .event-item.populationValley { border-color: #ff55ff; }
      .event-item.cloneDominance { border-color: #55ffff; }
      .event-item.boundaryExpansion { border-color: #ff9955; }
      .event-item.boundaryContraction { border-color: #9955ff; }
      .event-item.simulationMilestone { border-color: #ffffff; }
      
      .event-time {
        font-weight: bold;
        margin-right: 5px;
      }
      
      .event-summary {
        display: inline;
      }
      
      .event-details {
        display: none;
        margin-top: 5px;
        padding: 5px;
        background: rgba(40, 40, 40, 0.7);
        border-radius: 3px;
        font-family: monospace;
        font-size: 11px;
        white-space: pre-wrap;
        word-break: break-all;
      }
      
      .event-item.expanded .event-details {
        display: block;
      }
    `;
    
    // Add to document
    document.head.appendChild(style);
  }
  
  /**
   * Update the event list display
   * @private
   */
  _updateEventList() {
    if (!this.eventItems || !this.simulation || !this.simulation.eventLogger) return;
    
    // Clear event items
    this.eventItems.innerHTML = '';
    
    // Get events based on filter
    let events = [];
    
    if (this.selectedEventType === 'all') {
      // Get all events
      const allEvents = this.simulation.eventLogger.getAllEvents();
      Object.keys(allEvents).forEach(type => {
        events.push(...allEvents[type]);
      });
      
      // Sort by time (newest first)
      events.sort((a, b) => {
        const timeA = a.time.totalFrames || 
          (a.time.days * 24 * 60 + a.time.hours * 60 + a.time.minutes);
        const timeB = b.time.totalFrames || 
          (b.time.days * 24 * 60 + b.time.hours * 60 + b.time.minutes);
        return timeB - timeA;
      });
    } else {
      // Get events of specific type
      events = this.simulation.eventLogger.getEvents(this.selectedEventType);
    }
    
    // Apply search filter if needed
    if (this.searchTerm) {
      const searchTerm = this.searchTerm.toLowerCase();
      events = events.filter(event => {
        const eventString = JSON.stringify(event).toLowerCase();
        return eventString.includes(searchTerm);
      });
    }
    
    // Limit to max events
    events = events.slice(0, this.maxEvents);
    
    // Create event items
    events.forEach(event => {
      const item = this._createElement('div', `event-item ${event.type}`, this.eventItems);
      
      // Format time
      const time = event.time;
      const timeStr = `Day ${time.days} - ${Math.floor(time.hours)}:${Math.floor(time.minutes)}`;
      
      // Create event summary based on type
      let summary = '';
      switch (event.type) {
        case 'succession':
          summary = `${event.details.oldClone} → ${event.details.newClone} succession`;
          break;
        case 'stemCellActivation':
          summary = `${event.details.clone} stem cell activated`;
          break;
        case 'stemCellDeactivation':
          summary = `${event.details.clone} stem cell deactivated`;
          break;
        case 'populationPeak':
          summary = `Population peak: ${event.details.value} cells`;
          break;
        case 'populationValley':
          summary = `Population valley: ${event.details.value} cells`;
          break;
        case 'cloneDominance':
          summary = `${event.details.clone} clone dominance (${event.details.percentage}%)`;
          break;
        case 'boundaryExpansion':
          summary = `Boundary expanded to ${Math.round(event.details.radius)}`;
          break;
        case 'boundaryContraction':
          summary = `Boundary contracted to ${Math.round(event.details.radius)}`;
          break;
        case 'simulationMilestone':
          summary = event.details.milestone;
          break;
        default:
          summary = event.type;
      }
      
      // Create time element
      const timeElement = this._createElement('span', 'event-time', item);
      timeElement.textContent = timeStr;
      
      // Create summary element
      const summaryElement = this._createElement('span', 'event-summary', item);
      summaryElement.textContent = summary;
      
      // Create details element
      const detailsElement = this._createElement('div', 'event-details', item);
      detailsElement.textContent = JSON.stringify(event.details, null, 2);
      
      // Add click handler to toggle details
      item.addEventListener('click', () => {
        item.classList.toggle('expanded');
      });
    });
    
    // Show message if no events
    if (events.length === 0) {
      this.eventItems.innerHTML = '<p>No events found.</p>';
    }
  }
  
  /**
   * Update the display
   */
  update() {
    // No need to update on every frame, as we update when events are logged
  }
}

export default EventLogDisplay;