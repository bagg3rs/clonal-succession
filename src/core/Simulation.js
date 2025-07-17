/**
 * Simulation class
 * Main class that integrates all components of the cell succession simulation
 */
import EventEmitter from '../utils/EventEmitter.js';
import CellLifecycleManager from './CellLifecycleManager.js';
import StemCellManager from './StemCellManager.js';
import Cell from './Cell.js';
import StemCell from './StemCell.js';
import StatisticsDisplay from '../utils/StatisticsDisplay.js';
import ParameterManager from '../utils/ParameterManager.js';

class Simulation extends EventEmitter {
  /**
   * Create a new simulation
   * @param {Object} options - Configuration options
   * @param {HTMLCanvasElement} options.canvas - Canvas element for rendering
   * @param {Object} options.parameters - Initial simulation parameters
   */
  constructor(options = {}) {
    super();
    
    this.canvas = options.canvas;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    
    // Default parameters
    this.parameters = {
      maxCells: 100,
      activationThreshold: 0.3,
      divisionLimit: 25,
      suppressionStrength: 1.0,
      senescenceRate: 1.0,
      ...options.parameters
    };
    
    // Simulation state
    this.running = false;
    this.speed = 1;
    this.frameCount = 0;
    
    // Time tracking
    this.time = {
      days: 1,
      hours: 0,
      minutes: 0,
      totalFrames: 0,
      framesPerMinute: 10
    };
    
    // Physics world setup (placeholder - will be initialized in Matter.js)
    this.engine = null;
    this.world = null;
    
    // Boundary
    this.cageCenter = { x: 300, y: 300 };
    this.cageRadius = 14;
    this.minCageRadius = 14;
    this.maxCageRadius = 280;
    this.targetCageRadius = this.cageRadius;
    this.boundaries = [];
    
    // Statistics display
    this.statisticsDisplay = options.statsContainer ? 
      new StatisticsDisplay({
        container: options.statsContainer,
        simulation: this
      }) : null;
      
    // Parameter manager
    this.parameterManager = options.paramsContainer ? 
      new ParameterManager({
        container: options.paramsContainer,
        simulation: this,
        initialParameters: this.parameters
      }) : null;
    
    // Initialize managers with event callbacks
    this.cellManager = new CellLifecycleManager({
      onCellCreated: (cell) => this.emit('cellCreated', cell),
      onCellDivided: (parent, child) => this.emit('cellDivided', parent, child),
      onCellStateChanged: (cell, oldState, newState) => this.emit('cellStateChanged', cell, oldState, newState),
      onCellDied: (cell) => {
        this.emit('cellDied', cell);
        
        // If this was a senescent cell, signal the stem cell manager
        if (cell.state === 'senescent') {
          this.stemCellManager.recordDyingCellSignal();
        }
      }
    });
    
    this.stemCellManager = new StemCellManager({
      onStemCellActivated: (stemCell) => this.emit('stemCellActivated', stemCell),
      onStemCellDeactivated: (stemCell) => this.emit('stemCellDeactivated', stemCell),
      onSuccessionEvent: (details) => this.emit('successionEvent', details)
    });
    
    // Set max cells from parameters
    this.cellManager.maxCells = this.parameters.maxCells;
    
    // Set activation threshold from parameters
    this.stemCellManager.setActivationThreshold(this.parameters.activationThreshold);
  }
  
  /**
   * Initialize the simulation
   */
  init() {
    // Initialize physics engine (placeholder - will be implemented with Matter.js)
    this._initPhysics();
    
    // Create initial boundary
    this._createBoundary();
    
    // Add initial stem cell
    this._addInitialStemCell();
  }
  
  /**
   * Initialize the physics engine
   * @private
   */
  _initPhysics() {
    // This will be implemented with Matter.js
    // Placeholder for now
  }
  
  /**
   * Create the simulation boundary
   * @private
   */
  _createBoundary() {
    // This will be implemented with Matter.js
    // Placeholder for now
  }
  
  /**
   * Add the initial stem cell to start the simulation
   * @private
   */
  _addInitialStemCell() {
    const stemCell = new StemCell(
      this.cageCenter.x,
      this.cageCenter.y,
      this.stemCellManager.getActiveClone(),
      1
    );
    
    // Add to cell manager
    this.cellManager.addCell(stemCell);
    
    // Register with stem cell manager
    this.stemCellManager.registerStemCell(stemCell);
    
    // Set up stem cell creation callback
    this.stemCellManager.setCreateStemCellCallback((clone) => {
      this._createNewStemCell(clone);
    });
  }
  
