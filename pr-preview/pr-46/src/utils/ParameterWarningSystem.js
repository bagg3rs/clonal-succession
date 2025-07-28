/**
 * ParameterWarningSystem class
 * Provides feedback for extreme parameter values with visual indicators and tooltips
 */
class ParameterWarningSystem {
  /**
   * Create a new parameter warning system
   * @param {Object} options - Configuration options
   * @param {ParameterManager} options.parameterManager - Reference to the parameter manager
   */
  constructor(options = {}) {
    this.parameterManager = options.parameterManager;
    this.warningThresholds = this._initializeWarningThresholds();
    this.warningMessages = this._initializeWarningMessages();
    this.activeWarnings = new Map();
    
    // Register event listeners
    if (this.parameterManager) {
      this.parameterManager.on('parameterChanged', (data) => {
        this._checkParameterValue(data.key, data.newValue);
      });
    }
  }
  
  /**
   * Initialize warning thresholds for parameters
   * @returns {Object} - Warning thresholds for each parameter
   * @private
   */
  _initializeWarningThresholds() {
    return {
      maxCells: {
        low: { threshold: 30, severity: 'mild' },
        high: { threshold: 150, severity: 'moderate' }
      },
      activationThreshold: {
        low: { threshold: 0.15, severity: 'moderate' },
        high: { threshold: 0.7, severity: 'severe' }
      },
      divisionLimit: {
        low: { threshold: 10, severity: 'moderate' },
        high: { threshold: 40, severity: 'severe' }
      },
      suppressionStrength: {
        low: { threshold: 0.3, severity: 'moderate' },
        high: { threshold: 1.7, severity: 'severe' }
      },
      senescenceRate: {
        low: { threshold: 0.6, severity: 'mild' },
        high: { threshold: 1.7, severity: 'moderate' }
      },
      cellLifespan: {
        low: { threshold: 70, severity: 'moderate' },
        high: { threshold: 170, severity: 'moderate' }
      }
    };
  }
  
  /**
   * Initialize warning messages for parameters
   * @returns {Object} - Warning messages for each parameter
   * @private
   */
  _initializeWarningMessages() {
    return {
      maxCells: {
        low: 'Low cell count may result in unstable population dynamics',
        high: 'High cell count may impact simulation performance'
      },
      activationThreshold: {
        low: 'Low activation threshold causes biologically unrealistic rapid stem cell activation',
        high: 'High activation threshold may prevent stem cell activation entirely'
      },
      divisionLimit: {
        low: 'Low division limit results in unrealistically short clone lifespans',
        high: 'High division limit is biologically unrealistic for tumor cells'
      },
      suppressionStrength: {
        low: 'Low suppression strength causes ineffective stem cell regulation',
        high: 'High suppression strength may prevent succession events'
      },
      senescenceRate: {
        low: 'Low senescence rate results in unrealistically long cell lifespans',
        high: 'High senescence rate causes cells to age too quickly'
      },
      cellLifespan: {
        low: 'Low cell lifespan causes cells to die too quickly',
        high: 'High cell lifespan is biologically unrealistic'
      }
    };
  }
  
  /**
   * Check a parameter value against warning thresholds
   * @param {string} key - Parameter key
   * @param {any} value - Parameter value
   * @private
   */
  _checkParameterValue(key, value) {
    // Skip if no thresholds defined for this parameter
    if (!this.warningThresholds[key]) return;
    
    const thresholds = this.warningThresholds[key];
    const messages = this.warningMessages[key];
    let warning = null;
    
    // Check for low threshold
    if (thresholds.low && value <= thresholds.low.threshold) {
      warning = {
        message: messages.low,
        severity: thresholds.low.severity,
        type: 'low'
      };
    }
    // Check for high threshold
    else if (thresholds.high && value >= thresholds.high.threshold) {
      warning = {
        message: messages.high,
        severity: thresholds.high.severity,
        type: 'high'
      };
    }
    
    // Update active warnings
    if (warning) {
      this.activeWarnings.set(key, warning);
      this._showWarning(key, warning);
    } else {
      if (this.activeWarnings.has(key)) {
        this._clearWarning(key);
        this.activeWarnings.delete(key);
      }
    }
  }
  
