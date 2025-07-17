// Import required modules
import Cell from '../src/core/Cell.js';
import StemCell from '../src/core/StemCell.js';
import EventEmitter from '../utils/EventEmitter.js';

// Simple simulation class for testing homeostasis mechanisms
class SimpleSimulation extends EventEmitter {
    constructor(canvas) {
        super();
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cells = [];
        this.running = false;
        this.maxCells = 100;
        this.frameCount = 0;
        
        // Boundary
        this.cageCenter = { x: canvas.width / 2, y: canvas.height / 2 };
        this.cageRadius = 50;
        this.targetCageRadius = 200;
        
        // Cell tracking
        this.cellsByClone = { red: [], green: [], yellow: [] };
        this.cellsByState = { dividing: [], 'non-dividing': [], senescent: [] };
        
        // Homeostasis metrics
        this.homeostasisMetrics = {
            populationStability: 1.0,
            cloneBalance: 1.0,
            resourceCompetition: 0.0,
            boundaryEffects: 0.0
        };
        
        // Add initial cells
        this.addInitialCells();
    }
    
    addInitialCells() {
        // Add one cell of each clone
        this.addCell(this.cageCenter.x, this.cageCenter.y, 'red');
        this.addCell(this.cageCenter.x + 20, this.cageCenter.y, 'green');
        this.addCell(this.cageCenter.x - 20, this.cageCenter.y, 'yellow');
    }
    
    addCell(x, y, clone) {
        const cell = new Cell(x, y, clone, 1);
        
        // Add physics body (simplified)
        cell.body = {
            position: { x, y },
            velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 }
        };
        
        this.cells.push(cell);
        this.cellsByClone[clone].push(cell);
        this.cellsByState[cell.state].push(cell);
        