  /**
   * Create a new stem cell for a specific clone
   * @param {string} clone - Clone identifier (e.g., 'red', 'green', 'yellow')
   * @private
   */
  _createNewStemCell(clone) {
    // Create stem cell near the center
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = (Math.random() - 0.5) * 20;
    
    const stemCell = new StemCell(
      this.cageCenter.x + offsetX,
      this.cageCenter.y + offsetY,
      clone,
      1
    );
    
    // Add to cell manager
    this.cellManager.addCell(stemCell);
    
    // Register with stem cell manager
    this.stemCellManager.registerStemCell(stemCell);
    
    // Emit event
    this.emit('stemCellCreated', stemCell);
  }
  
  /**
   * Start the simulation
   */
  start() {
    if (this.running) return;
    
    this.running = true;
    this.emit('simulationStarted');
    
    // Start the game loop
    this._gameLoop();
  }
  
  /**
   * Stop the simulation
   */
  stop() {
    this.running = false;
    this.emit('simulationStopped');
  }
  
  /**
   * Reset the simulation to initial state
   */
  reset() {
    // Stop the simulation
    this.stop();
    
    // Clear all cells
    this.cellManager.clear();
    
    // Reset boundary
    this.cageRadius = this.minCageRadius;
    this.targetCageRadius = this.cageRadius;
    this._createBoundary();
    
    // Reset time
    this.time = {
      days: 1,
      hours: 0,
      minutes: 0,
      totalFrames: 0,
      framesPerMinute: 10
    };
    
    // Reset frame count
    this.frameCount = 0;
    
    // Re-initialize
    this.init();
    
    // Emit reset event
    this.emit('simulationReset');
    
    // Restart if it was running
    this.start();
  }
  
  /**
   * Set the simulation speed
   * @param {number} speed - Speed multiplier (1 = normal, 2 = 2x, etc.)
   */
  setSpeed(speed) {
    this.speed = speed;
    this.emit('speedChanged', speed);
  }
  
  /**
   * Main game loop
   * @private
   */
  _gameLoop() {
    if (!this.running) return;
    
    // Update physics
    this._updatePhysics();
    
    // Update cells
    this.cellManager.updateCells();
    
    // Process cell divisions
    this.cellManager.processDivisions();
    
    // Update stem cell manager
    this.stemCellManager.updateSuppressionSignal(
      this.cellManager.cells,
      this.parameters.maxCells
    );
    
    // Check for succession events
    this.stemCellManager.checkActivationConditions(
      this.cellManager.cells,
      this.parameters.maxCells
    );
    
    // Update cage expansion
    this._updateCageExpansion();
    
    // Update time
    this._updateTime();
    
    // Render
    this._render();
    
    // Increment frame counter
    this.frameCount++;
    
    // Continue the loop
    requestAnimationFrame(() => this._gameLoop());
  }
  
  /**
   * Update the physics simulation
   * @private
   */
  _updatePhysics() {
    // This will be implemented with Matter.js
    // Placeholder for now
  }
  
  /**
   * Update the cage expansion based on cell population
   * @private
   */
  _updateCageExpansion() {
    // Calculate target cage radius based on cell population
    const cellCount = this.cellManager.getCellCount();
    const maxCells = this.parameters.maxCells;
    
    // Base radius plus expansion based on population
    // Square root scaling provides a more natural growth pattern
    const populationRatio = Math.min(1, cellCount / maxCells);
    const expansionFactor = Math.sqrt(populationRatio);
    
    // Calculate target radius with minimum and maximum constraints
    this.targetCageRadius = this.minCageRadius + 
      (this.maxCageRadius - this.minCageRadius) * expansionFactor;
    
    // Gradually adjust current radius towards target
    const expansionSpeed = 0.05; // Adjust speed as needed
    const difference = this.targetCageRadius - this.cageRadius;
    
    if (Math.abs(difference) > 0.1) {
      this.cageRadius += difference * expansionSpeed;
      
      // Ensure radius stays within bounds
      this.cageRadius = Math.max(
        this.minCageRadius,
        Math.min(this.maxCageRadius, this.cageRadius)
      );
      
      // Update physics boundary (would be implemented with physics system)
      this._updateBoundaryPhysics();
    }
  }
  
  /**
   * Update the physics boundary to match the current cage radius
   * @private
   */
  _updateBoundaryPhysics() {
    // This would be implemented with the physics system
    // For now, just emit an event that the boundary changed
    this.emit('boundaryChanged', this.cageRadius);
  }
  
  /**
   * Update the simulation time
   * @private
   */
  _updateTime() {
    this.time.totalFrames++;
    
    // Calculate time increments based on frames and speed
    const minuteIncrement = this.speed / this.time.framesPerMinute;
    this.time.minutes += minuteIncrement;
    
    // Update hours when minutes reach 60
    if (this.time.minutes >= 60) {
      this.time.hours += Math.floor(this.time.minutes / 60);
      this.time.minutes %= 60;
    }
    
    // Update days when hours reach 24
    if (this.time.hours >= 24) {
      this.time.days += Math.floor(this.time.hours / 24);
      this.time.hours %= 24;
    }
    
    // Emit time update event
    this.emit('timeUpdated', this.time);
  }
  