  /**
   * Show a warning for a parameter
   * @param {string} key - Parameter key
   * @param {Object} warning - Warning details
   * @private
   */
  _showWarning(key, warning) {
    // Find parameter control element
    const paramControl = this._findParameterControl(key);
    if (!paramControl) return;
    
    // Create or update warning indicator
    let warningIndicator = paramControl.querySelector('.parameter-warning-indicator');
    
    if (!warningIndicator) {
      warningIndicator = document.createElement('div');
      warningIndicator.className = 'parameter-warning-indicator';
      paramControl.appendChild(warningIndicator);
    }
    
    // Set severity class
    warningIndicator.className = `parameter-warning-indicator ${warning.severity}`;
    
    // Set warning icon and tooltip
    warningIndicator.innerHTML = `
      <span class="warning-icon">⚠️</span>
      <div class="warning-tooltip">
        <div class="warning-title">${this._getSeverityLabel(warning.severity)} Warning</div>
        <div class="warning-message">${warning.message}</div>
        <div class="warning-biological-note">This setting is biologically unrealistic.</div>
      </div>
    `;
    
    // Add visual indicator to slider if applicable
    this._updateSliderIndicator(key, warning.type);
  }
  
  /**
   * Clear a warning for a parameter
   * @param {string} key - Parameter key
   * @private
   */
  _clearWarning(key) {
    // Find parameter control element
    const paramControl = this._findParameterControl(key);
    if (!paramControl) return;
    
    // Remove warning indicator
    const warningIndicator = paramControl.querySelector('.parameter-warning-indicator');
    if (warningIndicator) {
      warningIndicator.remove();
    }
    
    // Clear slider indicator
    this._clearSliderIndicator(key);
  }
  
  /**
   * Update the slider indicator for a parameter
   * @param {string} key - Parameter key
   * @param {string} type - Warning type ('low' or 'high')
   * @private
   */
  _updateSliderIndicator(key, type) {
    const paramControl = this._findParameterControl(key);
    if (!paramControl) return;
    
    const slider = paramControl.querySelector('input[type="range"]');
    if (!slider) return;
    
    // Create or get slider warning zone
    let sliderWarningZone = paramControl.querySelector('.parameter-slider-warning-zone');
    if (!sliderWarningZone) {
      sliderWarningZone = document.createElement('div');
      sliderWarningZone.className = 'parameter-slider-warning-zone';
      slider.parentNode.insertBefore(sliderWarningZone, slider);
    }
    
    // Calculate position and width based on warning type
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const range = max - min;
    const threshold = this.warningThresholds[key][type].threshold;
    
    if (type === 'low') {
      // Warning zone from min to threshold
      const width = ((threshold - min) / range) * 100;
      sliderWarningZone.style.left = '0%';
      sliderWarningZone.style.width = `${width}%`;
      sliderWarningZone.classList.add('low');
      sliderWarningZone.classList.remove('high');
    } else {
      // Warning zone from threshold to max
      const left = ((threshold - min) / range) * 100;
      const width = 100 - left;
      sliderWarningZone.style.left = `${left}%`;
      sliderWarningZone.style.width = `${width}%`;
      sliderWarningZone.classList.add('high');
      sliderWarningZone.classList.remove('low');
    }
  }
  
  /**
   * Clear the slider indicator for a parameter
   * @param {string} key - Parameter key
   * @private
   */
  _clearSliderIndicator(key) {
    const paramControl = this._findParameterControl(key);
    if (!paramControl) return;
    
    const sliderWarningZone = paramControl.querySelector('.parameter-slider-warning-zone');
    if (sliderWarningZone) {
      sliderWarningZone.remove();
    }
  }
  
  /**
   * Find the parameter control element for a parameter
   * @param {string} key - Parameter key
   * @returns {HTMLElement|null} - Parameter control element or null if not found
   * @private
   */
  _findParameterControl(key) {
    if (!this.parameterManager || !this.parameterManager.container) return null;
    
    return this.parameterManager.container.querySelector(`[data-param-key="${key}"]`);
  }
  
