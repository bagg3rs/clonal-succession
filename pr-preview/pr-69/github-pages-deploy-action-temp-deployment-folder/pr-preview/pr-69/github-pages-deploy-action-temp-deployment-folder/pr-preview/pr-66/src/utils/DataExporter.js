/**
 * DataExporter class
 * Handles exporting simulation data in various formats
 */
class DataExporter {
  /**
   * Create a new data exporter
   * @param {Object} options - Configuration options
   * @param {Object} options.simulation - Reference to the simulation
   * @param {Object} options.config - Exporter configuration
   */
  constructor(options = {}) {
    this.simulation = options.simulation;
    this.config = {
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm:ss',
      includeHeaders: true,
      ...options.config
    };
    
    // Track export history
    this.exportHistory = [];
  }
  
  /**
   * Export population data as CSV
   * @param {Object} options - Export options
   * @param {boolean} options.includeTimeInfo - Include time information in export
   * @param {boolean} options.includeHeaders - Include headers in CSV
   * @returns {string} - CSV data as string
   */
  exportPopulationDataCSV(options = {}) {
    if (!this.simulation) return '';
    
    const includeTimeInfo = options.includeTimeInfo !== undefined ? options.includeTimeInfo : true;
    const includeHeaders = options.includeHeaders !== undefined ? options.includeHeaders : this.config.includeHeaders;
    
    // Get population history data
    const cellManager = this.simulation.cellManager;
    const cloneHistory = cellManager.getCloneCountHistory();
    const stateHistory = cellManager.getStateCountHistory();
    
    // Get time data if available
    const timeHistory = this.simulation.getTimeHistory ? this.simulation.getTimeHistory() : null;
    
    // Create CSV header
    let csv = '';
    if (includeHeaders) {
      let header = includeTimeInfo ? 'Frame,Day,Hour,Minute,' : 'Frame,';
      header += 'Total,Red,Green,Yellow,Dividing,NonDividing,Senescent';
      csv += header + '\n';
    }
    
    // Calculate the number of data points (use the length of red clone history)
    const dataPoints = cloneHistory.red.length;
    
    // Create CSV rows
    for (let i = 0; i < dataPoints; i++) {
      const total = cloneHistory.red[i] + cloneHistory.green[i] + cloneHistory.yellow[i];
      
      let row = [i];
      
      // Add time information if available and requested
      if (includeTimeInfo && timeHistory && timeHistory[i]) {
        row.push(
          timeHistory[i].days,
          timeHistory[i].hours,
          timeHistory[i].minutes
        );
      } else if (includeTimeInfo) {
        row.push('', '', ''); // Empty placeholders for time data
      }
      
      // Add population data
      row.push(
        total,
        cloneHistory.red[i],
        cloneHistory.green[i],
        cloneHistory.yellow[i],
        stateHistory.dividing[i],
        stateHistory.nonDividing[i],
        stateHistory.senescent[i]
      );
      
      csv += row.join(',') + '\n';
    }
    
    // Track export in history
    this._trackExport('population-csv', dataPoints);
    
    return csv;
  }
  
  /**
   * Export succession events as JSON
   * @returns {string} - JSON data as string
   */
  exportSuccessionEventsJSON() {
    if (!this.simulation) return '';
    
    // Use EventLogger if available
    if (this.simulation.eventLogger) {
      return this.simulation.eventLogger.exportEventsJSON('succession');
    }
    
    // Fallback to old method if EventLogger is not available
    const stemCellManager = this.simulation.stemCellManager;
    const successionHistory = stemCellManager.getSuccessionHistory();
    
    // Format events for export
    const formattedEvents = successionHistory.map(event => {
      return {
        time: event.time,
        oldClone: event.oldClone,
        newClone: event.newClone,
        populationBefore: event.populationBefore,
        cloneCountsBefore: event.cloneCountsBefore,
        trigger: event.trigger
      };
    });
    
    return JSON.stringify({
      simulationParameters: this.simulation.parameters,
      events: formattedEvents
    }, null, 2);
  }
  