  /**
   * Render the simulation
   * @private
   */
  _render() {
    if (!this.ctx) return;
    
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render boundary
    this._renderBoundary();
    
    // Render cells
    this._renderCells();
    
    // Render constraints
    this._renderConstraints();
    
    // Render suppression field
    this._renderSuppressionField();
    
    // Update statistics display if available
    if (this.statisticsDisplay) {
      this.statisticsDisplay.update();
    }
  }
  
  /**
   * Render the simulation boundary
   * @private
   */
  _renderBoundary() {
    if (!this.ctx) return;
    
    // Draw the circular boundary
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#555555';
    this.ctx.lineWidth = 2;
    this.ctx.arc(
      this.cageCenter.x,
      this.cageCenter.y,
      this.cageRadius,
      0,
      Math.PI * 2
    );
    this.ctx.stroke();
    
    // Add a subtle glow effect
    const gradient = this.ctx.createRadialGradient(
      this.cageCenter.x,
      this.cageCenter.y,
      this.cageRadius - 5,
      this.cageCenter.x,
      this.cageCenter.y,
      this.cageRadius + 5
    );
    
    gradient.addColorStop(0, 'rgba(85, 85, 85, 0)');
    gradient.addColorStop(0.5, 'rgba(85, 85, 85, 0.2)');
    gradient.addColorStop(1, 'rgba(85, 85, 85, 0)');
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 10;
    this.ctx.arc(
      this.cageCenter.x,
      this.cageCenter.y,
      this.cageRadius,
      0,
      Math.PI * 2
    );
    this.ctx.stroke();
    
    // Draw boundary label
    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = '#888888';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      'Vascular Niche Boundary',
      this.cageCenter.x,
      this.cageCenter.y + this.cageRadius + 20
    );
  }
  
  /**
   * Render all cells
   * @private
   */
  _renderCells() {
    if (!this.ctx) return;
    
    // Get all cells
    const cells = this.cellManager.cells;
    
    // Render cells
    cells.forEach(cell => {
      const position = cell.body ? cell.body.position : { x: 0, y: 0 };
      const radius = cell.isStemCell ? 8 : 6; // Stem cells are slightly larger
      
      // Get cell color based on clone and state
      const color = cell.getColor();
      
      // Draw cell body
      this.ctx.beginPath();
      this.ctx.fillStyle = color;
      this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add border for stem cells
      if (cell.isStemCell) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = cell.isActive ? '#ffffff' : '#888888';
        this.ctx.lineWidth = 2;
        this.ctx.arc(position.x, position.y, radius + 1, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Add divisions left indicator for active stem cells
        if (cell.isActive) {
          const divisionsLeft = cell.getDivisionsLeft();
          const divisionsTotal = 25; // Maximum divisions
          const divisionsRatio = divisionsLeft / divisionsTotal;
          
          // Draw divisions indicator as arc
          this.ctx.beginPath();
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 3;
          this.ctx.arc(
            position.x,
            position.y,
            radius + 3,
            0,
            Math.PI * 2 * divisionsRatio
          );
          this.ctx.stroke();
        }
      }
      
      // Add visual indicator for dividing cells
      if (cell.isDividing) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.arc(position.x, position.y, radius * 1.5, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Add visual indicator for senescent cells
      if (cell.state === 'senescent') {
        // Draw X mark
        const xSize = radius * 0.7;
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(position.x - xSize, position.y - xSize);
        this.ctx.lineTo(position.x + xSize, position.y + xSize);
        this.ctx.moveTo(position.x + xSize, position.y - xSize);
        this.ctx.lineTo(position.x - xSize, position.y + xSize);
        this.ctx.stroke();
      }
      
      // Add visual indicator for newborn cells
      if (cell.isNewborn) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.arc(position.x, position.y, radius * 1.2, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    });
  }
  
  /**
   * Render division constraints
   * @private
   */
  _renderConstraints() {
    if (!this.ctx) return;
    
    // Get constraints from cell manager
    const constraints = this.cellManager.constraints;
    
    // Render each constraint
    constraints.forEach(constraint => {
      const parentCell = constraint.parentCell;
      const childCell = constraint.childCell;
      
      // Skip if either cell is missing or has no body
      if (!parentCell || !childCell || !parentCell.body || !childCell.body) return;
      
      // Get positions
      const parentPos = parentCell.body.position;
      const childPos = childCell.body.position;
      
      // Calculate constraint lifetime percentage
      const lifetime = this.cellManager.constraintRegistry.get(constraint.id) || 0;
      const maxLifetime = this.cellManager.constraintLifetime;
      const lifetimeRatio = lifetime / maxLifetime;
      
      // Draw constraint line with opacity based on lifetime
      this.ctx.beginPath();
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${lifetimeRatio * 0.8})`;
      this.ctx.lineWidth = 2 * lifetimeRatio;
      this.ctx.moveTo(parentPos.x, parentPos.y);
      this.ctx.lineTo(childPos.x, childPos.y);
      this.ctx.stroke();
      
      // Draw small circles at connection points
      const radius = 2 * lifetimeRatio;
      
      // Parent connection point
      this.ctx.beginPath();
      this.ctx.fillStyle = parentCell.getColor();
      this.ctx.arc(parentPos.x, parentPos.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Child connection point
      this.ctx.beginPath();
      this.ctx.fillStyle = childCell.getColor();
      this.ctx.arc(childPos.x, childPos.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  /**
   * Render the suppression field
   * @private
   */
  _renderSuppressionField() {
    if (!this.ctx) return;
    
    // Get suppression level from stem cell manager
    const suppressionLevel = this.stemCellManager.getSuppressionLevel();
    const activeClone = this.stemCellManager.getActiveClone();
    
    // Only render if there's significant suppression
    if (suppressionLevel > 0.1) {
      // Create radial gradient from center
      const gradient = this.ctx.createRadialGradient(
        this.cageCenter.x, this.cageCenter.y, 0,
        this.cageCenter.x, this.cageCenter.y, this.cageRadius * 1.2
      );
      
      // Set gradient colors based on active clone and suppression level
      const alpha = Math.min(0.4, suppressionLevel * 0.5); // Max 40% opacity
      
      // Base colors for each clone
      const cloneColors = {
        red: `rgba(255, 0, 0, ${alpha})`,
        green: `rgba(0, 255, 0, ${alpha})`,
        yellow: `rgba(255, 255, 0, ${alpha})`
      };
      
      // Create gradient
      gradient.addColorStop(0, cloneColors[activeClone]);
      gradient.addColorStop(0.7, `rgba(0, 0, 0, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      // Draw suppression field
      this.ctx.beginPath();
      this.ctx.fillStyle = gradient;
      this.ctx.arc(
        this.cageCenter.x, 
        this.cageCenter.y, 
        this.cageRadius * 1.2, 
        0, 
        Math.PI * 2
      );
      this.ctx.fill();
      
      // Draw suppression level indicator text
      this.ctx.font = '14px Arial';
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        `Suppression: ${Math.round(suppressionLevel * 100)}%`,
        this.cageCenter.x,
        this.cageCenter.y - this.cageRadius - 20
      );
    }
    
    // Render activation progress for dormant stem cells
    this._renderStemCellActivationProgress();
  }
  
  /**
   * Render activation progress for dormant stem cells
   * @private
   */
  _renderStemCellActivationProgress() {
    if (!this.ctx) return;
    
    // Get all stem cells
    const stemCells = this.cellManager.getStemCells();
    
    // Render activation progress for dormant stem cells
    stemCells.forEach(stemCell => {
      if (!stemCell.isActive && stemCell.getActivationProgress() > 0) {
        const progress = stemCell.getActivationProgress();
        const position = stemCell.body ? stemCell.body.position : { x: 0, y: 0 };
        
        // Draw activation progress ring
        this.ctx.beginPath();
        this.ctx.strokeStyle = stemCell.getColor();
        this.ctx.lineWidth = 2;
        this.ctx.arc(
          position.x,
          position.y,
          10, // Radius slightly larger than cell
          0,
          Math.PI * 2 * progress // Arc length based on progress
        );
        this.ctx.stroke();
      }
    });
  }
  
  /**
   * Set a simulation parameter
   * @param {string} name - Parameter name
   * @param {any} value - Parameter value
   */
  setParameter(name, value) {
    if (this.parameters.hasOwnProperty(name)) {
      this.parameters[name] = value;
      
      // Update related components
      if (name === 'maxCells') {
        this.cellManager.maxCells = value;
      } else if (name === 'activationThreshold') {
        this.stemCellManager.setActivationThreshold(value);
      }
      
      // Emit parameter change event
      this.emit('parameterChanged', name, value);
    }
  }
  
  /**
   * Get a simulation parameter
   * @param {string} name - Parameter name
   * @returns {any} - Parameter value
   */
  getParameter(name) {
    return this.parameters[name];
  }
  
  /**
   * Get the current simulation state
   * @returns {Object} - Simulation state object
   */
  getState() {
    return {
      running: this.running,
      speed: this.speed,
      time: { ...this.time },
      cellCount: this.cellManager.getCellCount(),
      activeClone: this.stemCellManager.getActiveClone(),
      suppressionLevel: this.stemCellManager.getSuppressionLevel(),
      cageRadius: this.cageRadius,
      parameters: { ...this.parameters }
    };
  }
}

// Export the Simulation class
export default Simulation;