/**
 * PopulationController class
 * Manages population dynamics and homeostasis in the simulation
 */
import EventEmitter from '../utils/EventEmitter.js';

class PopulationController extends EventEmitter {
  /**
   * Create a new population controller
   * @param {Object} options - Configuration options
   * @param {Object} options.simulation - Reference to the simulation
   * @param {Object} options.cellManager - Reference to the cell lifecycle manager
   * @param {Object} options.stemCellManager - Reference to the stem cell manager
   */
  constructor(options = {}) {
    super();
    
    this.simulation = options.simulation;
    this.cellManager = options.cellManager;
    this.stemCellManager = options.stemCellManager;
    
    // Population control parameters
    this.targetPopulation = options.targetPopulation || 100;
    this.populationTolerance = options.populationTolerance || 0.1; // 10% tolerance
    this.divisionRateBase = options.divisionRateBase || 0.008;
    this.divisionRateMax = options.divisionRateMax || 0.02;
    this.deathRateBase = options.deathRateBase || 0.002;
    this.deathRateMax = options.deathRateMax || 0.01;
    
    // Population tracking
    this.populationHistory = [];
    this.clonePopulationHistory = {
      red: [],
      green: [],
      yellow: []
    };
    this.historyMaxLength = 100;
    
    // Homeostasis metrics
    this.homeostasisMetrics = {
      populationStability: 1.0, // 0-1 scale, higher is more stable
      cloneBalance: 1.0,        // 0-1 scale, higher is more balanced
      lastAdjustment: null,     // Last adjustment made
      resourceCompetition: 0.0, // 0-1 scale, higher means more competition
      boundaryEffects: 0.0      // 0-1 scale, higher means stronger boundary effects
    };
    
    // Boundary-based senescence parameters
    this.boundarySenescenceThreshold = options.boundarySenescenceThreshold || 0.15; // % of radius from boundary
    this.boundarySenescenceProbability = options.boundarySenescenceProbability || 0.05; // Base probability
    
    // Resource competition parameters
    this.resourceCompetitionThreshold = options.resourceCompetitionThreshold || 0.7; // Density threshold
    this.resourceCompetitionFactor = options.resourceCompetitionFactor || 0.03; // Base factor
    this.resourceCompetitionRadius = options.resourceCompetitionRadius || 20; // Radius to check for neighboring cells
    this.resourceCompetitionMaxNeighbors = options.resourceCompetitionMaxNeighbors || 6; // Max neighbors before competition
    
    // Balanced replacement tracking
    this.balancedReplacementMetrics = {
      replacementRatio: 1.0, // Ratio of new cells to dying cells
      cloneBalance: 1.0,     // How evenly distributed the clones are
      cloneTransitions: {    // Track transitions between dominant clones
        lastDominantClone: null,
        transitionEvents: []
      }
    };
    
    // Homeostasis mechanism timers
    this.lastBoundaryCheckTime = 0;
    this.lastResourceCompetitionTime = 0;
    this.lastBalancedReplacementTime = 0;
    this.mechanismUpdateInterval = 30; // Frames between mechanism updates
    
    // Initialize event listeners
    this._initEventListeners();
  }
  
  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    if (this.simulation) {
      // Listen for relevant simulation events
      this.simulation.on('cellCreated', (cell) => this._onCellChange());
      this.simulation.on('cellDied', (cell) => this._onCellChange());
      this.simulation.on('successionEvent', (details) => this._onSuccessionEvent(details));
    }
  }
  
  /**
   * Handle cell population changes
   * @private
   */
  _onCellChange() {
    this._updatePopulationTracking();
  }
  
  /**
   * Handle succession events
   * @param {Object} details - Succession event details
   * @private
   */
  _onSuccessionEvent(details) {
    // Record succession in metrics
    this.homeostasisMetrics.lastAdjustment = {
      type: 'succession',
      time: Date.now(),
      oldClone: details.oldClone,
      newClone: details.newClone,
      populationBefore: details.populationBefore
    };
    
    // Emit event
    this.emit('homeostasisAdjustment', this.homeostasisMetrics.lastAdjustment);
  }
  
  /**
   * Update population tracking data
   * @private
   */
  _updatePopulationTracking() {
    if (!this.cellManager) return;
    
    // Get current population counts
    const totalPopulation = this.cellManager.getCellCount();
    const cloneCounts = {
      red: this.cellManager.getCellsByClone('red').length,
      green: this.cellManager.getCellsByClone('green').length,
      yellow: this.cellManager.getCellsByClone('yellow').length
    };
    
    // Add to history
    this.populationHistory.push(totalPopulation);
    Object.keys(this.clonePopulationHistory).forEach(clone => {
      this.clonePopulationHistory[clone].push(cloneCounts[clone]);
    });
    
    // Trim history to max length
    if (this.populationHistory.length > this.historyMaxLength) {
      this.populationHistory.shift();
      Object.keys(this.clonePopulationHistory).forEach(clone => {
        this.clonePopulationHistory[clone].shift();
      });
    }
    
    // Update homeostasis metrics
    this._updateHomeostasisMetrics();
  }
  
  /**
   * Update homeostasis metrics based on current population
   * @private
   */
  _updateHomeostasisMetrics() {
    // Calculate population stability (how close to target population)
    const currentPopulation = this.populationHistory[this.populationHistory.length - 1] || 0;
    const populationRatio = currentPopulation / this.targetPopulation;
    
    // Population stability is higher when closer to target
    this.homeostasisMetrics.populationStability = Math.max(0, 1 - Math.abs(1 - populationRatio));
    
    // Calculate clone balance (how evenly distributed the clones are)
    const activeClones = Object.keys(this.clonePopulationHistory).filter(clone => {
      const latest = this.clonePopulationHistory[clone][this.clonePopulationHistory[clone].length - 1] || 0;
      return latest > 0;
    });
    
    if (activeClones.length > 1) {
      // Calculate standard deviation of clone populations
      const cloneValues = activeClones.map(clone => {
        return this.clonePopulationHistory[clone][this.clonePopulationHistory[clone].length - 1] || 0;
      });
      
      const mean = cloneValues.reduce((sum, val) => sum + val, 0) / cloneValues.length;
      const variance = cloneValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / cloneValues.length;
      const stdDev = Math.sqrt(variance);
      
      // Clone balance is higher when standard deviation is lower
      // Normalize by mean to get coefficient of variation
      const cv = mean > 0 ? stdDev / mean : 1;
      this.homeostasisMetrics.cloneBalance = Math.max(0, 1 - Math.min(1, cv));
    } else {
      // Only one active clone, balance is low
      this.homeostasisMetrics.cloneBalance = 0.2;
    }
    
    // Emit metrics update event
    this.emit('homeostasisMetricsUpdated', this.homeostasisMetrics);
  }
  
  /**
   * Update the simulation based on current population
   * Called each frame to maintain homeostasis
   */
  update() {
    if (!this.cellManager) return;
    
    // Get current population
    const currentPopulation = this.cellManager.getCellCount();
    
    // Calculate population ratio
    const populationRatio = currentPopulation / this.targetPopulation;
    
    // Adjust division and death rates based on population
    this._adjustDivisionRates(currentPopulation);
    this._adjustDeathRates(currentPopulation);
    
    // Check if population is outside tolerance range
    const lowerBound = this.targetPopulation * (1 - this.populationTolerance);
    const upperBound = this.targetPopulation * (1 + this.populationTolerance);
    
    if (currentPopulation < lowerBound) {
      // Population is too low - boost division rates
      this._boostDivisionRates();
      
      // Record adjustment
      this.homeostasisMetrics.lastAdjustment = {
        type: 'boost_division',
        time: Date.now(),
        population: currentPopulation,
        targetPopulation: this.targetPopulation
      };
      
      // Emit event
      this.emit('homeostasisAdjustment', this.homeostasisMetrics.lastAdjustment);
    } else if (currentPopulation > upperBound) {
      // Population is too high - increase death rates
      this._increaseSenescence();
      
      // Record adjustment
      this.homeostasisMetrics.lastAdjustment = {
        type: 'increase_senescence',
        time: Date.now(),
        population: currentPopulation,
        targetPopulation: this.targetPopulation
      };
      
      // Emit event
      this.emit('homeostasisAdjustment', this.homeostasisMetrics.lastAdjustment);
    }
    
    // Update homeostasis mechanisms periodically
    this._updateHomeostasisMechanisms();
  }
  
  /**
   * Update all homeostasis mechanisms
   * This is called periodically to avoid running intensive operations every frame
   * @private
   */
  _updateHomeostasisMechanisms() {
    const frameCount = this.simulation ? this.simulation.frameCount : 0;
    
    // Check boundary-based senescence
    if (frameCount - this.lastBoundaryCheckTime >= this.mechanismUpdateInterval) {
      this._applyBoundarySenescence();
      this.lastBoundaryCheckTime = frameCount;
    }
    
    // Check resource competition
    if (frameCount - this.lastResourceCompetitionTime >= this.mechanismUpdateInterval * 2) {
      this._applyResourceCompetition();
      this.lastResourceCompetitionTime = frameCount;
    }
    
    // Check balanced replacement
    if (frameCount - this.lastBalancedReplacementTime >= this.mechanismUpdateInterval * 3) {
      this._updateBalancedReplacement();
      this.lastBalancedReplacementTime = frameCount;
    }
    
    // Update homeostasis metrics
    this._updateHomeostasisMetrics();
  }
  
  /**
   * Apply boundary-based senescence to cells near the boundary
   * Cells near the boundary have a higher chance of becoming senescent
   * This simulates the biological phenomenon where cells at tissue boundaries
   * experience different mechanical forces and signaling environments
   * @private
   */
  _applyBoundarySenescence() {
    if (!this.cellManager || !this.simulation) return;
    
    // Get all dividing and non-dividing cells
    const activeCells = [
      ...this.cellManager.getCellsByState('dividing'),
      ...this.cellManager.getCellsByState('non-dividing')
    ];
    
    // Get simulation boundary information
    const boundary = {
      center: this.simulation.cageCenter || { x: 300, y: 300 },
      radius: this.simulation.cageRadius || 280
    };
    
    // Track cells affected by boundary
    let cellsAffected = 0;
    
    // Check each cell for boundary proximity
    activeCells.forEach(cell => {
      if (!cell.body) return;
      
      // Calculate distance from center as percentage of radius
      const dx = cell.body.position.x - boundary.center.x;
      const dy = cell.body.position.y - boundary.center.y;
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate distance from boundary as percentage of radius
      const distanceFromBoundary = (boundary.radius - distanceFromCenter) / boundary.radius;
      
      // If cell is close to boundary, apply senescence with probability
      if (distanceFromBoundary < this.boundarySenescenceThreshold) {
        // Probability increases as cell gets closer to boundary
        const senescenceProbability = this.boundarySenescenceProbability * 
          (1 - distanceFromBoundary / this.boundarySenescenceThreshold);
        
        // Adjust probability based on cell age - older cells are more susceptible
        const ageAdjustment = cell.getAgePercentage() * 1.5;
        const adjustedProbability = senescenceProbability * ageAdjustment;
        
        // Apply senescence with calculated probability
        if (Math.random() < adjustedProbability) {
          // Transition to senescent state
          const wasTransitioned = cell.transitionState('senescent');
          
          if (wasTransitioned) {
            cellsAffected++;
            
            // Update boundary effects metric
            this.homeostasisMetrics.boundaryEffects = 
              Math.min(1.0, this.homeostasisMetrics.boundaryEffects + 0.05);
            
            // Emit event with detailed information
            this.emit('boundarySenescence', {
              cell: cell,
              cellId: cell.id,
              clone: cell.clone,
              position: cell.body ? { x: cell.body.position.x, y: cell.body.position.y } : null,
              distanceFromBoundary: distanceFromBoundary,
              probability: adjustedProbability,
              agePercentage: cell.getAgePercentage(),
              time: Date.now()
            });
          }
        }
      }
    });
    
    // Gradually decrease boundary effects metric over time
    if (cellsAffected === 0) {
      this.homeostasisMetrics.boundaryEffects = 
        Math.max(0, this.homeostasisMetrics.boundaryEffects - 0.01);
    }
    
    // If cells were affected, emit summary event
    if (cellsAffected > 0) {
      this.emit('boundarySenescenceSummary', {
        cellsAffected: cellsAffected,
        boundaryEffects: this.homeostasisMetrics.boundaryEffects,
        boundarySenescenceThreshold: this.boundarySenescenceThreshold,
        boundaryRadius: boundary.radius,
        time: Date.now()
      });
    }
  }
  
  /**
   * Apply resource competition between cells in crowded areas
   * Cells in crowded areas have a higher chance of becoming senescent
   * This simulates the biological phenomenon of contact inhibition and
   * competition for limited nutrients and growth factors
   * @private
   */
  _applyResourceCompetition() {
    if (!this.cellManager) return;
    
    // Get all dividing cells (only dividing cells are affected by resource competition)
    const dividingCells = this.cellManager.getCellsByState('dividing');
    
    // Skip if not enough cells for competition
    if (dividingCells.length < 10) return;
    
    // Track cells affected by resource competition
    let cellsAffected = 0;
    
    // Calculate global resource availability based on total population
    const totalCells = this.cellManager.getCellCount();
    const targetPopulation = this.targetPopulation;
    const globalResourceFactor = Math.max(0.5, Math.min(1.0, targetPopulation / totalCells));
    
    // Check each cell for crowding
    dividingCells.forEach(cell => {
      if (!cell.body) return;
      
      // Find neighboring cells within competition radius
      const neighbors = this._findNeighboringCells(cell, this.resourceCompetitionRadius);
      
      // Calculate crowding factor (0-1)
      const crowdingFactor = Math.min(1.0, neighbors.length / this.resourceCompetitionMaxNeighbors);
      
      // Calculate clone-specific competition
      // Cells from the same clone compete more intensely (simulating niche competition)
      const sameCloneNeighbors = neighbors.filter(neighbor => neighbor.clone === cell.clone);
      const sameCloneFactor = sameCloneNeighbors.length / Math.max(1, neighbors.length);
      
      // Calculate age factor - older cells are more susceptible to resource competition
      const ageFactor = cell.getAgePercentage() * 1.5;
      
      // If crowding is above threshold, apply senescence with probability
      if (crowdingFactor > this.resourceCompetitionThreshold) {
        // Base probability increases with crowding
        let competitionProbability = this.resourceCompetitionFactor * 
          (crowdingFactor - this.resourceCompetitionThreshold) / 
          (1 - this.resourceCompetitionThreshold);
        
        // Adjust probability based on clone competition and age
        competitionProbability *= (1 + sameCloneFactor * 0.5); // Up to 50% increase for same-clone competition
        competitionProbability *= ageFactor; // Older cells are more affected
        competitionProbability *= (2 - globalResourceFactor); // More competition when resources are scarce
        
        // Apply senescence with calculated probability
        if (Math.random() < competitionProbability) {
          // Transition to senescent state
          const wasTransitioned = cell.transitionState('senescent');
          
          if (wasTransitioned) {
            cellsAffected++;
            
            // Update resource competition metric
            this.homeostasisMetrics.resourceCompetition = 
              Math.min(1.0, this.homeostasisMetrics.resourceCompetition + 0.05);
            
            // Emit detailed event
            this.emit('resourceCompetition', {
              cell: cell,
              cellId: cell.id,
              clone: cell.clone,
              position: cell.body ? { x: cell.body.position.x, y: cell.body.position.y } : null,
              neighbors: neighbors.length,
              sameCloneNeighbors: sameCloneNeighbors.length,
              crowdingFactor: crowdingFactor,
              sameCloneFactor: sameCloneFactor,
              ageFactor: ageFactor,
              globalResourceFactor: globalResourceFactor,
              probability: competitionProbability,
              time: Date.now()
            });
          }
        }
      }
    });
    
    // Gradually decrease resource competition metric over time
    if (cellsAffected === 0) {
      this.homeostasisMetrics.resourceCompetition = 
        Math.max(0, this.homeostasisMetrics.resourceCompetition - 0.01);
    }
    
    // If cells were affected, emit summary event
    if (cellsAffected > 0) {
      this.emit('resourceCompetitionSummary', {
        cellsAffected: cellsAffected,
        resourceCompetition: this.homeostasisMetrics.resourceCompetition,
        resourceCompetitionThreshold: this.resourceCompetitionThreshold,
        globalResourceFactor: globalResourceFactor,
        totalCells: totalCells,
        targetPopulation: targetPopulation,
        time: Date.now()
      });
    }
  }
  
  /**
   * Find neighboring cells within a specified radius
   * @param {Cell} cell - The cell to find neighbors for
   * @param {number} radius - The radius to search within
   * @returns {Array} - Array of neighboring cells
   * @private
   */
  _findNeighboringCells(cell, radius) {
    if (!cell.body || !this.cellManager) return [];
    
    // Get all cells
    const allCells = this.cellManager.cells;
    
    // Find cells within radius
    return allCells.filter(otherCell => {
      // Skip self
      if (otherCell === cell || !otherCell.body) return false;
      
      // Calculate distance
      const dx = otherCell.body.position.x - cell.body.position.x;
      const dy = otherCell.body.position.y - cell.body.position.y;
      const distanceSquared = dx * dx + dy * dy;
      
      // Check if within radius
      return distanceSquared < radius * radius;
    });
  }
  
  /**
   * Update balanced replacement of old populations with new ones
   * This ensures that as old clones decline, new ones take their place
   * This is a key mechanism for maintaining population homeostasis
   * @private
   */
  _updateBalancedReplacement() {
    if (!this.cellManager || !this.stemCellManager) return;
    
    // Get current clone populations
    const clonePopulations = {
      red: this.cellManager.getCellsByClone('red').length,
      green: this.cellManager.getCellsByClone('green').length,
      yellow: this.cellManager.getCellsByClone('yellow').length
    };
    
    // Get state-specific populations for each clone
    const cloneStatePopulations = {
      red: {
        dividing: this.cellManager.getCellsByClone('red').filter(cell => cell.state === 'dividing').length,
        nonDividing: this.cellManager.getCellsByClone('red').filter(cell => cell.state === 'non-dividing').length,
        senescent: this.cellManager.getCellsByClone('red').filter(cell => cell.state === 'senescent').length
      },
      green: {
        dividing: this.cellManager.getCellsByClone('green').filter(cell => cell.state === 'dividing').length,
        nonDividing: this.cellManager.getCellsByClone('green').filter(cell => cell.state === 'non-dividing').length,
        senescent: this.cellManager.getCellsByClone('green').filter(cell => cell.state === 'senescent').length
      },
      yellow: {
        dividing: this.cellManager.getCellsByClone('yellow').filter(cell => cell.state === 'dividing').length,
        nonDividing: this.cellManager.getCellsByClone('yellow').filter(cell => cell.state === 'non-dividing').length,
        senescent: this.cellManager.getCellsByClone('yellow').filter(cell => cell.state === 'senescent').length
      }
    };
    
    // Calculate total population
    const totalPopulation = Object.values(clonePopulations).reduce((sum, val) => sum + val, 0);
    if (totalPopulation === 0) return;
    
    // Calculate clone percentages
    const clonePercentages = {};
    Object.keys(clonePopulations).forEach(clone => {
      clonePercentages[clone] = clonePopulations[clone] / totalPopulation;
    });
    
    // Calculate senescence ratios for each clone
    const cloneSenescenceRatios = {};
    Object.keys(cloneStatePopulations).forEach(clone => {
      const totalClonePopulation = clonePopulations[clone];
      if (totalClonePopulation > 0) {
        cloneSenescenceRatios[clone] = cloneStatePopulations[clone].senescent / totalClonePopulation;
      } else {
        cloneSenescenceRatios[clone] = 0;
      }
    });
    
    // Find dominant and declining clones
    const dominantClone = this._findDominantClone(clonePercentages);
    const decliningClones = this._findDecliningClones();
    
    // Find clones with high senescence (potential for replacement)
    const highSenescenceClones = Object.keys(cloneSenescenceRatios)
      .filter(clone => cloneSenescenceRatios[clone] > 0.4 && clonePopulations[clone] > 5);
    
    // Track clone transitions
    this._trackCloneTransitions(dominantClone);
    
    // Calculate clone balance (how evenly distributed the clones are)
    this._calculateCloneBalance(clonePercentages);
    
    // Calculate replacement ratio (new cells vs dying cells)
    this._calculateReplacementRatio();
    
    // Adjust stem cell activation thresholds based on clone balance and senescence
    this._adjustStemCellActivation(dominantClone, decliningClones, highSenescenceClones);
    
    // Apply selective pressure to maintain balance
    this._applySelectivePressure(dominantClone, decliningClones, cloneStatePopulations);
    
    // Emit balanced replacement update event with detailed metrics
    this.emit('balancedReplacementUpdated', {
      clonePercentages: clonePercentages,
      cloneStatePopulations: cloneStatePopulations,
      cloneSenescenceRatios: cloneSenescenceRatios,
      dominantClone: dominantClone,
      decliningClones: decliningClones,
      highSenescenceClones: highSenescenceClones,
      balancedReplacementMetrics: { ...this.balancedReplacementMetrics },
      time: Date.now()
    });
  }
  
  /**
   * Find the dominant clone based on population percentages
   * @param {Object} clonePercentages - Percentage of total population for each clone
   * @returns {string|null} - Dominant clone identifier or null if none
   * @private
   */
  _findDominantClone(clonePercentages) {
    // Find clone with highest percentage
    let dominantClone = null;
    let highestPercentage = 0;
    
    Object.keys(clonePercentages).forEach(clone => {
      if (clonePercentages[clone] > highestPercentage) {
        highestPercentage = clonePercentages[clone];
        dominantClone = clone;
      }
    });
    
    // Only consider as dominant if it has at least 40% of population
    return highestPercentage >= 0.4 ? dominantClone : null;
  }
  
  /**
   * Find clones that are declining based on population history
   * @returns {Array} - Array of declining clone identifiers
   * @private
   */
  _findDecliningClones() {
    const decliningClones = [];
    
    // Check each clone's population history
    Object.keys(this.clonePopulationHistory).forEach(clone => {
      const history = this.clonePopulationHistory[clone];
      if (history.length < 10) return; // Need enough history to determine trend
      
      // Get recent history (last 10 entries)
      const recentHistory = history.slice(-10);
      
      // Calculate trend (simple linear regression slope)
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;
      
      for (let i = 0; i < recentHistory.length; i++) {
        sumX += i;
        sumY += recentHistory[i];
        sumXY += i * recentHistory[i];
        sumXX += i * i;
      }
      
      const n = recentHistory.length;
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      
      // If slope is significantly negative, clone is declining
      if (slope < -0.5 && recentHistory[recentHistory.length - 1] > 5) {
        decliningClones.push(clone);
      }
    });
    
    return decliningClones;
  }
  
  /**
   * Track transitions between dominant clones
   * @param {string|null} currentDominantClone - Current dominant clone
   * @private
   */
  _trackCloneTransitions(currentDominantClone) {
    // Skip if no dominant clone
    if (!currentDominantClone) return;
    
    // Check if dominant clone has changed
    if (this.balancedReplacementMetrics.cloneTransitions.lastDominantClone !== currentDominantClone) {
      // Record transition if there was a previous dominant clone
      if (this.balancedReplacementMetrics.cloneTransitions.lastDominantClone) {
        const transitionEvent = {
          time: Date.now(),
          from: this.balancedReplacementMetrics.cloneTransitions.lastDominantClone,
          to: currentDominantClone
        };
        
        this.balancedReplacementMetrics.cloneTransitions.transitionEvents.push(transitionEvent);
        
        // Keep transition history at a reasonable size
        if (this.balancedReplacementMetrics.cloneTransitions.transitionEvents.length > 10) {
          this.balancedReplacementMetrics.cloneTransitions.transitionEvents.shift();
        }
        
        // Emit clone transition event
        this.emit('cloneTransition', transitionEvent);
      }
      
      // Update last dominant clone
      this.balancedReplacementMetrics.cloneTransitions.lastDominantClone = currentDominantClone;
    }
  }
  
  /**
   * Calculate clone balance metric based on clone percentages
   * @param {Object} clonePercentages - Percentage of total population for each clone
   * @private
   */
  _calculateCloneBalance(clonePercentages) {
    // Get active clones (those with non-zero population)
    const activeClones = Object.keys(clonePercentages).filter(clone => clonePercentages[clone] > 0);
    
    if (activeClones.length <= 1) {
      // Only one active clone, balance is low
      this.balancedReplacementMetrics.cloneBalance = 0.2;
      return;
    }
    
    // Calculate ideal percentage (equal distribution)
    const idealPercentage = 1 / activeClones.length;
    
    // Calculate sum of squared differences from ideal
    let sumSquaredDiff = 0;
    activeClones.forEach(clone => {
      sumSquaredDiff += Math.pow(clonePercentages[clone] - idealPercentage, 2);
    });
    
    // Calculate standard deviation
    const stdDev = Math.sqrt(sumSquaredDiff / activeClones.length);
    
    // Convert to balance metric (1.0 = perfect balance, 0.0 = complete imbalance)
    this.balancedReplacementMetrics.cloneBalance = Math.max(0, 1 - stdDev * 3);
  }
  
  /**
   * Calculate replacement ratio between new cells and dying cells
   * This helps track how effectively new cells are replacing dying ones
   * @private
   */
  _calculateReplacementRatio() {
    if (!this.cellManager) return;
    
    // Get recent division and death counts
    const recentDivisions = this.cellManager.divisionCount || 0;
    const recentDeaths = this.cellManager.deathCount || 0;
    
    // Calculate replacement ratio (avoid division by zero)
    if (recentDeaths > 0) {
      this.balancedReplacementMetrics.replacementRatio = recentDivisions / recentDeaths;
    } else if (recentDivisions > 0) {
      // If divisions but no deaths, set a high ratio
      this.balancedReplacementMetrics.replacementRatio = 2.0;
    } else {
      // No divisions or deaths, set to neutral
      this.balancedReplacementMetrics.replacementRatio = 1.0;
    }
    
    // Emit event with replacement ratio
    this.emit('replacementRatioUpdated', {
      replacementRatio: this.balancedReplacementMetrics.replacementRatio,
      recentDivisions: recentDivisions,
      recentDeaths: recentDeaths,
      time: Date.now()
    });
  }
  
  /**
   * Apply selective pressure to maintain population balance
   * This helps ensure that no single clone dominates for too long
   * @param {string|null} dominantClone - Current dominant clone
   * @param {Array} decliningClones - Array of declining clone identifiers
   * @param {Object} cloneStatePopulations - Population counts by clone and state
   * @private
   */
  _applySelectivePressure(dominantClone, decliningClones, cloneStatePopulations) {
    if (!this.cellManager) return;
    
    // Skip if no dominant clone
    if (!dominantClone) return;
    
    // Get cells from dominant clone
    const dominantCells = this.cellManager.getCellsByClone(dominantClone);
    
    // Skip if not enough cells
    if (dominantCells.length < 10) return;
    
    // Calculate dominance factor (how much this clone dominates)
    const totalCells = this.cellManager.getCellCount();
    const dominanceFactor = dominantCells.length / totalCells;
    
    // Only apply pressure if dominance is very high
    if (dominanceFactor > 0.7) {
      // Calculate how many cells to affect
      const cellsToAffect = Math.ceil(dominantCells.length * 0.05); // Affect 5% of dominant cells
      
      // Get dividing cells from dominant clone
      const dividingCells = dominantCells.filter(cell => cell.state === 'dividing');
      
      // Select cells to apply pressure to (prefer older cells)
      const sortedCells = dividingCells.sort((a, b) => b.age - a.age);
      const selectedCells = sortedCells.slice(0, cellsToAffect);
      
      // Apply selective pressure by increasing senescence probability
      selectedCells.forEach(cell => {
        // 20% chance of becoming senescent
        if (Math.random() < 0.2) {
          const wasTransitioned = cell.transitionState('senescent');
          
          if (wasTransitioned) {
            // Emit selective pressure event
            this.emit('selectivePressureApplied', {
              cell: cell,
              cellId: cell.id,
              clone: cell.clone,
              dominanceFactor: dominanceFactor,
              time: Date.now()
            });
          }
        }
      });
    }
  }
  
  /**
   * Adjust stem cell activation thresholds based on clone balance
   * This helps ensure balanced replacement of old populations with new ones
   * @param {string|null} dominantClone - Current dominant clone
   * @param {Array} decliningClones - Array of declining clone identifiers
   * @param {Array} highSenescenceClones - Clones with high senescence rates
   * @private
   */
  _adjustStemCellActivation(dominantClone, decliningClones, highSenescenceClones = []) {
    if (!this.stemCellManager) return;
    
    // Get current activation threshold
    const baseThreshold = this.stemCellManager.getActivationThreshold();
    
    // Adjust thresholds for each clone
    Object.keys(this.clonePopulationHistory).forEach(clone => {
      let threshold = baseThreshold;
      let adjustmentFactor = 1.0;
      let adjustmentReason = [];
      
      // Lower threshold for declining clones to encourage activation
      if (decliningClones.includes(clone)) {
        adjustmentFactor *= 0.7; // 30% lower threshold
        adjustmentReason.push('declining');
      }
      
      // Lower threshold for clones with high senescence to encourage replacement
      if (highSenescenceClones.includes(clone)) {
        adjustmentFactor *= 0.8; // 20% lower threshold
        adjustmentReason.push('high_senescence');
      }
      
      // Raise threshold for dominant clone to discourage further activation
      if (clone === dominantClone) {
        adjustmentFactor *= 1.3; // 30% higher threshold
        adjustmentReason.push('dominant');
      }
      
      // Adjust based on clone balance
      if (this.balancedReplacementMetrics.cloneBalance < 0.4) {
        // Poor balance - encourage underrepresented clones
        const clonePopulation = this.clonePopulationHistory[clone][this.clonePopulationHistory[clone].length - 1] || 0;
        const totalPopulation = this.populationHistory[this.populationHistory.length - 1] || 1;
        const cloneRatio = clonePopulation / totalPopulation;
        
        if (cloneRatio < 0.2) {
          // Underrepresented clone - lower threshold
          adjustmentFactor *= 0.8;
          adjustmentReason.push('underrepresented');
        } else if (cloneRatio > 0.5) {
          // Overrepresented clone - raise threshold
          adjustmentFactor *= 1.2;
          adjustmentReason.push('overrepresented');
        }
      }
      
      // Apply the adjustment
      threshold *= adjustmentFactor;
      
      // Ensure threshold stays within reasonable bounds
      threshold = Math.max(0.1, Math.min(0.9, threshold));
      
      // Set clone-specific activation threshold
      this.stemCellManager.setCloneActivationThreshold(clone, threshold);
      
      // Emit event with adjustment details
      this.emit('stemCellActivationThresholdAdjusted', {
        clone: clone,
        baseThreshold: baseThreshold,
        adjustedThreshold: threshold,
        adjustmentFactor: adjustmentFactor,
        adjustmentReasons: adjustmentReason,
        time: Date.now()
      });
    });
  }
  
  /**
   * Adjust division rates based on current population
   * @param {number} currentPopulation - Current cell count
   */
  _adjustDivisionRates(currentPopulation) {
    if (!this.cellManager) return;
    
    // Calculate how close we are to target population
    const populationRatio = currentPopulation / this.targetPopulation;
    
    // Calculate new division probability
    let divisionProbability;
    
    if (populationRatio < 0.5) {
      // Population is very low - use maximum division rate
      divisionProbability = this.divisionRateMax;
    } else if (populationRatio > 1.2) {
      // Population is too high - use minimum division rate
      divisionProbability = this.divisionRateBase * 0.5;
    } else if (populationRatio > 0.9) {
      // Near target - scale down division rate as we approach target
      const scale = Math.max(0.5, 1 - (populationRatio - 0.9) * 5);
      divisionProbability = this.divisionRateBase * scale;
    } else {
      // Below target but not critically - scale up division rate
      const scale = 1 + (0.9 - populationRatio) * 2;
      divisionProbability = this.divisionRateBase * Math.min(scale, 2.5);
    }
    
    // Update division probability in cell manager
    this.cellManager.divisionProbabilityBase = divisionProbability;
    
    // Emit event
    this.emit('divisionRateAdjusted', {
      newRate: divisionProbability,
      populationRatio: populationRatio
    });
  }
  
  /**
   * Adjust death rates based on current population
   * @param {number} currentPopulation - Current cell count
   */
  _adjustDeathRates(currentPopulation) {
    if (!this.cellManager) return;
    
    // Calculate how close we are to target population
    const populationRatio = currentPopulation / this.targetPopulation;
    
    // Calculate new death rate
    let deathRate;
    
    if (populationRatio > 1.5) {
      // Population is very high - use maximum death rate
      deathRate = this.deathRateMax;
    } else if (populationRatio < 0.8) {
      // Population is too low - use minimum death rate
      deathRate = this.deathRateBase * 0.5;
    } else if (populationRatio > 1.0) {
      // Above target - scale up death rate
      const scale = 1 + (populationRatio - 1.0) * 3;
      deathRate = this.deathRateBase * Math.min(scale, 3.0);
    } else {
      // Below target - scale down death rate
      const scale = Math.max(0.5, populationRatio);
      deathRate = this.deathRateBase * scale;
    }
    
    // Store death rate for use in senescence calculations
    this.currentDeathRate = deathRate;
    
    // Emit event
    this.emit('deathRateAdjusted', {
      newRate: deathRate,
      populationRatio: populationRatio
    });
  }
  
  /**
   * Boost division rates to increase population
   * Called when population is too low
   * @private
   */
  _boostDivisionRates() {
    if (!this.cellManager) return;
    
    // Temporarily boost division probability
    const boostedRate = this.divisionRateMax * 1.5;
    const originalRate = this.cellManager.divisionProbabilityBase;
    
    this.cellManager.divisionProbabilityBase = boostedRate;
    
    // Reset after a short time
    setTimeout(() => {
      if (this.cellManager) {
        this.cellManager.divisionProbabilityBase = originalRate;
      }
    }, 2000); // 2 seconds
    
    // Emit event
    this.emit('divisionRateBoosted', {
      originalRate: originalRate,
      boostedRate: boostedRate
    });
  }
  
  /**
   * Increase senescence to reduce population
   * Called when population is too high
   * @private
   */
  _increaseSenescence() {
    if (!this.cellManager) return;
    
    // Get dividing cells
    const dividingCells = this.cellManager.getCellsByState('dividing');
    
    // Calculate how many cells to make senescent
    const excessPopulation = this.cellManager.getCellCount() - this.targetPopulation;
    const cellsToAge = Math.min(dividingCells.length, Math.ceil(excessPopulation * 0.2));
    
    // Select random dividing cells to age
    const selectedCells = this._getRandomElements(dividingCells, cellsToAge);
    
    // Make selected cells senescent
    selectedCells.forEach(cell => {
      cell.transitionState('senescent');
    });
    
    // Emit event
    this.emit('senescenceIncreased', {
      cellsAged: selectedCells.length,
      excessPopulation: excessPopulation
    });
  }
  
  /**
   * Get random elements from an array
   * @param {Array} array - Source array
   * @param {number} count - Number of elements to select
   * @returns {Array} - Selected elements
   * @private
   */
  _getRandomElements(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  /**
   * Set the target population
   * @param {number} target - Target population
   */
  setTargetPopulation(target) {
    this.targetPopulation = Math.max(10, target);
    
    // Emit event
    this.emit('targetPopulationChanged', this.targetPopulation);
  }
  
  /**
   * Set the population tolerance (how much deviation from target is acceptable)
   * @param {number} tolerance - Tolerance as a fraction (0-1)
   */
  setPopulationTolerance(tolerance) {
    this.populationTolerance = Math.max(0.01, Math.min(0.5, tolerance));
  }
  
  /**
   * Get current population metrics
   * @returns {Object} - Population metrics
   */
  getPopulationMetrics() {
    return {
      currentPopulation: this.populationHistory[this.populationHistory.length - 1] || 0,
      targetPopulation: this.targetPopulation,
      populationHistory: [...this.populationHistory],
      clonePopulationHistory: {
        red: [...this.clonePopulationHistory.red],
        green: [...this.clonePopulationHistory.green],
        yellow: [...this.clonePopulationHistory.yellow]
      },
      homeostasisMetrics: { ...this.homeostasisMetrics }
    };
  }
  
  /**
   * Get clone-specific population data
   * @param {string} clone - Clone identifier (optional)
   * @returns {Object|Array} - Clone population data
   */
  getClonePopulationData(clone) {
    if (clone && this.clonePopulationHistory[clone]) {
      return [...this.clonePopulationHistory[clone]];
    }
    
    return {
      red: [...this.clonePopulationHistory.red],
      green: [...this.clonePopulationHistory.green],
      yellow: [...this.clonePopulationHistory.yellow]
    };
  }
}

export default PopulationController;