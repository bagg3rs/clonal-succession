// Import modules
import Simulation from '../src/core/Simulation.js';
import Cell from '../src/core/Cell.js';
import StemCell from '../src/core/StemCell.js';

// Initialize the simulation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('simulationCanvas');
    const ctx = canvas.getContext('2d');
    
    try {
        // Create simulation instance
        const simulation = new Simulation({
            canvas: canvas,
            parameters: {
                maxCells: 100,
                activationThreshold: 0.3,
                divisionLimit: 25,
                suppressionStrength: 1.0,
                senescenceRate: 1.0
            }
        });
        
        // Initialize the simulation
        simulation.init();
        
        // Set up UI controls
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const resetBtn = document.getElementById('resetBtn');
        const speedSlider = document.getElementById('speedSlider');
        const maxCellsSlider = document.getElementById('maxCellsSlider');
        
        // Set up event handlers
        startBtn.addEventListener('click', () => {
            simulation.start();
            updateUI();
        });
        
        stopBtn.addEventListener('click', () => {
            simulation.stop();
        });
        
        resetBtn.addEventListener('click', () => {
            simulation.reset();
            clearEventLog();
            updateUI();
        });
        
        speedSlider.addEventListener('input', () => {
            const speed = parseInt(speedSlider.value);
            document.getElementById('speedValue').textContent = speed + 'x';
            simulation.setSpeed(speed);
        });
        
        maxCellsSlider.addEventListener('input', () => {
            const maxCells = parseInt(maxCellsSlider.value);
            document.getElementById('maxCellsValue').textContent = maxCells;
            simulation.cellManager.setMaxCells(maxCells);
            simulation.populationController.setTargetPopulation(maxCells);
        });
        
        // Set up event listeners for homeostasis events
        simulation.on('boundarySenescence', (details) => {
            logEvent('Boundary Senescence', `Cell ${details.cellId} (${details.clone}) became senescent`);
        });
        
        simulation.on('resourceCompetition', (details) => {
            logEvent('Resource Competition', `Cell ${details.cellId} (${details.clone}) became senescent`);
        });
        
        simulation.on('successionEvent', (details) => {
            logEvent('Succession Event', `Clone transition from ${details.oldClone} to ${details.newClone}`);
            updateUI();
        });
        
        // Update UI function
        function updateUI() {
            // Update every 30 frames
            if (simulation.frameCount % 30 !== 0) return;
            
            // Update population metrics
            const cellCount = simulation.cellManager.getCellCount();
            const maxCells = simulation.cellManager.maxCells;
            document.getElementById('populationValue').textContent = `${cellCount} / ${maxCells}`;
            
            // Update clone distribution
            const redCount = simulation.cellManager.getCellsByClone('red').length;
            const greenCount = simulation.cellManager.getCellsByClone('green').length;
            const yellowCount = simulation.cellManager.getCellsByClone('yellow').length;
            
            const redPercent = cellCount > 0 ? Math.round((redCount / cellCount) * 100) : 0;
            const greenPercent = cellCount > 0 ? Math.round((greenCount / cellCount) * 100) : 0;
            const yellowPercent = cellCount > 0 ? Math.round((yellowCount / cellCount) * 100) : 0;
            
            document.getElementById('cloneDistribution').textContent = 
                `Red: ${redPercent}%, Green: ${greenPercent}%, Yellow: ${yellowPercent}%`;
            
            // Update cell states
            const dividingCount = simulation.cellManager.getCellsByState('dividing').length;
            const nonDividingCount = simulation.cellManager.getCellsByState('non-dividing').length;
            const senescentCount = simulation.cellManager.getCellsByState('senescent').length;
            
            const dividingPercent = cellCount > 0 ? Math.round((dividingCount / cellCount) * 100) : 0;
            const nonDividingPercent = cellCount > 0 ? Math.round((nonDividingCount / cellCount) * 100) : 0;
            const senescentPercent = cellCount > 0 ? Math.round((senescentCount / cellCount) * 100) : 0;
            
            document.getElementById('cellStates').textContent = 
                `Dividing: ${dividingPercent}%, Non-dividing: ${nonDividingPercent}%, Senescent: ${senescentPercent}%`;
            
            // Update homeostasis metrics
            if (simulation.populationController) {
                const metrics = simulation.populationController.homeostasisMetrics;
                document.getElementById('populationStability').textContent = `${Math.round(metrics.populationStability * 100)}%`;
                document.getElementById('cloneBalance').textContent = `${Math.round(metrics.cloneBalance * 100)}%`;
                document.getElementById('resourceCompetition').textContent = `${Math.round(metrics.resourceCompetition * 100)}%`;
                document.getElementById('boundaryEffects').textContent = `${Math.round(metrics.boundaryEffects * 100)}%`;
            }
        }
        
        // Log events to the event log
        function logEvent(type, details) {
            const eventLog = document.getElementById('eventLog');
            const event = document.createElement('div');
            event.className = 'event';
            
            const time = new Date().toLocaleTimeString();
            event.innerHTML = `<span class="event-time">[${time}]</span> <span class="event-type">${type}:</span> <span class="event-details">${details}</span>`;
            
            eventLog.insertBefore(event, eventLog.firstChild);
            
            // Limit the number of events
            if (eventLog.children.length > 50) {
                eventLog.removeChild(eventLog.lastChild);
            }
        }
        
        // Clear the event log
        function clearEventLog() {
            const eventLog = document.getElementById('eventLog');
            eventLog.innerHTML = '';
        }
        
        // Set up animation frame callback to update UI
        simulation.on('timeUpdated', () => {
            updateUI();
        });
        
        // Start the simulation
        simulation.start();
        
        // Log success
        logEvent('System', 'Simulation initialized successfully');
    } catch (error) {
        console.error('Error initializing simulation:', error);
        document.getElementById('eventLog').innerHTML = `<div class="event">Error: ${error.message}</div>`;
    }
});