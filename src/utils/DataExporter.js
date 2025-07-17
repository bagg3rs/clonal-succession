/**
 * DataExporter class
 * Handles exporting simulation data in various formats
 */
class DataExporter {
  /**
   * Create a new data exporter
   * @param {Object} options - Configuration options
   * @param {Object} options.simulation - Reference to the simulation
   */
  constructor(options = {}) {
    this.simulation = options.simulation;
  }
  
  /**
   * Export population data as CSV
   * @returns {string} - CSV data as string
   */
  exportPopulationDataCSV() {
    if (!this.simulation) return '';
    
    // Get population history data
    const cellManager = this.simulation.cellManager;
    const cloneHistory = cellManager.getCloneCountHistory();
    const stateHistory = cellManager.getStateCountHistory();
    
    // Create CSV header
    let csv = 'Frame,Total,Red,Green,Yellow,Dividing,NonDividing,Senescent\n';
    
    // Calculate the number of data points (use the length of red clone history)
    const dataPoints = cloneHistory.red.length;
    
    // Create CSV rows
    for (let i = 0; i < dataPoints; i++) {
      const total = cloneHistory.red[i] + cloneHistory.green[i] + cloneHistory.yellow[i];
      
      csv += [
        i,
        total,
        cloneHistory.red[i],
        cloneHistory.green[i],
        cloneHistory.yellow[i],
        stateHistory.dividing[i],
        stateHistory.nonDividing[i],
        stateHistory.senescent[i]
      ].join(',') + '\n';
    }
    
    return csv;
  }
  
  /**
   * Export succession events as JSON
   * @returns {string} - JSON data as string
   */
  exportSuccessionEventsJSON() {
    if (!this.simulation) return '';
    
    // Get succession history
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
    
    // Get succession history
    const stemCellManager = this.simulation.stemCellManager;
    const successionHistory = stemCellManager.getSuccessionHistory();
    
    // Create export object
    const exportData = {
      simulationState: state,
      populationHistory: {
        clones: cloneHistory,
        states: stateHistory
      },
      deathStatistics: deathStats,
      successionHistory: successionHistory,
      exportTime: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
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
    
    // Events JSON button
    const eventsButton = document.createElement('button');
    eventsButton.className = 'export-button';
    eventsButton.textContent = 'Export Events JSON';
    eventsButton.addEventListener('click', () => this.downloadSuccessionEventsJSON());
    buttonContainer.appendChild(eventsButton);
    
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

export default DataExporter;