/**
 * Simulation class
 * Main class that integrates all components of the cell succession simulation
 */
import EventEmitter from '../utils/EventEmitter.js';
import CellLifecycleManager from './CellLifecycleManager.js';
import StemCellManager from './StemCellManager.js';
import PopulationController from './PopulationController.js';
import Cell from './Cell.js';
import StemCell from './StemCell.js';
import StatisticsDisplay from '../utils/StatisticsDisplay.js';
import ParameterManager from '../utils/ParameterManager.js';
import PopulationTracker from '../utils/PopulationTracker.js';
import ParameterWarningSystem from '../utils/ParameterWarningSystem.js';

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
        if (cell.state === Cell.States.SENESCENT) {
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
    
    // Initialize population controller
    this.populationController = new PopulationController({
      simulation: this,
      cellManager: this.cellManager,
      stemCellManager: this.stemCellManager,
      targetPopulation: this.parameters.maxCells
    });
    
    // Initialize population tracker
    this.populationTracker = new PopulationTracker({
      simulation: this
    });
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
   * Set a simulation parameter
   * @param {string} key - Parameter key
   * @param {any} value - Parameter value
   */
  setParameter(key, value) {
    // Update parameter value
    if (this.parameters.hasOwnProperty(key)) {
      this.parameters[key] = value;
      
      // Apply parameter to appropriate component
      switch (key) {
        case 'maxCells':
          this.cellManager.maxCells = value;
          if (this.populationController) {
            this.populationController.setTargetPopulation(value);
          }
          break;
          
        case 'activationThreshold':
          if (this.stemCellManager) {
            this.stemCellManager.setActivationThreshold(value);
          }
          break;
          
        case 'divisionLimit':
          // This will be applied to new stem cells
          break;
          
        case 'suppressionStrength':
          if (this.stemCellManager) {
            this.stemCellManager.setSuppressionStrength(value);
          }
          break;
          
        case 'senescenceRate':
          if (this.cellManager) {
            this.cellManager.setSenescenceRate(value);
          }
          break;
          
        case 'cellLifespan':
          // This will be applied to new cells
          break;
      }
      
      // Emit parameter changed event
      this.emit('parameterChanged', { key, value });
    }
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
    
    // Update population controller
    if (this.populationController) {
      this.populationController.update();
    }
    
    // Update population tracker
    if (this.populationTracker) {
      this.populationTracker.update();
    }
    
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
   * Update the cage expansion based on cell population and distribution
   * @private
   */
  _updateCageExpansion() {
    // Calculate target cage radius based on cell population
    const cellCount = this.cellManager.getCellCount();
    const maxCells = this.parameters.maxCells;
    
    // Base radius plus expansion based on population
    // Square root scaling provides a more natural growth pattern
    const populationRatio = Math.min(1, cellCount / maxCells);
    const baseExpansionFactor = Math.sqrt(populationRatio);
    
    // Calculate cell pressure on the boundary
    const cellPressure = this._calculateCellPressure();
    
    // Adjust expansion factor based on cell pressure
    // Higher pressure = faster expansion
    const pressureAdjustment = cellPressure * 0.3; // Scale the pressure effect
    const expansionFactor = baseExpansionFactor + pressureAdjustment;
    
    // Calculate target radius with minimum and maximum constraints
    this.targetCageRadius = this.minCageRadius + 
      (this.maxCageRadius - this.minCageRadius) * expansionFactor;
    
    // Dynamic expansion speed based on pressure
    // Higher pressure = faster expansion
    const baseExpansionSpeed = 0.05;
    const expansionSpeed = baseExpansionSpeed * (1 + cellPressure * 2);
    
    // Calculate difference between current and target radius
    const difference = this.targetCageRadius - this.cageRadius;
    
    // Apply resistance when expanding (harder to expand than contract)
    const adjustedDifference = difference > 0 
      ? difference * (1 - 0.3 * populationRatio) // Resistance increases with population
      : difference * 1.2; // Faster contraction when population decreases
    
    if (Math.abs(difference) > 0.1) {
      // Apply the change with dynamic speed
      this.cageRadius += adjustedDifference * expansionSpeed;
      
      // Ensure radius stays within bounds
      this.cageRadius = Math.max(
        this.minCageRadius,
        Math.min(this.maxCageRadius, this.cageRadius)
      );
      
      // Update physics boundary
      this._updateBoundaryPhysics();
      
      // Emit event with pressure information
      this.emit('cageExpansion', {
        radius: this.cageRadius,
        targetRadius: this.targetCageRadius,
        cellPressure: cellPressure,
        populationRatio: populationRatio,
        time: Date.now()
      });
    }
  }
  
  /**
   * Calculate the pressure exerted by cells on the boundary
   * @returns {number} - Pressure factor (0-1)
   * @private
   */
  _calculateCellPressure() {
    // Get all cells
    const cells = this.cellManager.cells;
    if (cells.length === 0) return 0;
    
    // Count cells near the boundary
    const boundaryThreshold = this.cageRadius * 0.15; // 15% of radius
    let cellsNearBoundary = 0;
    
    cells.forEach(cell => {
      if (!cell.body) return;
      
      // Calculate distance from center
      const dx = cell.body.position.x - this.cageCenter.x;
      const dy = cell.body.position.y - this.cageCenter.y;
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate distance from boundary
      const distanceFromBoundary = this.cageRadius - distanceFromCenter;
      
      // Count cells near boundary
      if (distanceFromBoundary < boundaryThreshold) {
        // Weight by proximity to boundary (closer = more pressure)
        const proximityFactor = 1 - (distanceFromBoundary / boundaryThreshold);
        cellsNearBoundary += proximityFactor;
      }
    });
    
    // Calculate pressure as ratio of cells near boundary to total cells
    // Scale to ensure reasonable values
    const pressureFactor = Math.min(1.0, cellsNearBoundary / (cells.length * 0.3));
    
    return pressureFactor;
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
    
    // First render division connections between cells
    this._renderDivisionConnections(cells);
    
    // Render cells
    cells.forEach(cell => {
      const position = cell.body ? cell.body.position : { x: 0, y: 0 };
      let baseRadius = cell.isStemCell ? 8 : 6; // Stem cells are slightly larger
      
      // Apply state-specific size adjustments if available
      if (cell.visualProperties && cell.visualProperties.sizeMultiplier) {
        baseRadius *= cell.visualProperties.sizeMultiplier;
      }
      
      // Apply death effect size adjustments if dying
      if (cell.isDying && cell.deathEffectProperties) {
        baseRadius *= cell.deathEffectProperties.scale;
      }
      
      // Get cell color based on clone and state
      const color = cell.getColor();
      
      // Apply opacity if available
      let opacity = cell.visualProperties && cell.visualProperties.opacity !== undefined ? 
        cell.visualProperties.opacity : 1.0;
        
      // Apply death effect opacity if dying
      if (cell.isDying && cell.deathEffectProperties) {
        opacity *= cell.deathEffectProperties.opacity;
      }
      
      // Draw death effect particles if cell is dying
      if (cell.isDying && cell.deathEffectProperties) {
        this._renderDeathEffectParticles(cell, position, baseRadius, color);
      }
      
      // Draw cell glow effect for state transitions
      if (cell.stateTransitionEffect && cell.visualProperties && cell.visualProperties.glowColor) {
        const glowRadius = baseRadius * 1.5;
        const glowColor = cell.visualProperties.glowColor;
        const glowIntensity = cell.visualProperties.glowIntensity || 0.5;
        
        // Create radial gradient for glow
        const gradient = this.ctx.createRadialGradient(
          position.x, position.y, baseRadius,
          position.x, position.y, glowRadius
        );
        
        gradient.addColorStop(0, `${glowColor}${Math.floor(glowIntensity * 99).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${glowColor}00`);
        
        // Draw glow
        this.ctx.beginPath();
        this.ctx.fillStyle = gradient;
        this.ctx.arc(position.x, position.y, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      // Draw division effect glow if cell is dividing
      if (cell.divisionEffectProperties && cell.divisionEffectProperties.active) {
        const glowRadius = baseRadius * 2;
        const glowColor = this._getCloneColor(cell.clone);
        const glowIntensity = cell.divisionEffectProperties.glowIntensity || 0.5;
        
        // Create radial gradient for division glow
        const gradient = this.ctx.createRadialGradient(
          position.x, position.y, baseRadius,
          position.x, position.y, glowRadius
        );
        
        gradient.addColorStop(0, `${glowColor}${Math.floor(glowIntensity * 99).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${glowColor}00`);
        
        // Draw division glow
        this.ctx.beginPath();
        this.ctx.fillStyle = gradient;
        this.ctx.arc(position.x, position.y, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Update division effect time
        cell.divisionEffectTime = (cell.divisionEffectTime || 0) + 1;
        if (cell.divisionEffectTime >= cell.divisionEffectDuration) {
          cell.divisionEffectProperties.active = false;
        } else {
          // Update division effect properties based on time
          const progress = cell.divisionEffectTime / cell.divisionEffectDuration;
          cell.divisionEffectProperties.glowIntensity = 1.0 - progress;
          cell.divisionEffectProperties.connectionOpacity = 1.0 - progress;
        }
      }
      
      // Draw cell body with opacity
      this.ctx.beginPath();
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = opacity;
      
      // Apply rotation for dying cells
      if (cell.isDying && cell.deathEffectProperties && cell.deathEffectProperties.rotation) {
        this.ctx.save();
        this.ctx.translate(position.x, position.y);
        this.ctx.rotate(cell.deathEffectProperties.rotation);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      } else {
        this.ctx.arc(position.x, position.y, baseRadius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.globalAlpha = 1.0; // Reset opacity
      
      // Add border based on cell state
      const borderProps = cell.visualProperties || {
        borderColor: cell.isStemCell ? '#ffffff' : '#888888',
        borderWidth: cell.isStemCell ? 2 : 1
      };
      
      this.ctx.beginPath();
      this.ctx.strokeStyle = borderProps.borderColor;
      this.ctx.lineWidth = borderProps.borderWidth;
      this.ctx.globalAlpha = opacity; // Apply same opacity to border
      this.ctx.arc(position.x, position.y, baseRadius + borderProps.borderWidth/2, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.globalAlpha = 1.0; // Reset opacity
      
      // Draw state-specific patterns
      if (cell.visualProperties && cell.visualProperties.pattern) {
        this._drawCellPattern(
          position.x, 
          position.y, 
          baseRadius, 
          cell.visualProperties.pattern
        );
      }
      
      // Add stem cell specific indicators
      if (cell.isStemCell) {
        const stemCell = cell; // For clarity in the code
        
        // Draw stem cell halo/glow if present
        if (stemCell.haloSize > 0 && stemCell.haloOpacity > 0) {
          const gradient = this.ctx.createRadialGradient(
            position.x, position.y, baseRadius,
            position.x, position.y, baseRadius + stemCell.haloSize
          );
          
          gradient.addColorStop(0, `${stemCell.glowColor}${Math.floor(stemCell.haloOpacity * 255).toString(16).padStart(2, '0')}`);
          gradient.addColorStop(1, `${stemCell.glowColor}00`);
          
          this.ctx.beginPath();
          this.ctx.fillStyle = gradient;
          this.ctx.arc(position.x, position.y, baseRadius + stemCell.haloSize, 0, Math.PI * 2);
          this.ctx.fill();
        }
        
        // Draw suppression field for active stem cells
        if (stemCell.suppressionFieldRadius > 0 && stemCell.suppressionFieldOpacity > 0) {
          const fieldGradient = this.ctx.createRadialGradient(
            position.x, position.y, baseRadius,
            position.x, position.y, stemCell.suppressionFieldRadius
          );
          
          const cloneColor = stemCell.glowColor;
          fieldGradient.addColorStop(0, `${cloneColor}${Math.floor(stemCell.suppressionFieldOpacity * 255).toString(16).padStart(2, '0')}`);
          fieldGradient.addColorStop(0.7, `${cloneColor}${Math.floor(stemCell.suppressionFieldOpacity * 0.3 * 255).toString(16).padStart(2, '0')}`);
          fieldGradient.addColorStop(1, `${cloneColor}00`);
          
          this.ctx.beginPath();
          this.ctx.fillStyle = fieldGradient;
          this.ctx.arc(position.x, position.y, stemCell.suppressionFieldRadius, 0, Math.PI * 2);
          this.ctx.fill();
        }
        
        // Add divisions left indicator for active stem cells
        if (stemCell.isActive) {
          const divisionsLeft = stemCell.getDivisionsLeft();
          const divisionsTotal = stemCell.maxDivisions;
          const divisionsRatio = divisionsLeft / divisionsTotal;
          
          // Draw divisions indicator as arc
          this.ctx.beginPath();
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 3;
          this.ctx.arc(
            position.x,
            position.y,
            baseRadius + 3,
            0,
            Math.PI * 2 * divisionsRatio
          );
          this.ctx.stroke();
        }
        
        // Add activation progress indicator for activating stem cells
        if (stemCell.stemCellState === StemCell.States.ACTIVATING) {
          const progress = stemCell.getActivationProgress();
          
          // Draw activation progress as pulsing ring
          this.ctx.beginPath();
          this.ctx.strokeStyle = stemCell.glowColor;
          this.ctx.lineWidth = 2;
          this.ctx.globalAlpha = 0.3 + 0.7 * Math.sin(stemCell.pulsePhase);
          this.ctx.arc(
            position.x,
            position.y,
            baseRadius + 4 + Math.sin(stemCell.pulsePhase) * 2,
            0,
            Math.PI * 2 * progress
          );
          this.ctx.stroke();
          this.ctx.globalAlpha = 1.0;
        }
        
        // Add visual indicator for stem cell state
        const stateIndicator = this._getStemCellStateIndicator(stemCell);
        if (stateIndicator.symbol) {
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = `${Math.round(baseRadius * 0.8)}px Arial`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(
            stateIndicator.symbol,
            position.x,
            position.y
          );
        }
      }
      
      // Add visual indicator for dividing cells
      if (cell.isDividing) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.arc(position.x, position.y, baseRadius * 1.5, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Add visual indicator for senescent cells
      if (cell.state === Cell.States.SENESCENT) {
        // Draw X mark
        const xSize = baseRadius * 0.7;
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
        this.ctx.arc(position.x, position.y, baseRadius * 1.2, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Add age indicator (only for non-stem cells)
      if (!cell.isStemCell) {
        const agePercentage = cell.getAgePercentage();
        const ageIndicatorRadius = baseRadius * 0.4;
        const ageIndicatorColor = this._getAgeIndicatorColor(agePercentage);
        
        // Draw small circle indicating age
        this.ctx.beginPath();
        this.ctx.fillStyle = ageIndicatorColor;
        this.ctx.globalAlpha = opacity; // Apply same opacity to age indicator
        this.ctx.arc(
          position.x + baseRadius * 0.5, 
          position.y - baseRadius * 0.5, 
          ageIndicatorRadius, 
          0, 
          Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0; // Reset opacity
      }
      
      // Update death effect if cell is dying
      if (cell.isDying) {
        const deathEffectComplete = cell.updateDeathEffect();
        // Note: The cell will be removed by the CellLifecycleManager after the death effect completes
      }
    });
  }
  
  /**
   * Render division connections between cells
   * @param {Array} cells - All cells to render
   * @private
   */
  _renderDivisionConnections(cells) {
    if (!this.ctx) return;
    
    // Find cells with active division effects
    const dividingCells = cells.filter(cell => 
      cell.divisionEffectProperties && 
      cell.divisionEffectProperties.active && 
      cell.divisionPartner
    );
    
    // Render division connections
    dividingCells.forEach(cell => {
      const partner = cell.divisionPartner;
      
      // Skip if partner is not found (might have been removed)
      if (!partner || !partner.body) return;
      
      const startPos = cell.body ? cell.body.position : { x: 0, y: 0 };
      const endPos = partner.body ? partner.body.position : { x: 0, y: 0 };
      
      // Calculate connection properties based on effect progress
      const progress = cell.divisionEffectTime / cell.divisionEffectDuration;
      const opacity = cell.divisionEffectProperties.connectionOpacity * (1 - progress);
      const width = 3 * (1 - progress);
      
      // Draw connection line
      this.ctx.beginPath();
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      this.ctx.lineWidth = width;
      this.ctx.moveTo(startPos.x, startPos.y);
      this.ctx.lineTo(endPos.x, endPos.y);
      this.ctx.stroke();
      
      // Draw pulsing circles at midpoint
      const midX = (startPos.x + endPos.x) / 2;
      const midY = (startPos.y + endPos.y) / 2;
      const pulseSize = 5 * (1 - progress);
      
      this.ctx.beginPath();
      this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.7})`;
      this.ctx.arc(midX, midY, pulseSize, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  /**
   * Render death effect particles for a dying cell
   * @param {Cell} cell - The dying cell
   * @param {Object} position - Cell position
   * @param {number} baseRadius - Cell base radius
   * @param {string} color - Cell color
   * @private
   */
  _renderDeathEffectParticles(cell, position, baseRadius, color) {
    if (!this.ctx || !cell.deathEffectProperties) return;
    
    const props = cell.deathEffectProperties;
    const particleCount = props.particleCount;
    const particleSize = props.particleSize;
    const particleSpread = props.particleSpread;
    
    // Generate random particles around the dying cell
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * particleSpread;
      const x = position.x + Math.cos(angle) * distance;
      const y = position.y + Math.sin(angle) * distance;
      
      // Draw particle
      this.ctx.beginPath();
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = props.opacity * 0.7;
      this.ctx.arc(x, y, particleSize, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    }
    
    // Draw fading ring
    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.globalAlpha = props.opacity * 0.3;
    this.ctx.lineWidth = 1;
    this.ctx.arc(position.x, position.y, baseRadius + props.particleSpread * 0.5, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1.0;
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
   * Draw cell pattern based on pattern type
   * @param {number} x - Center x position
   * @param {number} y - Center y position
   * @param {number} radius - Cell radius
   * @param {string} pattern - Pattern type ('dotted', 'cross', etc.)
   * @private
   */
  _drawCellPattern(x, y, radius, pattern) {
    switch (pattern) {
      case 'dotted':
        // Draw dots around the cell
        const dotCount = 8;
        const dotRadius = radius * 0.2;
        
        for (let i = 0; i < dotCount; i++) {
          const angle = (i / dotCount) * Math.PI * 2;
          const dotX = x + Math.cos(angle) * radius * 0.7;
          const dotY = y + Math.sin(angle) * radius * 0.7;
          
          this.ctx.beginPath();
          this.ctx.fillStyle = '#ffffff';
          this.ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
          this.ctx.fill();
        }
        break;
        
      case 'cross':
        // Draw cross inside the cell (already done for senescent cells)
        break;
        
      case 'ring':
        // Draw ring inside the cell
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
        this.ctx.stroke();
        break;
    }
  }
  
  /**
   * Get color for age indicator
   * @param {number} agePercentage - Age as percentage of max age (0-1)
   * @returns {string} - CSS color string
   * @private
   */
  _getAgeIndicatorColor(agePercentage) {
    // Green to yellow to red gradient based on age
    if (agePercentage < 0.5) {
      // Green to yellow (0% - 50%)
      const ratio = agePercentage * 2; // 0-1 for this range
      return `rgb(${Math.floor(255 * ratio)}, 255, 0)`;
    } else {
      // Yellow to red (50% - 100%)
      const ratio = (agePercentage - 0.5) * 2; // 0-1 for this range
      return `rgb(255, ${Math.floor(255 * (1 - ratio))}, 0)`;
    }
  }
  
  /**
   * Get visual indicator for stem cell state
   * @param {StemCell} stemCell - The stem cell
   * @returns {Object} - Visual indicator properties
   * @private
   */
  _getStemCellStateIndicator(stemCell) {
    switch (stemCell.stemCellState) {
      case StemCell.States.DORMANT:
        return {
          symbol: '•', // Dot symbol for dormant
          color: '#ffffff'
        };
        
      case StemCell.States.ACTIVATING:
        return {
          symbol: '◎', // Circle with dot for activating
          color: '#ffffff'
        };
        
      case StemCell.States.ACTIVE:
        return {
          symbol: '★', // Star for active
          color: '#ffffff'
        };
        
      case StemCell.States.DEPLETED:
        return {
          symbol: '✕', // X for depleted
          color: '#aaaaaa'
        };
        
      default:
        return {
          symbol: null,
          color: '#ffffff'
        };
    }
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
    
    // Get active stem cells to render individual suppression fields
    const activeStemCells = this.cellManager.getStemCells().filter(
      cell => cell.isActive && cell.clone === activeClone
    );
    
    // Render global suppression field
    this._renderGlobalSuppressionField(suppressionLevel, activeClone);
    
    // Render individual suppression fields from active stem cells
    activeStemCells.forEach(stemCell => {
      this._renderIndividualSuppressionField(stemCell);
    });
    
    // Render suppression wave effects
    this._renderSuppressionWaveEffects(suppressionLevel, activeClone);
    
    // Render activation progress for dormant stem cells
    this._renderStemCellActivationProgress();
    
    // Render suppression level indicator
    this._renderSuppressionLevelIndicator(suppressionLevel, activeClone);
  }
  
  /**
   * Render the global suppression field
   * @param {number} suppressionLevel - Current suppression level (0-1)
   * @param {string} activeClone - Active clone identifier
   * @private
   */
  _renderGlobalSuppressionField(suppressionLevel, activeClone) {
    if (!this.ctx || suppressionLevel <= 0.1) return;
    
    // Create radial gradient from center
    const gradient = this.ctx.createRadialGradient(
      this.cageCenter.x, this.cageCenter.y, 0,
      this.cageCenter.x, this.cageCenter.y, this.cageRadius * 1.2
    );
    
    // Set gradient colors based on active clone and suppression level
    const alpha = Math.min(0.3, suppressionLevel * 0.4); // Max 30% opacity
    
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
  }
  
  /**
   * Render individual suppression field from a stem cell
   * @param {StemCell} stemCell - Active stem cell
   * @private
   */
  _renderIndividualSuppressionField(stemCell) {
    if (!this.ctx || !stemCell.body) return;
    
    const position = stemCell.body.position;
    const suppressionStrength = stemCell.suppressionStrength;
    
    // Skip if suppression strength is too low
    if (suppressionStrength < 0.1) return;
    
    // Calculate field radius based on suppression strength
    const fieldRadius = 50 + 50 * suppressionStrength;
    
    // Create radial gradient for suppression field
    const gradient = this.ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, fieldRadius
    );
    
    // Set gradient colors based on clone and suppression strength
    const alpha = Math.min(0.4, suppressionStrength * 0.5);
    const cloneColor = this._getCloneColor(stemCell.clone);
    
    // Create gradient
    gradient.addColorStop(0, `rgba(${this._hexToRgb(cloneColor)}, ${alpha})`);
    gradient.addColorStop(0.7, `rgba(${this._hexToRgb(cloneColor)}, ${alpha * 0.3})`);
    gradient.addColorStop(1, `rgba(${this._hexToRgb(cloneColor)}, 0)`);
    
    // Draw suppression field
    this.ctx.beginPath();
    this.ctx.fillStyle = gradient;
    this.ctx.arc(
      position.x, 
      position.y, 
      fieldRadius, 
      0, 
      Math.PI * 2
    );
    this.ctx.fill();
    
    // Add pulsing effect
    const pulsePhase = stemCell.pulsePhase || 0;
    const pulseRadius = fieldRadius * 0.8 + Math.sin(pulsePhase) * 5;
    const pulseAlpha = (0.1 + 0.1 * Math.sin(pulsePhase)) * suppressionStrength;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = `rgba(${this._hexToRgb(cloneColor)}, ${pulseAlpha})`;
    this.ctx.lineWidth = 2;
    this.ctx.arc(
      position.x, 
      position.y, 
      pulseRadius, 
      0, 
      Math.PI * 2
    );
    this.ctx.stroke();
  }
  
  /**
   * Render suppression wave effects
   * @param {number} suppressionLevel - Current suppression level (0-1)
   * @param {string} activeClone - Active clone identifier
   * @private
   */
  _renderSuppressionWaveEffects(suppressionLevel, activeClone) {
    if (!this.ctx || suppressionLevel <= 0.3) return;
    
    // Initialize wave effects if not already created
    if (!this.suppressionWaves) {
      this.suppressionWaves = [];
      for (let i = 0; i < 3; i++) {
        this.suppressionWaves.push({
          radius: this.cageRadius * (0.3 + Math.random() * 0.3),
          speed: 0.5 + Math.random() * 0.5,
          opacity: 0.1 + Math.random() * 0.1
        });
      }
    }
    
    // Get clone color
    const cloneColor = this._getCloneColor(activeClone);
    
    // Update and render each wave
    this.suppressionWaves.forEach(wave => {
      // Update radius
      wave.radius += wave.speed;
      
      // Reset wave when it gets too large
      if (wave.radius > this.cageRadius * 1.2) {
        wave.radius = this.cageRadius * 0.2;
        wave.speed = 0.5 + Math.random() * 0.5;
        wave.opacity = 0.1 + Math.random() * 0.1;
      }
      
      // Calculate opacity based on suppression level and wave size
      const waveOpacity = wave.opacity * suppressionLevel * 
        (1 - wave.radius / (this.cageRadius * 1.2));
      
      // Draw wave
      this.ctx.beginPath();
      this.ctx.strokeStyle = `rgba(${this._hexToRgb(cloneColor)}, ${waveOpacity})`;
      this.ctx.lineWidth = 2;
      this.ctx.arc(
        this.cageCenter.x, 
        this.cageCenter.y, 
        wave.radius, 
        0, 
        Math.PI * 2
      );
      this.ctx.stroke();
    });
  }
  
  /**
   * Render suppression level indicator
   * @param {number} suppressionLevel - Current suppression level (0-1)
   * @param {string} activeClone - Active clone identifier
   * @private
   */
  _renderSuppressionLevelIndicator(suppressionLevel, activeClone) {
    if (!this.ctx) return;
    
    // Draw suppression level indicator text
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `Suppression: ${Math.round(suppressionLevel * 100)}%`,
      this.cageCenter.x,
      this.cageCenter.y - this.cageRadius - 20
    );
    
    // Draw suppression level bar
    const barWidth = 100;
    const barHeight = 8;
    const barX = this.cageCenter.x - barWidth / 2;
    const barY = this.cageCenter.y - this.cageRadius - 10;
    
    // Draw background
    this.ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Draw filled portion
    const fillWidth = barWidth * suppressionLevel;
    this.ctx.fillStyle = this._getCloneColor(activeClone);
    this.ctx.fillRect(barX, barY, fillWidth, barHeight);
    
    // Draw border
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Draw activation threshold marker
    const thresholdX = barX + barWidth * this.stemCellManager.activationThreshold;
    this.ctx.beginPath();
    this.ctx.moveTo(thresholdX, barY - 2);
    this.ctx.lineTo(thresholdX, barY + barHeight + 2);
    this.ctx.strokeStyle = 'yellow';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
  
  /**
   * Convert hex color to RGB string
   * @param {string} hex - Hex color code
   * @returns {string} - RGB values as "r, g, b" string
   * @private
   */
  _hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
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
        const baseRadius = 8; // Base stem cell radius
        
        // Draw activation progress ring with dynamic effects
        const pulsePhase = stemCell.pulsePhase || 0;
        const ringRadius = baseRadius + 4 + Math.sin(pulsePhase) * 2;
        const glowIntensity = 0.3 + 0.7 * Math.sin(pulsePhase);
        
        // Draw activation progress arc
        this.ctx.beginPath();
        this.ctx.strokeStyle = stemCell.getColor();
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = glowIntensity;
        this.ctx.arc(
          position.x,
          position.y,
          ringRadius,
          0,
          Math.PI * 2 * progress // Arc length based on progress
        );
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
        
        // Draw activation rays when progress is significant
        if (progress > 0.5) {
          const rayCount = 8;
          const rayLength = baseRadius * (0.5 + progress * 0.5);
          const rayOpacity = progress * glowIntensity;
          
          this.ctx.globalAlpha = rayOpacity;
          this.ctx.strokeStyle = stemCell.getColor();
          this.ctx.lineWidth = 1;
          
          for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const startX = position.x + Math.cos(angle) * ringRadius;
            const startY = position.y + Math.sin(angle) * ringRadius;
            const endX = position.x + Math.cos(angle) * (ringRadius + rayLength);
            const endY = position.y + Math.sin(angle) * (ringRadius + rayLength);
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
          }
          
          this.ctx.globalAlpha = 1.0;
        }
        
        // Add activation progress text for high progress
        if (progress > 0.7) {
          this.ctx.font = '10px Arial';
          this.ctx.fillStyle = 'white';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(
            `${Math.round(progress * 100)}%`,
            position.x,
            position.y + baseRadius + 12
          );
        }
        
        // Add activation threshold indicator
        const activationThreshold = this.stemCellManager.activationThreshold;
        if (progress > activationThreshold * 0.8 && progress < activationThreshold) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = 'yellow';
          this.ctx.setLineDash([2, 2]);
          this.ctx.lineWidth = 1;
          this.ctx.arc(
            position.x,
            position.y,
            ringRadius,
            0,
            Math.PI * 2
          );
          this.ctx.stroke();
          this.ctx.setLineDash([]);
        }
      }
      
      // Add special visual effect for activating stem cells
      if (stemCell.stemCellState === StemCell.States.ACTIVATING) {
        const position = stemCell.body ? stemCell.body.position : { x: 0, y: 0 };
        const baseRadius = 8; // Base stem cell radius
        
        // Create pulsing activation glow
        const pulsePhase = stemCell.pulsePhase || 0;
        const glowRadius = baseRadius * (2 + Math.sin(pulsePhase) * 0.5);
        const glowOpacity = 0.2 + 0.3 * Math.sin(pulsePhase);
        
        // Draw activation glow
        const gradient = this.ctx.createRadialGradient(
          position.x, position.y, baseRadius,
          position.x, position.y, glowRadius
        );
        
        const cloneColor = this._getCloneColor(stemCell.clone);
        gradient.addColorStop(0, `rgba(${this._hexToRgb(cloneColor)}, ${glowOpacity})`);
        gradient.addColorStop(1, `rgba(${this._hexToRgb(cloneColor)}, 0)`);
        
        this.ctx.beginPath();
        this.ctx.fillStyle = gradient;
        this.ctx.arc(position.x, position.y, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw activation particles
        const particleCount = 5;
        const particleSize = 2;
        const particleDistance = baseRadius * 2;
        
        this.ctx.fillStyle = cloneColor;
        
        for (let i = 0; i < particleCount; i++) {
          const angle = pulsePhase + (i / particleCount) * Math.PI * 2;
          const distance = particleDistance * (0.7 + 0.3 * Math.sin(pulsePhase + i));
          const x = position.x + Math.cos(angle) * distance;
          const y = position.y + Math.sin(angle) * distance;
          
          this.ctx.beginPath();
          this.ctx.globalAlpha = glowOpacity;
          this.ctx.arc(x, y, particleSize, 0, Math.PI * 2);
          this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1.0;
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
        
        // Draw activation progress ring with dynamic effects
        const pulsePhase = stemCell.pulsePhase || 0;
        const ringRadius = baseRadius + 4 + Math.sin(pulsePhase) * 2;
        const glowIntensity = 0.3 + 0.7 * Math.sin(pulsePhase);
        
        // Draw activation progress arc
        this.ctx.beginPath();
        this.ctx.strokeStyle = stemCell.getColor();
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = glowIntensity;
        this.ctx.arc(
          position.x,
          position.y,
          ringRadius,
          0,
          Math.PI * 2 * progress // Arc length based on progress
        );
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
        
        // Draw activation rays when progress is significant
        if (progress > 0.5) {
          const rayCount = 8;
          const rayLength = baseRadius * (0.5 + progress * 0.5);
          const rayOpacity = progress * glowIntensity;
          
          this.ctx.globalAlpha = rayOpacity;
          this.ctx.strokeStyle = stemCell.getColor();
          this.ctx.lineWidth = 1;
          
          for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const startX = position.x + Math.cos(angle) * ringRadius;
            const startY = position.y + Math.sin(angle) * ringRadius;
            const endX = position.x + Math.cos(angle) * (ringRadius + rayLength);
            const endY = position.y + Math.sin(angle) * (ringRadius + rayLength);
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
          }
          
          this.ctx.globalAlpha = 1.0;
        }
        
        // Add activation progress text for high progress
        if (progress > 0.7) {
          this.ctx.font = '10px Arial';
          this.ctx.fillStyle = 'white';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(
            `${Math.round(progress * 100)}%`,
            position.x,
            position.y + baseRadius + 12
          );
        }
        
        // Add activation threshold indicator
        const activationThreshold = this.stemCellManager.activationThreshold;
        if (progress > activationThreshold * 0.8 && progress < activationThreshold) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = 'yellow';
          this.ctx.setLineDash([2, 2]);
          this.ctx.lineWidth = 1;
          this.ctx.arc(
            position.x,
            position.y,
            ringRadius,
            0,
            Math.PI * 2
          );
          this.ctx.stroke();
          this.ctx.setLineDash([]);
        }
      }
      
      // Add special visual effect for activating stem cells
      if (stemCell.stemCellState === StemCell.States.ACTIVATING) {
        const position = stemCell.body ? stemCell.body.position : { x: 0, y: 0 };
        const baseRadius = 8; // Base stem cell radius
        
        // Create pulsing activation glow
        const pulsePhase = stemCell.pulsePhase || 0;
        const glowRadius = baseRadius * (2 + Math.sin(pulsePhase) * 0.5);
        const glowOpacity = 0.2 + 0.3 * Math.sin(pulsePhase);
        
        // Draw activation glow
        const gradient = this.ctx.createRadialGradient(
          position.x, position.y, baseRadius,
          position.x, position.y, glowRadius
        );
        
        const cloneColor = this._getCloneColor(stemCell.clone);
        gradient.addColorStop(0, `rgba(${this._hexToRgb(cloneColor)}, ${glowOpacity})`);
        gradient.addColorStop(1, `rgba(${this._hexToRgb(cloneColor)}, 0)`);
        
        this.ctx.beginPath();
        this.ctx.fillStyle = gradient;
        this.ctx.arc(position.x, position.y, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw activation particles
        const particleCount = 5;
        const particleSize = 2;
        const particleDistance = baseRadius * 2;
        
        this.ctx.fillStyle = cloneColor;
        
        for (let i = 0; i < particleCount; i++) {
          const angle = pulsePhase + (i / particleCount) * Math.PI * 2;
          const distance = particleDistance * (0.7 + 0.3 * Math.sin(pulsePhase + i));
          const x = position.x + Math.cos(angle) * distance;
          const y = position.y + Math.sin(angle) * distance;
          
          this.ctx.beginPath();
          this.ctx.globalAlpha = glowOpacity;
          this.ctx.arc(x, y, particleSize, 0, Math.PI * 2);
          this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1.0;
      }
    });
  }
  
  /**
   * Create visual effects for a succession event
   * @param {Object} details - Succession event details
   */
  createSuccessionEventEffects(details) {
    // Store succession event visual effects
    if (!this.successionEffects) {
      this.successionEffects = [];
    }
    
    // Create new effect
    const effect = {
      time: 0,
      duration: 60, // 1 second at 60fps
      oldClone: details.oldClone,
      newClone: details.newClone,
      center: { ...this.cageCenter },
      rings: [],
      particles: []
    };
    
    // Create expanding rings
    for (let i = 0; i < 3; i++) {
      effect.rings.push({
        radius: 10,
        maxRadius: this.cageRadius * 1.2,
        speed: 3 + i * 2,
        opacity: 0.8 - i * 0.2,
        delay: i * 10
      });
    }
    
    // Create particles
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 20 + Math.random() * 30;
      const speed = 1 + Math.random() * 2;
      
      effect.particles.push({
        x: effect.center.x + Math.cos(angle) * distance,
        y: effect.center.y + Math.sin(angle) * distance,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        opacity: 0.8 + Math.random() * 0.2,
        decay: 0.95 + Math.random() * 0.03
      });
    }
    
    // Add effect to list
    this.successionEffects.push(effect);
    
    // Set up event listeners for the simulation
    if (!this._successionEventListenerSet) {
      this._successionEventListenerSet = true;
      this.on('successionEvent', this.createSuccessionEventEffects.bind(this));
    }
  }
  
  /**
   * Render succession event effects
   * @private
   */
  _renderSuccessionEffects() {
    if (!this.ctx || !this.successionEffects || this.successionEffects.length === 0) return;
    
    // Process each effect
    for (let i = this.successionEffects.length - 1; i >= 0; i--) {
      const effect = this.successionEffects[i];
      
      // Update effect time
      effect.time++;
      
      // Get colors for old and new clones
      const oldCloneColor = this._getCloneColor(effect.oldClone);
      const newCloneColor = this._getCloneColor(effect.newClone);
      
      // Render rings
      effect.rings.forEach(ring => {
        // Skip if ring is delayed
        if (effect.time < ring.delay) return;
        
        // Update ring radius
        ring.radius += ring.speed;
        
        // Calculate opacity based on radius and time
        const radiusRatio = ring.radius / ring.maxRadius;
        const timeRatio = effect.time / effect.duration;
        const opacity = ring.opacity * (1 - Math.max(radiusRatio, timeRatio));
        
        // Skip if fully transparent
        if (opacity <= 0) return;
        
        // Draw ring with gradient from old to new clone color
        const gradient = this.ctx.createRadialGradient(
          effect.center.x, effect.center.y, ring.radius - 5,
          effect.center.x, effect.center.y, ring.radius + 5
        );
        
        gradient.addColorStop(0, `rgba(${this._hexToRgb(oldCloneColor)}, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 1.5})`);
        gradient.addColorStop(1, `rgba(${this._hexToRgb(newCloneColor)}, ${opacity})`);
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 3;
        this.ctx.arc(
          effect.center.x,
          effect.center.y,
          ring.radius,
          0,
          Math.PI * 2
        );
        this.ctx.stroke();
      });
      
      // Render particles
      effect.particles.forEach(particle => {
        // Update particle position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Update particle opacity
        particle.opacity *= particle.decay;
        
        // Skip if fully transparent
        if (particle.opacity <= 0.05) return;
        
        // Draw particle
        this.ctx.beginPath();
        this.ctx.fillStyle = newCloneColor;
        this.ctx.globalAlpha = particle.opacity;
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
      });
      
      // Remove effect if complete
      if (effect.time >= effect.duration) {
        this.successionEffects.splice(i, 1);
      }
    }
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
    
    // Get active stem cells to render individual suppression fields
    const activeStemCells = this.cellManager.getStemCells().filter(
      cell => cell.isActive && cell.clone === activeClone
    );
    
    // Render global suppression field
    this._renderGlobalSuppressionField(suppressionLevel, activeClone);
    
    // Render individual suppression fields from active stem cells
    activeStemCells.forEach(stemCell => {
      this._renderIndividualSuppressionField(stemCell);
    });
    
    // Render suppression wave effects
    this._renderSuppressionWaveEffects(suppressionLevel, activeClone);
    
    // Render succession event effects
    this._renderSuccessionEffects();
    
    // Render activation progress for dormant stem cells
    this._renderStemCellActivationProgress();
    
    // Render suppression level indicator
    this._renderSuppressionLevelIndicator(suppressionLevel, activeClone);
  }