  /**
   * Get a human-readable label for a severity level
   * @param {string} severity - Severity level ('mild', 'moderate', or 'severe')
   * @returns {string} - Human-readable label
   * @private
   */
  _getSeverityLabel(severity) {
    switch (severity) {
      case 'mild':
        return 'Minor';
      case 'moderate':
        return 'Moderate';
      case 'severe':
        return 'Critical';
      default:
        return 'Warning';
    }
  }
  
  /**
   * Check all current parameter values
   * This should be called after initialization to show warnings for initial values
   */
  checkAllParameters() {
    if (!this.parameterManager) return;
    
    Object.keys(this.parameterManager.parameters).forEach(key => {
      const value = this.parameterManager.parameters[key].value;
      this._checkParameterValue(key, value);
    });
  }
  
  /**
   * Add CSS styles for parameter warnings
   * This should be called after initialization
   */
  addStyles() {
    // Check if styles already exist
    if (document.getElementById('parameter-warning-styles')) return;
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'parameter-warning-styles';
    
    // Add CSS rules
    style.textContent = `
      .parameter-warning-indicator {
        position: absolute;
        top: 10px;
        right: 10px;
        cursor: pointer;
        z-index: 10;
      }
      
      .parameter-warning-indicator .warning-icon {
        font-size: 16px;
        opacity: 0.8;
        transition: opacity 0.2s;
      }
      
      .parameter-warning-indicator:hover .warning-icon {
        opacity: 1;
      }
      
      .parameter-warning-indicator.mild .warning-icon {
        color: #ffcc00;
      }
      
      .parameter-warning-indicator.moderate .warning-icon {
        color: #ff9900;
      }
      
      .parameter-warning-indicator.severe .warning-icon {
        color: #ff3300;
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
      
      .warning-tooltip {
        position: absolute;
        top: 100%;
        right: 0;
        width: 220px;
        padding: 10px;
        background: rgba(40, 40, 40, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 5px;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
        color: white;
        font-size: 12px;
        z-index: 100;
        opacity: 0;
        visibility: hidden;
        transform: translateY(10px);
        transition: opacity 0.3s, transform 0.3s, visibility 0.3s;
        pointer-events: none;
      }
      
      .parameter-warning-indicator:hover .warning-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateY(5px);
      }
      
      .warning-title {
        font-weight: bold;
        margin-bottom: 5px;
        color: #ff9900;
      }
      
      .parameter-warning-indicator.mild .warning-title {
        color: #ffcc00;
      }
      
      .parameter-warning-indicator.moderate .warning-title {
        color: #ff9900;
      }
      
      .parameter-warning-indicator.severe .warning-title {
        color: #ff3300;
      }
      
      .warning-message {
        margin-bottom: 5px;
      }
      
      .warning-biological-note {
        font-style: italic;
        color: #aaaaaa;
        font-size: 11px;
        margin-top: 5px;
      }
      
      .parameter-slider-warning-zone {
        position: absolute;
        height: 100%;
        background: rgba(255, 150, 0, 0.15);
        pointer-events: none;
        z-index: 1;
        border-radius: 3px;
      }
      
      .parameter-slider-warning-zone.low {
        background: linear-gradient(to right, rgba(255, 150, 0, 0.3), rgba(255, 150, 0, 0.05));
      }
      
      .parameter-slider-warning-zone.high {
        background: linear-gradient(to right, rgba(255, 150, 0, 0.05), rgba(255, 150, 0, 0.3));
      }
      
      .parameter-slider-container {
        position: relative;
      }
      
      .parameter-slider-container input[type="range"] {
        position: relative;
        z-index: 2;
        background: transparent;
      }
      
      /* Parameter value tooltip */
      .parameter-value-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(40, 40, 40, 0.9);
        color: white;
        padding: 3px 8px;
        border-radius: 3px;
        font-size: 11px;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s, visibility 0.2s;
        white-space: nowrap;
        pointer-events: none;
      }
      
      .parameter-value-display:hover .parameter-value-tooltip {
        opacity: 1;
        visibility: visible;
      }
    `;
    
    // Add to document
    document.head.appendChild(style);
  }
}

export default ParameterWarningSystem;