  /**
   * Export complete simulation state as JSON
   * @returns {string} - JSON data as string
   */
  exportSimulationStateJSON() {
    if (!this.simulation) return '';
    
    // Get current simulation state
    const state = this.simulation.getState();
    
    // Get population history
    const cellManager = this.simulation.cellManager;
    const cloneHistory = cellManager.getCloneCountHistory();
    const stateHistory = cellManager.getStateCountHistory();
    const deathStats = cellManager.getDeathStatistics();
    
    // Get event data from EventLogger if available
    let eventData = {};
    if (this.simulation.eventLogger) {
      eventData = this.simulation.eventLogger.getAllEvents();
    } else {
      // Fallback to old method
      const stemCellManager = this.simulation.stemCellManager;
      eventData = {
        succession: stemCellManager.getSuccessionHistory() || []
      };
    }
    
    // Create export object
    const exportData = {
      simulationState: state,
      populationHistory: {
        clones: cloneHistory,
        states: stateHistory
      },
      deathStatistics: deathStats,
      events: eventData,
      exportTime: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Export all events as JSON
   * @param {Object} options - Export options
   * @param {boolean} options.includeMetadata - Include metadata in export
   * @param {boolean} options.prettyPrint - Format JSON with indentation
   * @returns {string} - JSON data as string
   */
  exportAllEventsJSON(options = {}) {
    if (!this.simulation) return '';
    
    const includeMetadata = options.includeMetadata !== undefined ? options.includeMetadata : true;
    const prettyPrint = options.prettyPrint !== undefined ? options.prettyPrint : true;
    const indent = prettyPrint ? 2 : 0;
    
    // Use EventLogger if available
    let eventData;
    if (this.simulation.eventLogger) {
      eventData = this.simulation.eventLogger.getAllEvents();
    } else {
      // Fallback to just succession events if EventLogger is not available
      const stemCellManager = this.simulation.stemCellManager;
      eventData = {
        succession: stemCellManager.getSuccessionHistory() || []
      };
    }
    
    // Create export object
    const exportData = includeMetadata ? {
      simulationParameters: this.simulation.parameters,
      simulationTime: { ...this.simulation.time },
      exportTime: new Date().toISOString(),
      events: eventData
    } : eventData;
    
    // Track export in history
    this._trackExport('events-json', Object.values(eventData).flat().length);
    
    return JSON.stringify(exportData, null, indent);
  }
  
  /**
   * Export event statistics as JSON
   * @returns {string} - JSON data as string
   */
  exportEventStatisticsJSON() {
    if (!this.simulation || !this.simulation.eventLogger) return '';
    
    const stats = this.simulation.eventLogger.getEventStatistics();
    
    // Track export in history
    this._trackExport('event-statistics-json', 1);
    
    return JSON.stringify(stats, null, 2);
  }
  
  /**
   * Download data as a file
   * @param {string} data - Data to download
   * @param {string} filename - Filename
   * @param {string} type - MIME type
   */
  downloadFile(data, filename, type) {
    // Create blob
    const blob = new Blob([data], { type });
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  }
  
  /**
   * Export population data as CSV and download
   */
  downloadPopulationCSV() {
    const data = this.exportPopulationDataCSV();
    const date = new Date().toISOString().split('T')[0];
    this.downloadFile(data, `clonal-succession-population-${date}.csv`, 'text/csv');
  }
  
  /**
   * Export succession events as JSON and download
   */
  downloadSuccessionEventsJSON() {
    const data = this.exportSuccessionEventsJSON();
    const date = new Date().toISOString().split('T')[0];
    this.downloadFile(data, `clonal-succession-events-${date}.json`, 'application/json');
  }
  
  /**
   * Export complete simulation state as JSON and download
   */
  downloadSimulationStateJSON() {
    const data = this.exportSimulationStateJSON();
    const date = new Date().toISOString().split('T')[0];
    this.downloadFile(data, `clonal-succession-state-${date}.json`, 'application/json');
  }
  
  /**
   * Create export UI controls
   * @param {HTMLElement} container - Container element for export controls
   */
  createExportUI(container) {
    if (!container) return;
    
    // Create export section
    const exportSection = document.createElement('div');
    exportSection.className = 'export-section';
    exportSection.innerHTML = '<h3>Export Data</h3>';
    
    // Create export buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'export-button-container';
    
    // Population CSV button
    const csvButton = document.createElement('button');
    csvButton.className = 'export-button';
    csvButton.textContent = 'Export Population CSV';
    csvButton.addEventListener('click', () => this.downloadPopulationCSV());
    buttonContainer.appendChild(csvButton);
    
    // Succession Events JSON button
    const successionButton = document.createElement('button');
    successionButton.className = 'export-button';
    successionButton.textContent = 'Export Succession Events';
    successionButton.addEventListener('click', () => this.downloadSuccessionEventsJSON());
    buttonContainer.appendChild(successionButton);
    
    // All Events JSON button
    const allEventsButton = document.createElement('button');
    allEventsButton.className = 'export-button';
    allEventsButton.textContent = 'Export All Events';
    allEventsButton.addEventListener('click', () => {
      const data = this.exportAllEventsJSON();
      const date = new Date().toISOString().split('T')[0];
      this.downloadFile(data, `clonal-succession-all-events-${date}.json`, 'application/json');
    });
    buttonContainer.appendChild(allEventsButton);
    
    // Full state JSON button
    const stateButton = document.createElement('button');
    stateButton.className = 'export-button';
    stateButton.textContent = 'Export Full State';
    stateButton.addEventListener('click', () => this.downloadSimulationStateJSON());
    buttonContainer.appendChild(stateButton);
    
    exportSection.appendChild(buttonContainer);
    container.appendChild(exportSection);
    
    // Add styles
    this._addStyles();
  }
  
  /**
   * Add CSS styles for export UI
   * @private
   */
  _addStyles() {
    // Check if styles already exist
    if (document.getElementById('data-exporter-styles')) return;
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'data-exporter-styles';
    
    // Add CSS rules
    style.textContent = `
      .export-section {
        margin-top: 20px;
        padding: 10px;
        background: rgba(30, 30, 30, 0.7);
        border-radius: 5px;
      }
      
      .export-section h3 {
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 16px;
        color: #ccc;
      }
      
      .export-button-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      
      .export-button {
        padding: 8px 12px;
        background: #2a6b9c;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .export-button:hover {
        background: #3a7bac;
      }
    `;
    
    // Add to document
    document.head.appendChild(style);
  }
}

export default DataExporter;  /**
  
 * Track an export operation in history
   * @param {string} type - Type of export
   * @param {number} recordCount - Number of records exported
   * @private
   */
  _trackExport(type, recordCount) {
    this.exportHistory.push({
      type,
      recordCount,
      timestamp: new Date().toISOString(),
      simulationTime: this.simulation ? { ...this.simulation.time } : null
    });
    
    // Limit history size
    if (this.exportHistory.length > 50) {
      this.exportHistory.shift();
    }
  }
  
  /**
   * Get export history
   * @returns {Array} - Export history
   */
  getExportHistory() {
    return [...this.exportHistory];
  }
  
  /**
   * Export clone-specific data as CSV
   * @param {string} clone - Clone identifier ('red', 'green', or 'yellow')
   * @returns {string} - CSV data as string
   */
  exportCloneDataCSV(clone) {
    if (!this.simulation || !this.simulation.cellManager) return '';
    
    // Validate clone
    if (!['red', 'green', 'yellow'].includes(clone)) {
      console.warn(`Invalid clone: ${clone}`);
      return '';
    }
    
    // Get population history data
    const cellManager = this.simulation.cellManager;
    const cloneHistory = cellManager.getCloneCountHistory();
    const stateHistory = cellManager.getStateCountHistory();
    
    // Get clone-specific state history if available
    const cloneStateHistory = cellManager.getCloneStateHistory ? 
      cellManager.getCloneStateHistory(clone) : null;
    
    // Create CSV header
    let csv = 'Frame,Total';
    
    if (cloneStateHistory) {
      csv += ',Dividing,NonDividing,Senescent';
    }
    
    csv += '\n';
    
    // Calculate the number of data points
    const dataPoints = cloneHistory[clone].length;
    
    // Create CSV rows
    for (let i = 0; i < dataPoints; i++) {
      let row = [i, cloneHistory[clone][i]];
      
      // Add state data if available
      if (cloneStateHistory) {
        row.push(
          cloneStateHistory.dividing[i] || 0,
          cloneStateHistory.nonDividing[i] || 0,
          cloneStateHistory.senescent[i] || 0
        );
      }
      
      csv += row.join(',') + '\n';
    }
    
    // Track export in history
    this._trackExport(`clone-${clone}-csv`, dataPoints);
    
    return csv;
  }
  
  /**
   * Export clone-specific data as CSV and download
   * @param {string} clone - Clone identifier ('red', 'green', or 'yellow')
   */
  downloadCloneDataCSV(clone) {
    const data = this.exportCloneDataCSV(clone);
    const date = new Date().toISOString().split('T')[0];
    this.downloadFile(data, `clonal-succession-${clone}-clone-${date}.csv`, 'text/csv');
  }
  
  /**
   * Export event statistics as JSON and download
   */
  downloadEventStatisticsJSON() {
    const data = this.exportEventStatisticsJSON();
    const date = new Date().toISOString().split('T')[0];
    this.downloadFile(data, `clonal-succession-event-statistics-${date}.json`, 'application/json');
  }
  
  /**
   * Create enhanced export UI controls with more options
   * @param {HTMLElement} container - Container element for export controls
   */
  createEnhancedExportUI(container) {
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create export section
    const exportSection = document.createElement('div');
    exportSection.className = 'export-section';
    exportSection.innerHTML = '<h3>Export Data</h3>';
    
    // Create tabs for different export types
    const tabContainer = document.createElement('div');
    tabContainer.className = 'export-tabs';
    
    const populationTab = document.createElement('div');
    populationTab.className = 'export-tab active';
    populationTab.textContent = 'Population';
    populationTab.dataset.tab = 'population';
    
    const eventsTab = document.createElement('div');
    eventsTab.className = 'export-tab';
    eventsTab.textContent = 'Events';
    eventsTab.dataset.tab = 'events';
    
    const stateTab = document.createElement('div');
    stateTab.className = 'export-tab';
    stateTab.textContent = 'State';
    stateTab.dataset.tab = 'state';
    
    tabContainer.appendChild(populationTab);
    tabContainer.appendChild(eventsTab);
    tabContainer.appendChild(stateTab);
    
    exportSection.appendChild(tabContainer);
    
    // Create tab content containers
    const tabContents = document.createElement('div');
    tabContents.className = 'export-tab-contents';
    
    // Population tab content
    const populationContent = document.createElement('div');
    populationContent.className = 'export-tab-content active';
    populationContent.dataset.tab = 'population';
    
    // Population export options
    populationContent.innerHTML = `
      <div class="export-options">
        <div class="export-option">
          <label>
            <input type="checkbox" id="includeTimeInfo" checked>
            Include time information
          </label>
        </div>
        <div class="export-option">
          <label>
            <input type="checkbox" id="includeHeaders" checked>
            Include headers
          </label>
        </div>
      </div>
    `;
    
    // Population export buttons
    const populationButtons = document.createElement('div');
    populationButtons.className = 'export-button-container';
    
    // All population data button
    const allPopulationButton = document.createElement('button');
    allPopulationButton.className = 'export-button';
    allPopulationButton.textContent = 'Export All Population Data';
    allPopulationButton.addEventListener('click', () => {
      const includeTimeInfo = document.getElementById('includeTimeInfo').checked;
      const includeHeaders = document.getElementById('includeHeaders').checked;
      
      const data = this.exportPopulationDataCSV({
        includeTimeInfo,
        includeHeaders
      });
      
      const date = new Date().toISOString().split('T')[0];
      this.downloadFile(data, `clonal-succession-population-${date}.csv`, 'text/csv');
    });
    populationButtons.appendChild(allPopulationButton);
    
    // Clone-specific buttons
    ['red', 'green', 'yellow'].forEach(clone => {
      const cloneButton = document.createElement('button');
      cloneButton.className = `export-button export-button-${clone}`;
      cloneButton.textContent = `Export ${clone.charAt(0).toUpperCase() + clone.slice(1)} Clone Data`;
      cloneButton.addEventListener('click', () => this.downloadCloneDataCSV(clone));
      populationButtons.appendChild(cloneButton);
    });
    
    populationContent.appendChild(populationButtons);
    
    // Events tab content
    const eventsContent = document.createElement('div');
    eventsContent.className = 'export-tab-content';
    eventsContent.dataset.tab = 'events';
    
    // Events export options
    eventsContent.innerHTML = `
      <div class="export-options">
        <div class="export-option">
          <label>
            <input type="checkbox" id="includeMetadata" checked>
            Include metadata
          </label>
        </div>
        <div class="export-option">
          <label>
            <input type="checkbox" id="prettyPrint" checked>
            Pretty print JSON
          </label>
        </div>
      </div>
    `;
    
    // Events export buttons
    const eventsButtons = document.createElement('div');
    eventsButtons.className = 'export-button-container';
    
    // All events button
    const allEventsButton = document.createElement('button');
    allEventsButton.className = 'export-button';
    allEventsButton.textContent = 'Export All Events';
    allEventsButton.addEventListener('click', () => {
      const includeMetadata = document.getElementById('includeMetadata').checked;
      const prettyPrint = document.getElementById('prettyPrint').checked;
      
      const data = this.exportAllEventsJSON({
        includeMetadata,
        prettyPrint
      });
      
      const date = new Date().toISOString().split('T')[0];
      this.downloadFile(data, `clonal-succession-all-events-${date}.json`, 'application/json');
    });
    eventsButtons.appendChild(allEventsButton);
    
    // Succession events button
    const successionButton = document.createElement('button');
    successionButton.className = 'export-button';
    successionButton.textContent = 'Export Succession Events';
    successionButton.addEventListener('click', () => this.downloadSuccessionEventsJSON());
    eventsButtons.appendChild(successionButton);
    
    // Event statistics button
    const statsButton = document.createElement('button');
    statsButton.className = 'export-button';
    statsButton.textContent = 'Export Event Statistics';
    statsButton.addEventListener('click', () => this.downloadEventStatisticsJSON());
    eventsButtons.appendChild(statsButton);
    
    eventsContent.appendChild(eventsButtons);
    
    // State tab content
    const stateContent = document.createElement('div');
    stateContent.className = 'export-tab-content';
    stateContent.dataset.tab = 'state';
    
    // State export buttons
    const stateButtons = document.createElement('div');
    stateButtons.className = 'export-button-container';
    
    // Full state button
    const fullStateButton = document.createElement('button');
    fullStateButton.className = 'export-button';
    fullStateButton.textContent = 'Export Full Simulation State';
    fullStateButton.addEventListener('click', () => this.downloadSimulationStateJSON());
    stateButtons.appendChild(fullStateButton);
    
    stateContent.appendChild(stateButtons);
    
    // Add tab contents to container
    tabContents.appendChild(populationContent);
    tabContents.appendChild(eventsContent);
    tabContents.appendChild(stateContent);
    
    exportSection.appendChild(tabContents);
    container.appendChild(exportSection);
    
    // Add tab switching functionality
    const tabs = exportSection.querySelectorAll('.export-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        exportSection.querySelectorAll('.export-tab').forEach(t => t.classList.remove('active'));
        exportSection.querySelectorAll('.export-tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        exportSection.querySelector(`.export-tab-content[data-tab="${tab.dataset.tab}"]`).classList.add('active');
      });
    });
    
