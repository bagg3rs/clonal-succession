// Time tracking functions for clonal succession simulation

// Load saved time if available
function loadSavedTime() {
  const savedTime = localStorage.getItem('clonalSuccessionTime');
  if (savedTime) {
    try {
      const parsedTime = JSON.parse(savedTime);
      simulationTimeData = parsedTime;
      updateTimeDisplay();
    } catch (e) {
      console.error("Error loading saved time:", e);
    }
  }
}

// Save time to localStorage
function saveSimulationTime() {
  try {
    localStorage.setItem('clonalSuccessionTime', JSON.stringify(simulationTimeData));
    simulationTimeData.lastSavedTime = new Date().toISOString();
  } catch (e) {
    console.error("Error saving time:", e);
  }
}

// Update simulation time based on frames
function updateSimulationTime() {
  simulationTimeData.totalFrames++;
  
  // Calculate time increments based on frames and speed
  const minuteIncrement = simulationSpeed / simulationTimeData.framesPerMinute;
  simulationTimeData.minutes += minuteIncrement;
  
  // Update hours when minutes reach 60
  if (simulationTimeData.minutes >= 60) {
    simulationTimeData.hours += Math.floor(simulationTimeData.minutes / 60);
    simulationTimeData.minutes %= 60;
  }
  
  // Update days when hours reach 24
  if (simulationTimeData.hours >= 24) {
    simulationTimeData.days += Math.floor(simulationTimeData.hours / 24);
    simulationTimeData.hours %= 24;
  }
  
  // Update display
  updateTimeDisplay();
  
  // Save time every 5 minutes (300 frames at 60fps)
  if (simulationTimeData.totalFrames % 300 === 0) {
    saveSimulationTime();
  }
}

// Format time for display
function updateTimeDisplay() {
  const days = simulationTimeData.days;
  const hours = Math.floor(simulationTimeData.hours).toString().padStart(2, '0');
  const minutes = Math.floor(simulationTimeData.minutes).toString().padStart(2, '0');
  
  document.getElementById('simulation-time').textContent = `Day ${days}, ${hours}:${minutes}`;
}

// Reset time to day 1
function resetTime() {
  simulationTimeData = {
    totalFrames: 0,
    days: 1,
    hours: 0,
    minutes: 0,
    framesPerMinute: 10,
    lastSavedTime: null
  };
  
  updateTimeDisplay();
  saveSimulationTime();
}