        return cell;
    }
    
    start() {
        if (!this.running) {
            this.running = true;
            this.loop();
        }
    }
    
    stop() {
        this.running = false;
    }
    
    reset() {
        this.cells = [];
        this.cellsByClone = { red: [], green: [], yellow: [] };
        this.cellsByState = { dividing: [], 'non-dividing': [], senescent: [] };
        this.frameCount = 0;
        this.cageRadius = 50;
        this.addInitialCells();
        this.updateStats();
    }
    
    loop() {
        if (!this.running) return;
        
        this.update();
        this.draw();
        this.frameCount++;
        
        requestAnimationFrame(() => this.loop());
    }
    
    update() {
        // Update cells
        for (let i = this.cells.length - 1; i >= 0; i--) {
            const cell = this.cells[i];
            const oldState = cell.state;
            
            // Update cell
            cell.update();
            
            // Check for state changes
            if (cell.state !== oldState) {
                // Remove from old state array
                const oldStateIndex = this.cellsByState[oldState].indexOf(cell);
                if (oldStateIndex !== -1) {
                    this.cellsByState[oldState].splice(oldStateIndex, 1);
                }
                
                // Add to new state array
                this.cellsByState[cell.state].push(cell);
                
                // Emit event
                this.emit('cellStateChanged', cell, oldState, cell.state);
            }
            
            // Check if cell should die
            if (cell.age > cell.maxAge) {
                // Remove cell
                this.cells.splice(i, 1);
                
                // Remove from clone array
                const cloneIndex = this.cellsByClone[cell.clone].indexOf(cell);
                if (cloneIndex !== -1) {
                    this.cellsByClone[cell.clone].splice(cloneIndex, 1);
                }
                
                // Remove from state array
                const stateIndex = this.cellsByState[cell.state].indexOf(cell);
                if (stateIndex !== -1) {
                    this.cellsByState[cell.state].splice(stateIndex, 1);
                }
                
                // Emit event
                this.emit('cellDied', cell);
            }
            
            // Update cell position (simplified physics)
            if (cell.body) {
                cell.body.position.x += cell.body.velocity.x * 0.5;
                cell.body.position.y += cell.body.velocity.y * 0.5;
                
                // Apply boundary forces
                this.applyBoundaryForces(cell);
                
                // Dampen movement
                cell.body.velocity.x *= 0.98;
                cell.body.velocity.y *= 0.98;
            }
        }
        
        // Process divisions
        if (this.cells.length < this.maxCells) {
            const newCells = [];
            
            this.cells.forEach(cell => {
                if (Math.random() < 0.01 && cell.state === 'dividing' && cell.canDivide) {
                    const childCell = cell.divide();
                    if (childCell) {
                        // Add physics body (simplified)
                        childCell.body = {
                            position: { 
                                x: cell.body.position.x + (Math.random() - 0.5) * 10,
                                y: cell.body.position.y + (Math.random() - 0.5) * 10
                            },
                            velocity: { 
                                x: (Math.random() - 0.5) * 2,
                                y: (Math.random() - 0.5) * 2
                            }
                        };
                        
                        newCells.push(childCell);
                    }
                }
            });
            
            // Add new cells
            newCells.forEach(cell => {
                this.cells.push(cell);
                this.cellsByClone[cell.clone].push(cell);
                this.cellsByState[cell.state].push(cell);
                this.emit('cellCreated', cell);
            });
        }
        
        // Apply homeostasis mechanisms
        if (this.frameCount % 30 === 0) {
            this.applyBoundarySenescence();
            this.applyResourceCompetition();
            this.updateCageExpansion();
            this.updateHomeostasisMetrics();
        }
        
        // Update stats every 30 frames
        if (this.frameCount % 30 === 0) {
            this.updateStats();
        }
    }
    
    applyBoundaryForces(cell) {
        if (!cell.body) return;
        
        // Calculate distance from center
        const dx = cell.body.position.x - this.cageCenter.x;
        const dy = cell.body.position.y - this.cageCenter.y;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // If outside boundary, push back in
        if (distanceFromCenter > this.cageRadius - 5) {
            // Calculate normalized direction vector
            const nx = dx / distanceFromCenter;
            const ny = dy / distanceFromCenter;
            
            // Apply force towards center
            const forceMagnitude = 0.5 * (distanceFromCenter - (this.cageRadius - 5));
            cell.body.velocity.x -= nx * forceMagnitude;
            cell.body.velocity.y -= ny * forceMagnitude;
            
            // Move cell inside boundary
            const newDistance = this.cageRadius - 5;
            cell.body.position.x = this.cageCenter.x + nx * newDistance;
            cell.body.position.y = this.cageCenter.y + ny * newDistance;
        }
    }
    
    applyBoundarySenescence() {
        // Get all dividing and non-dividing cells
        const activeCells = [
            ...this.cellsByState['dividing'],
            ...this.cellsByState['non-dividing']
        ];
        
        // Track cells affected by boundary
        let cellsAffected = 0;
        
        // Check each cell for boundary proximity
        activeCells.forEach(cell => {
            if (!cell.body) return;
            
            // Calculate distance from center
            const dx = cell.body.position.x - this.cageCenter.x;
            const dy = cell.body.position.y - this.cageCenter.y;
            const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate distance from boundary as percentage of radius
            const distanceFromBoundary = (this.cageRadius - distanceFromCenter) / this.cageRadius;
            
            // If cell is close to boundary, apply senescence with probability
            if (distanceFromBoundary < 0.15) {
                // Probability increases as cell gets closer to boundary
                const senescenceProbability = 0.05 * (1 - distanceFromBoundary / 0.15);
                
                // Adjust probability based on cell age
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
                        
                        // Emit event
                        this.emit('boundarySenescence', {
                            cell: cell,
                            cellId: cell.id,
                            clone: cell.clone,
                            distanceFromBoundary: distanceFromBoundary
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
    }
    
    applyResourceCompetition() {
        // Get all dividing cells
        const dividingCells = this.cellsByState['dividing'];
        
        // Skip if not enough cells for competition
        if (dividingCells.length < 10) return;
        
        // Track cells affected by resource competition
        let cellsAffected = 0;
        
        // Calculate global resource availability
        const totalCells = this.cells.length;
        const globalResourceFactor = Math.max(0.5, Math.min(1.0, this.maxCells / totalCells));
        
        // Check each cell for crowding
        dividingCells.forEach(cell => {
            if (!cell.body) return;
            
            // Find neighboring cells within competition radius
            const neighbors = this.findNeighboringCells(cell, 20);
            
            // Calculate crowding factor
            const crowdingFactor = Math.min(1.0, neighbors.length / 6);
            
            // If crowding is above threshold, apply senescence with probability
            if (crowdingFactor > 0.7) {
                // Base probability increases with crowding
                let competitionProbability = 0.03 * (crowdingFactor - 0.7) / 0.3;
                
                // Apply senescence with calculated probability
                if (Math.random() < competitionProbability) {
                    // Transition to senescent state
                    const wasTransitioned = cell.transitionState('senescent');
                    
                    if (wasTransitioned) {
                        cellsAffected++;
                        
                        // Update resource competition metric
                        this.homeostasisMetrics.resourceCompetition = 
                            Math.min(1.0, this.homeostasisMetrics.resourceCompetition + 0.05);
                        
                        // Emit event
                        this.emit('resourceCompetition', {
                            cell: cell,
                            cellId: cell.id,
                            clone: cell.clone,
                            neighbors: neighbors.length
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
    }
    
    findNeighboringCells(cell, radius) {
        if (!cell.body) return [];
        
        // Find cells within radius
        return this.cells.filter(otherCell => {
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
    
    updateCageExpansion() {
        // Calculate target cage radius based on cell population
        const cellCount = this.cells.length;
        
        // Base radius plus expansion based on population
        const populationRatio = Math.min(1, cellCount / this.maxCells);
        const baseExpansionFactor = Math.sqrt(populationRatio);
        
        // Calculate cell pressure on the boundary
        const cellPressure = this.calculateCellPressure();
        
        // Adjust expansion factor based on cell pressure
        const pressureAdjustment = cellPressure * 0.3;
        const expansionFactor = baseExpansionFactor + pressureAdjustment;
        
        // Calculate target radius
        const minRadius = 50;
        const maxRadius = 200;
        this.targetCageRadius = minRadius + (maxRadius - minRadius) * expansionFactor;
        
        // Dynamic expansion speed
        const baseExpansionSpeed = 0.05;
        const expansionSpeed = baseExpansionSpeed * (1 + cellPressure * 2);
        
        // Calculate difference between current and target radius
        const difference = this.targetCageRadius - this.cageRadius;
        
        // Apply resistance when expanding
        const adjustedDifference = difference > 0 
            ? difference * (1 - 0.3 * populationRatio)
            : difference * 1.2;
        
        if (Math.abs(difference) > 0.1) {
            // Apply the change with dynamic speed
            this.cageRadius += adjustedDifference * expansionSpeed;
            
            // Ensure radius stays within bounds
            this.cageRadius = Math.max(minRadius, Math.min(maxRadius, this.cageRadius));
            
            // Emit event
            this.emit('cageExpansion', {
                radius: this.cageRadius,
                targetRadius: this.targetCageRadius,
                cellPressure: cellPressure
            });
        }
    }
    
    calculateCellPressure() {
        if (this.cells.length === 0) return 0;
        
        // Count cells near the boundary
        const boundaryThreshold = this.cageRadius * 0.15;
        let cellsNearBoundary = 0;
        
        this.cells.forEach(cell => {
            if (!cell.body) return;
            
            // Calculate distance from center
            const dx = cell.body.position.x - this.cageCenter.x;
            const dy = cell.body.position.y - this.cageCenter.y;
            const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate distance from boundary
            const distanceFromBoundary = this.cageRadius - distanceFromCenter;
            
            // Count cells near boundary
            if (distanceFromBoundary < boundaryThreshold) {
                const proximityFactor = 1 - (distanceFromBoundary / boundaryThreshold);
                cellsNearBoundary += proximityFactor;
            }
        });
        
        // Calculate pressure factor
        return Math.min(1.0, cellsNearBoundary / (this.cells.length * 0.3));
    }
    
    updateHomeostasisMetrics() {
        // Calculate population stability
        const currentPopulation = this.cells.length;
        const populationRatio = currentPopulation / this.maxCells;
        this.homeostasisMetrics.populationStability = Math.max(0, 1 - Math.abs(1 - populationRatio));
        
        // Calculate clone balance
        const activeClones = Object.keys(this.cellsByClone).filter(clone => 
            this.cellsByClone[clone].length > 0
        );
        
        if (activeClones.length > 1) {
            // Calculate standard deviation of clone populations
            const cloneValues = activeClones.map(clone => this.cellsByClone[clone].length);
            const mean = cloneValues.reduce((sum, val) => sum + val, 0) / cloneValues.length;
            const variance = cloneValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / cloneValues.length;
            const stdDev = Math.sqrt(variance);
            
            // Clone balance is higher when standard deviation is lower
            const cv = mean > 0 ? stdDev / mean : 1;
            this.homeostasisMetrics.cloneBalance = Math.max(0, 1 - Math.min(1, cv));
        } else {
            // Only one active clone, balance is low
            this.homeostasisMetrics.cloneBalance = 0.2;
        }
        
        // Emit metrics update event
        this.emit('homeostasisMetricsUpdated', this.homeostasisMetrics);
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw boundary
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
        
        // Draw cells
        this.cells.forEach(cell => {
            if (!cell.body) return;
            
            // Get color based on clone and state
            let color;
            switch (cell.clone) {
                case 'red':
                    color = cell.state === 'dividing' ? '#ff4444' : 
                           (cell.state === 'non-dividing' ? '#cc3333' : '#aa2222');
                    break;
                case 'green':
                    color = cell.state === 'dividing' ? '#44ff44' : 
                           (cell.state === 'non-dividing' ? '#33cc33' : '#22aa22');
                    break;
                case 'yellow':
                    color = cell.state === 'dividing' ? '#ffff44' : 
                           (cell.state === 'non-dividing' ? '#cccc33' : '#aaaa22');
                    break;
                default:
                    color = '#ffffff';
            }
            
            // Draw cell
            this.ctx.beginPath();
            this.ctx.fillStyle = color;
            this.ctx.arc(cell.body.position.x, cell.body.position.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw border
            this.ctx.beginPath();
            this.ctx.strokeStyle = cell.state === 'senescent' ? '#888888' : '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.arc(cell.body.position.x, cell.body.position.y, 5, 0, Math.PI * 2);
            this.ctx.stroke();
        });
    }
    
    updateStats() {
        // Update cell count
        document.getElementById('cellCount').textContent = this.cells.length;
        
        // Update clone counts
        document.getElementById('redCount').textContent = this.cellsByClone.red.length;
        document.getElementById('greenCount').textContent = this.cellsByClone.green.length;
        document.getElementById('yellowCount').textContent = this.cellsByClone.yellow.length;
        
        // Update state counts
        document.getElementById('dividingCount').textContent = this.cellsByState.dividing.length;
        document.getElementById('nonDividingCount').textContent = this.cellsByState['non-dividing'].length;
        document.getElementById('senescentCount').textContent = this.cellsByState.senescent.length;
        
        // Update homeostasis metrics
        document.getElementById('populationStability').textContent = 
            `${Math.round(this.homeostasisMetrics.populationStability * 100)}%`;
        document.getElementById('cloneBalance').textContent = 
            `${Math.round(this.homeostasisMetrics.cloneBalance * 100)}%`;
        document.getElementById('resourceCompetition').textContent = 
            `${Math.round(this.homeostasisMetrics.resourceCompetition * 100)}%`;
        document.getElementById('boundaryEffects').textContent = 
            `${Math.round(this.homeostasisMetrics.boundaryEffects * 100)}%`;
    }
}

// Export for use in HTML
window.SimpleSimulation = SimpleSimulation;