    // Add enhanced styles
    this._addEnhancedStyles();
  }
  
  /**
   * Add enhanced CSS styles for export UI
   * @private
   */
  _addEnhancedStyles() {
    // Check if enhanced styles already exist
    if (document.getElementById('data-exporter-enhanced-styles')) return;
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'data-exporter-enhanced-styles';
    
    // Add CSS rules
    style.textContent = `
      .export-section {
        margin-top: 20px;
        padding: 15px;
        background: rgba(30, 30, 30, 0.7);
        border-radius: 5px;
      }
      
      .export-section h3 {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 18px;
        color: #ccc;
        border-bottom: 1px solid rgba(100, 100, 100, 0.3);
        padding-bottom: 8px;
      }
      
      .export-tabs {
        display: flex;
        margin-bottom: 15px;
      }
      
      .export-tab {
        padding: 8px 15px;
        background: rgba(50, 50, 50, 0.5);
        border-radius: 3px;
        margin-right: 10px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .export-tab:hover {
        background: rgba(70, 70, 70, 0.5);
      }
      
      .export-tab.active {
        background: #2a6b9c;
        color: white;
      }
      
      .export-tab-content {
        display: none;
      }
      
      .export-tab-content.active {
        display: block;
      }
      
      .export-options {
        margin-bottom: 15px;
        padding: 10px;
        background: rgba(40, 40, 40, 0.5);
        border-radius: 3px;
      }
      
      .export-option {
        margin-bottom: 8px;
      }
      
      .export-option:last-child {
        margin-bottom: 0;
      }
      
      .export-option label {
        display: flex;
        align-items: center;
        cursor: pointer;
      }
      
      .export-option input[type="checkbox"] {
        margin-right: 8px;
      }
      
      .export-button-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      
      .export-button {
        padding: 8px 12px;
        background: #2a6b9c;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      
      .export-button:hover {
        background: #3a7bac;
      }
      
      .export-button-red {
        background: #9c2a2a;
      }
      
      .export-button-red:hover {
        background: #ac3a3a;
      }
      
      .export-button-green {
        background: #2a9c2a;
      }
      
      .export-button-green:hover {
        background: #3aac3a;
      }
      
      .export-button-yellow {
        background: #9c9c2a;
      }
      
      .export-button-yellow:hover {
        background: #acac3a;
      }
    `;
    
    // Add to document
    document.head.appendChild(style);
  }