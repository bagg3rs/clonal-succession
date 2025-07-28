/**
 * StatisticsDisplay class
 * Handles rendering of simulation statistics and population data
 */
class StatisticsDisplay {
  /**
   * Create a new statistics display
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - Container element for the statistics display
   * @param {Object} options.simulation - Reference to the simulation
   */
  constructor(options = {}) {
    this.container = options.container;
    this.simulation = options.simulation;
    
    // Create elements
    this._createElements();
    
    // Initialize data structures
    this.populationData = {
      total: [],
      red: [],
      green: [],
      yellow: []
    };
    
    this.stateData = {
      dividing: [],
      nonDividing: [],
      senescent: []
    };
    
    this.maxDataPoints = 100;
    this.updateInterval = 10; // Update every 10 frames
    this.frameCounter = 0;
    
    // Set up event listeners
    if (this.simulation) {
      this.simulation.on('timeUpdated', (time) => this._updateTimeDisplay(time));
      this.simulation.on('cellCreated', () => this._markForUpdate());
      this.simulation.on('cellDied', () => this._markForUpdate());
      this.simulation.on('successionEvent', (details) => this._handleSuccessionEvent(details));
    }
    
    this.needsUpdate = true;
  }
  
  /**
   * Create the HTML elements for the statistics display
   * @private
   */
  _createElements() {
    if (!this.container) return;
    
    // Clear container
    this.container.innerHTML = '';
    
    // Create main sections
    this.timeDisplay = this._createElement('div', 'stats-time', this.container);
    this.populationDisplay = this._createElement('div', 'stats-population', this.container);
    this.cloneDisplay = this._createElement('div', 'stats-clones', this.container);
    this.stateDisplay = this._createElement('div', 'stats-states', this.container);
    this.cloneDetailsDisplay = this._createElement('div', 'stats-clone-details', this.container);
    this.eventsDisplay = this._createElement('div', 'stats-events', this.container);
    
    // Create time display elements
    this.timeDisplay.innerHTML = '<h3>Simulation Time</h3>';
    this.timeValue = this._createElement('div', 'time-value', this.timeDisplay);
    
    // Create population display elements
    this.populationDisplay.innerHTML = '<h3>Cell Population</h3>';
    this.populationValue = this._createElement('div', 'population-value', this.populationDisplay);
    this.populationChart = this._createElement('canvas', 'population-chart', this.populationDisplay);
    this.populationChart.width = 280;
    this.populationChart.height = 100;
    
    // Create clone display elements
    this.cloneDisplay.innerHTML = '<h3>Clone Distribution</h3>';
    this.cloneChart = this._createElement('canvas', 'clone-chart', this.cloneDisplay);
    this.cloneChart.width = 280;
    this.cloneChart.height = 100;
    this.cloneStatsContainer = this._createElement('div', 'clone-stats-container', this.cloneDisplay);
    
    // Create state display elements
    this.stateDisplay.innerHTML = '<h3>Cell States</h3>';
    this.stateChart = this._createElement('canvas', 'state-chart', this.stateDisplay);
    this.stateChart.width = 280;
    this.stateChart.height = 100;
    
    // Create clone details display elements
    this.cloneDetailsDisplay.innerHTML = '<h3>Clone Details</h3>';
    this.cloneDetailsTable = this._createElement('table', 'clone-details-table', this.cloneDetailsDisplay);
    this.cloneDetailsTable.innerHTML = `
      <thead>
        <tr>
          <th>Clone</th>
          <th>Total</th>
          <th>Dividing</th>
          <th>Non-Dividing</th>
          <th>Senescent</th>
        </tr>
      </thead>
      <tbody>
        <tr class="clone-red">
          <td>Red</td>
          <td>0</td>
          <td>0</td>
          <td>0</td>
          <td>0</td>
        </tr>
        <tr class="clone-green">
          <td>Green</td>
          <td>0</td>
          <td>0</td>
          <td>0</td>
          <td>0</td>
        </tr>
        <tr class="clone-yellow">
          <td>Yellow</td>
          <td>0</td>
          <td>0</td>
          <td>0</td>
          <td>0</td>
        </tr>
      </tbody>
    `;
    
    // Create events display elements
    this.eventsDisplay.innerHTML = '<h3>Succession Events</h3>';
    this.eventsList = this._createElement('div', 'events-list', this.eventsDisplay);
    
    // Add styles
    this._addStyles();
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
   * Add CSS styles for the statistics display
   * @private
   */
  _addStyles() {
    // Check if styles already exist
    if (document.getElementById('statistics-display-styles')) return;
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'statistics-display-styles';
    
    // Add CSS rules
    style.textContent = `
      .stats-time, .stats-population, .stats-clones, .stats-states, .stats-clone-details, .stats-events {
        margin-bottom: 20px;
        padding: 10px;
        background: rgba(30, 30, 30, 0.7);
        border-radius: 5px;
      }
      
      .stats-time h3, .stats-population h3, .stats-clones h3, .stats-states h3, .stats-clone-details h3, .stats-events h3 {
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 16px;
        color: #ccc;
      }
      
      .time-value, .population-value {
        font-size: 18px;
        font-weight: bold;
        color: white;
        margin-bottom: 5px;
      }
      
      .population-chart, .clone-chart, .state-chart {
        width: 100%;
        background: rgba(20, 20, 20, 0.5);
        border-radius: 3px;
      }
      
      .events-list {
        max-height: 150px;
        overflow-y: auto;
        font-size: 12px;
        color: #ddd;
      }
      
      .event-item {
        padding: 5px;
        margin-bottom: 5px;
        border-left: 3px solid;
        background: rgba(40, 40, 40, 0.5);
      }
      
      .event-item.red {
        border-color: #ff4444;
      }
      
      .event-item.green {
        border-color: #44ff44;
      }
      
      .event-item.yellow {
        border-color: #ffff44;
      }
      
      .clone-details-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        color: #ddd;
      }
      
      .clone-details-table th, .clone-details-table td {
        padding: 5px;
        text-align: center;
        border-bottom: 1px solid rgba(100, 100, 100, 0.3);
      }
      
      .clone-details-table th {
        font-weight: bold;
        color: #ccc;
      }
      
      .clone-details-table tr.clone-red td:first-child {
        color: #ff4444;
        font-weight: bold;
      }
      
      .clone-details-table tr.clone-green td:first-child {
        color: #44ff44;
        font-weight: bold;
      }
      
      .clone-details-table tr.clone-yellow td:first-child {
        color: #ffff44;
        font-weight: bold;
      }
      
      .clone-stats-container {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        font-size: 12px;
        color: #ddd;
      }
      
      .clone-stat {
        text-align: center;
      }
      
      .clone-stat-value {
        font-size: 14px;
        font-weight: bold;
      }
      
      .clone-stat-label {
        font-size: 10px;
        color: #aaa;
      }
    `;
    
    // Add to document
    document.head.appendChild(style);
  }
  
  /**
   * Update the statistics display
   */
  update() {
    if (!this.container || !this.simulation) return;
    
    this.frameCounter++;
    
    // Only update at specified interval or when marked for update
    if (this.frameCounter < this.updateInterval && !this.needsUpdate) return;
    
    // Reset counter and update flag
    this.frameCounter = 0;
    this.needsUpdate = false;
    
    // Get current data
    const cellManager = this.simulation.cellManager;
    const stemCellManager = this.simulation.stemCellManager;
    
    // Update population data
    this._updatePopulationData(cellManager);
    
    // Update displays
    this._updatePopulationDisplay(cellManager);
    this._updateCloneDisplay(cellManager);
    this._updateStateDisplay(cellManager);
    this._updateCloneDetailsDisplay(cellManager);
  }
  
  /**
   * Update the clone details display
   * @param {CellLifecycleManager} cellManager - Cell lifecycle manager
   * @private
   */
  _updateCloneDetailsDisplay(cellManager) {
    if (!this.cloneDetailsTable) return;
    
    // Get clone-specific state data
    const cloneStateData = {
      red: {
        total: cellManager.getCellsByClone('red').length,
        dividing: cellManager.getCellsByClone('red').filter(cell => cell.state === 'dividing').length,
        nonDividing: cellManager.getCellsByClone('red').filter(cell => cell.state === 'non-dividing').length,
        senescent: cellManager.getCellsByClone('red').filter(cell => cell.state === 'senescent').length
      },
      green: {
        total: cellManager.getCellsByClone('green').length,
        dividing: cellManager.getCellsByClone('green').filter(cell => cell.state === 'dividing').length,
        nonDividing: cellManager.getCellsByClone('green').filter(cell => cell.state === 'non-dividing').length,
        senescent: cellManager.getCellsByClone('green').filter(cell => cell.state === 'senescent').length
      },
      yellow: {
        total: cellManager.getCellsByClone('yellow').length,
        dividing: cellManager.getCellsByClone('yellow').filter(cell => cell.state === 'dividing').length,
        nonDividing: cellManager.getCellsByClone('yellow').filter(cell => cell.state === 'non-dividing').length,
        senescent: cellManager.getCellsByClone('yellow').filter(cell => cell.state === 'senescent').length
      }
    };
    
    // Use population tracker data if available
    if (this.simulation.populationTracker) {
      const tracker = this.simulation.populationTracker;
      const clonePopulations = tracker.getClonePopulations();
      const cloneStateHistory = tracker.getCloneStateHistory();
      
      if (clonePopulations && cloneStateHistory) {
        // Update with more accurate data from tracker
        Object.keys(cloneStateData).forEach(clone => {
          cloneStateData[clone].total = clonePopulations[clone] || 0;
          
          if (cloneStateHistory[clone]) {
            Object.keys(cloneStateHistory[clone]).forEach(state => {
              const history = cloneStateHistory[clone][state];
              if (history && history.length > 0) {
                const stateKey = state === 'dividing' ? 'dividing' : 
                                (state === 'non-dividing' || state === 'nonDividing') ? 'nonDividing' : 
                                'senescent';
                cloneStateData[clone][stateKey] = history[history.length - 1] || 0;
              }
            });
          }
        });
      }
    }
    
    // Update table cells
    const rows = this.cloneDetailsTable.querySelectorAll('tbody tr');
    if (rows.length >= 3) {
      // Red row
      const redCells = rows[0].querySelectorAll('td');
      if (redCells.length >= 5) {
        redCells[1].textContent = cloneStateData.red.total;
        redCells[2].textContent = cloneStateData.red.dividing;
        redCells[3].textContent = cloneStateData.red.nonDividing;
        redCells[4].textContent = cloneStateData.red.senescent;
      }
      
      // Green row
      const greenCells = rows[1].querySelectorAll('td');
      if (greenCells.length >= 5) {
        greenCells[1].textContent = cloneStateData.green.total;
        greenCells[2].textContent = cloneStateData.green.dividing;
        greenCells[3].textContent = cloneStateData.green.nonDividing;
        greenCells[4].textContent = cloneStateData.green.senescent;
      }
      
      // Yellow row
      const yellowCells = rows[2].querySelectorAll('td');
      if (yellowCells.length >= 5) {
        yellowCells[1].textContent = cloneStateData.yellow.total;
        yellowCells[2].textContent = cloneStateData.yellow.dividing;
        yellowCells[3].textContent = cloneStateData.yellow.nonDividing;
        yellowCells[4].textContent = cloneStateData.yellow.senescent;
      }
    }
    
    // Update clone stats container with additional metrics
    if (this.cloneStatsContainer && this.simulation.populationTracker) {
      const metrics = this.simulation.populationTracker.getMetrics();
      if (metrics) {
        // Clear container
        this.cloneStatsContainer.innerHTML = '';
        
        // Add dominant clone stat
        const dominantClone = metrics.cloneDominance.clone;
        const dominanceValue = Math.round(metrics.cloneDominance.value * 100);
        
        const dominanceStat = this._createElement('div', 'clone-stat', this.cloneStatsContainer);
        dominanceStat.innerHTML = `
          <div class="clone-stat-value" style="color: ${this._getCloneColor(dominantClone)}">
            ${dominantClone} (${dominanceValue}%)
          </div>
          <div class="clone-stat-label">Dominant Clone</div>
        `;
        
        // Add growth rates
        Object.keys(metrics.cloneGrowthRates).forEach(clone => {
          const growthRate = metrics.cloneGrowthRates[clone];
          const growthPercent = Math.round(growthRate * 100);
          const growthText = growthPercent > 0 ? `+${growthPercent}%` : `${growthPercent}%`;
          
          const growthStat = this._createElement('div', 'clone-stat', this.cloneStatsContainer);
          growthStat.innerHTML = `
            <div class="clone-stat-value" style="color: ${this._getCloneColor(clone)}">
              ${growthText}
            </div>
            <div class="clone-stat-label">${clone} Growth</div>
          `;
        });
      }
    }
  }
  
  /**
   * Get color for a specific clone
   * @param {string} clone - Clone identifier
   * @returns {string} - CSS color string
   * @private
   */
  _getCloneColor(clone) {
    switch (clone) {
      case 'red':
        return '#ff4444';
      case 'green':
        return '#44ff44';
      case 'yellow':
        return '#ffff44';
      default:
        return '#ffffff';
    }
  }
  
  /**
   * Mark the display for update
   * @private
   */
  _markForUpdate() {
    this.needsUpdate = true;
  }
  
  /**
   * Update the time display
   * @param {Object} time - Time object from simulation
   * @private
   */
  _updateTimeDisplay(time) {
    if (!this.timeValue) return;
    
    // Format time string
    const days = time.days.toString().padStart(2, '0');
    const hours = Math.floor(time.hours).toString().padStart(2, '0');
    const minutes = Math.floor(time.minutes).toString().padStart(2, '0');
    
    this.timeValue.textContent = `Day ${days} - ${hours}:${minutes}`;
  }
  
  /**
   * Update population data arrays
   * @param {CellLifecycleManager} cellManager - Cell lifecycle manager
   * @private
   */
  _updatePopulationData(cellManager) {
    // Get current counts
    const totalCount = cellManager.getCellCount();
    const redCount = cellManager.getCellsByClone('red').length;
    const greenCount = cellManager.getCellsByClone('green').length;
    const yellowCount = cellManager.getCellsByClone('yellow').length;
    
    const dividingCount = cellManager.getCellsByState('dividing').length;
    const nonDividingCount = cellManager.getCellsByState('non-dividing').length;
    const senescentCount = cellManager.getCellsByState('senescent').length;
    
    // Add to data arrays
    this.populationData.total.push(totalCount);
    this.populationData.red.push(redCount);
    this.populationData.green.push(greenCount);
    this.populationData.yellow.push(yellowCount);
    
    this.stateData.dividing.push(dividingCount);
    this.stateData.nonDividing.push(nonDividingCount);
    this.stateData.senescent.push(senescentCount);
    
    // Trim arrays to max length
    if (this.populationData.total.length > this.maxDataPoints) {
      this.populationData.total.shift();
      this.populationData.red.shift();
      this.populationData.green.shift();
      this.populationData.yellow.shift();
      
      this.stateData.dividing.shift();
      this.stateData.nonDividing.shift();
      this.stateData.senescent.shift();
    }
  }
  
  /**
   * Update the population display
   * @param {CellLifecycleManager} cellManager - Cell lifecycle manager
   * @private
   */
  _updatePopulationDisplay(cellManager) {
    if (!this.populationValue || !this.populationChart) return;
    
    // Update population value
    const totalCount = cellManager.getCellCount();
    const maxCells = this.simulation.parameters.maxCells;
    this.populationValue.textContent = `${totalCount} / ${maxCells} cells`;
    
    // Draw population chart
    const ctx = this.populationChart.getContext('2d');
    ctx.clearRect(0, 0, this.populationChart.width, this.populationChart.height);
    
    // Draw background grid
    this._drawChartGrid(ctx, this.populationChart.width, this.populationChart.height);
    
    // Draw population line
    this._drawLineChart(
      ctx,
      this.populationData.total,
      this.populationChart.width,
      this.populationChart.height,
      maxCells,
      '#ffffff'
    );
  }
  
  /**
   * Update the clone distribution display
   * @param {CellLifecycleManager} cellManager - Cell lifecycle manager
   * @private
   */
  _updateCloneDisplay(cellManager) {
    if (!this.cloneChart) return;
    
    // Draw clone chart
    const ctx = this.cloneChart.getContext('2d');
    ctx.clearRect(0, 0, this.cloneChart.width, this.cloneChart.height);
    
    // Draw background grid
    this._drawChartGrid(ctx, this.cloneChart.width, this.cloneChart.height);
    
    // Get clone data from population controller if available
    let redData = this.populationData.red;
    let greenData = this.populationData.green;
    let yellowData = this.populationData.yellow;
    
    if (this.simulation.populationController) {
      const cloneData = this.simulation.populationController.getClonePopulationData();
      if (cloneData) {
        redData = cloneData.red.length > 0 ? cloneData.red : redData;
        greenData = cloneData.green.length > 0 ? cloneData.green : greenData;
        yellowData = cloneData.yellow.length > 0 ? cloneData.yellow : yellowData;
      }
    }
    
    // Draw clone lines
    const maxCells = this.simulation.parameters.maxCells;
    
    this._drawLineChart(
      ctx,
      redData,
      this.cloneChart.width,
      this.cloneChart.height,
      maxCells,
      '#ff4444'
    );
    
    this._drawLineChart(
      ctx,
      greenData,
      this.cloneChart.width,
      this.cloneChart.height,
      maxCells,
      '#44ff44'
    );
    
    this._drawLineChart(
      ctx,
      yellowData,
      this.cloneChart.width,
      this.cloneChart.height,
      maxCells,
      '#ffff44'
    );
    
    // Draw legend
    this._drawChartLegend(
      ctx,
      this.cloneChart.width,
      this.cloneChart.height,
      [
        { label: 'Red', color: '#ff4444' },
        { label: 'Green', color: '#44ff44' },
        { label: 'Yellow', color: '#ffff44' }
      ]
    );
    
    // Add clone counts as text
    const redCount = redData[redData.length - 1] || 0;
    const greenCount = greenData[greenData.length - 1] || 0;
    const yellowCount = yellowData[yellowData.length - 1] || 0;
    
    ctx.font = '10px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`Red: ${redCount}`, 10, 15);
    ctx.fillText(`Green: ${greenCount}`, 10, 30);
    ctx.fillText(`Yellow: ${yellowCount}`, 10, 45);
  }
  
  /**
   * Update the cell state display
   * @param {CellLifecycleManager} cellManager - Cell lifecycle manager
   * @private
   */
  _updateStateDisplay(cellManager) {
    if (!this.stateChart) return;
    
    // Draw state chart
    const ctx = this.stateChart.getContext('2d');
    ctx.clearRect(0, 0, this.stateChart.width, this.stateChart.height);
    
    // Draw background grid
    this._drawChartGrid(ctx, this.stateChart.width, this.stateChart.height);
    
    // Draw state lines
    const maxCells = this.simulation.parameters.maxCells;
    
    this._drawLineChart(
      ctx,
      this.stateData.dividing,
      this.stateChart.width,
      this.stateChart.height,
      maxCells,
      '#44aaff'
    );
    
    this._drawLineChart(
      ctx,
      this.stateData.nonDividing,
      this.stateChart.width,
      this.stateChart.height,
      maxCells,
      '#aa44ff'
    );
    
    this._drawLineChart(
      ctx,
      this.stateData.senescent,
      this.stateChart.width,
      this.stateChart.height,
      maxCells,
      '#ff8844'
    );
    
    // Draw legend
    this._drawChartLegend(
      ctx,
      this.stateChart.width,
      this.stateChart.height,
      [
        { label: 'Dividing', color: '#44aaff' },
        { label: 'Non-Dividing', color: '#aa44ff' },
        { label: 'Senescent', color: '#ff8844' }
      ]
    );
  }
  
  /**
   * Draw a line chart
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} data - Data array
   * @param {number} width - Chart width
   * @param {number} height - Chart height
   * @param {number} maxValue - Maximum value for scaling
   * @param {string} color - Line color
   * @private
   */
  _drawLineChart(ctx, data, width, height, maxValue, color) {
    if (!data || data.length < 2) return;
    
    const padding = 5;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Calculate scaling factors
    const xScale = chartWidth / (this.maxDataPoints - 1);
    const yScale = chartHeight / maxValue;
    
    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // Move to first point
    const firstX = padding;
    const firstY = height - padding - (data[0] * yScale);
    ctx.moveTo(firstX, firstY);
    
    // Draw line to each point
    for (let i = 1; i < data.length; i++) {
      const x = padding + i * xScale;
      const y = height - padding - (data[i] * yScale);
      ctx.lineTo(x, y);
    }
    
    ctx.stroke();
    
    // Add slight fill
    ctx.lineTo(padding + (data.length - 1) * xScale, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
    ctx.fill();
  }
  
  /**
   * Draw chart grid
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Chart width
   * @param {number} height - Chart height
   * @private
   */
  _drawChartGrid(ctx, width, height) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    ctx.lineWidth = 1;
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += height / 4) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += width / 5) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    
    ctx.stroke();
  }
  
  /**
   * Draw chart legend
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Chart width
   * @param {number} height - Chart height
   * @param {Array} items - Legend items with label and color
   * @private
   */
  _drawChartLegend(ctx, width, height, items) {
    const legendHeight = 15;
    const itemWidth = width / items.length;
    
    items.forEach((item, index) => {
      // Draw color box
      ctx.fillStyle = item.color;
      ctx.fillRect(
        index * itemWidth + 5,
        height - legendHeight,
        10,
        10
      );
      
      // Draw label
      ctx.fillStyle = '#cccccc';
      ctx.font = '10px Arial';
      ctx.fillText(
        item.label,
        index * itemWidth + 20,
        height - legendHeight + 8
      );
    });
  }
  
  /**
   * Handle succession event
   * @param {Object} details - Succession event details
   * @private
   */
  _handleSuccessionEvent(details) {
    if (!this.eventsList) return;
    
    // Create event item
    const eventItem = document.createElement('div');
    eventItem.className = `event-item ${details.newClone}`;
    
    // Format time
    const time = this.simulation.time;
    const timeStr = `Day ${time.days} - ${Math.floor(time.hours)}:${Math.floor(time.minutes)}`;
    
    // Create event text
    eventItem.innerHTML = `
      <strong>${timeStr}</strong>: 
      ${details.oldClone} → ${details.newClone} succession
      (Trigger: ${details.trigger})
    `;
    
    // Add to list
    this.eventsList.insertBefore(eventItem, this.eventsList.firstChild);
    
    // Limit list size
    if (this.eventsList.children.length > 10) {
      this.eventsList.removeChild(this.eventsList.lastChild);
    }
  }
}

export default StatisticsDisplay;