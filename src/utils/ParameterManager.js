/**
 * ParameterManager class
 * Manages simulation parameters with validation, persistence, and UI controls
 */
class ParameterManager {
  /**
   * Create a new parameter manager
   * @param {Object} options - Configuration options
   * @param {Object} options.simulation - Reference to the simulation
   * @param {HTMLElement} options.container - Container element for parameter controls
   * @param {Object} options.initialParameters - Initial parameter values
   */
  constructor(options = {}) {
    this.simulation = options.simulation;
    this.container = options.container;
    
    // Default parameters
    this.defaultParameters = {
      maxCells: {
        value: 100,
        min: 10,
        max: 200,
        step: 10,
        type: 'range',
        label: 'Max Cells',
        description: 'Maximum number of cells in the simulation',
        warning: 'High values may impact performance'
      },
      activationThreshold: {
        value: 0.3,
        min: 0.1,
        max: 0.9,
        step: 0.05,
        type: 'range',
        label: 'Activation Threshold',
        description: 'Suppression level below which stem cells can activate',
        warning: 'Low values may cause rapid succession cycles'
      },
      divisionLimit: {
        value: 25,
        min: 5,
        max: 50,
        step: 5,
        type: 'range',
        label: 'Division Limit',
        description: 'Maximum number of divisions per stem cell',
        warning: 'High values may cause population imbalance'
      },
      suppressionStrength: {
        value: 1.0,
        min: 0.1,
        max: 2.0,
        step: 0.1,
        type: 'range',
        label: 'Suppression Strength',
        description: 'Strength of the suppression signal',
        warning: 'Extreme values may disrupt succession cycles'
      },
      senescenceRate: {
        value: 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.1,
        type: 'range',
        label: 'Senescence Rate',
        description: 'Rate at which cells become senescent',
        warning: 'Low values may cause unrealistic cell lifespans'
      }
    };
    
    // Initialize parameters with defaults and any provided values
    this.parameters = {};
    Object.keys(this.defaultParameters).forEach(key => {
      this.parameters[key] = { 
        ...this.defaultParameters[key],
        value: options.initialParameters && options.initialParameters[key] !== undefined ? 
          options.initialParameters[key] : this.defaultParameters[key].value
      };
    });
    
    // Parameter presets
    this.presets = {
      default: {
        name: 'Default',
        description: 'Balanced parameters for normal succession cycles',
        values: {
          maxCells: 100,
          activationThreshold: 0.3,
          divisionLimit: 25,
          suppressionStrength: 1.0,
          senescenceRate: 1.0
        }
      },
      fastCycles: {
        name: 'Fast Cycles',
        description: 'Rapid succession cycles with shorter cell lifespans',
        values: {
          maxCells: 80,
          activationThreshold: 0.5,
          divisionLimit: 15,
          suppressionStrength: 0.7,
          senescenceRate: 1.5
        }
      },
      slowGrowth: {
        name: 'Slow Growth',
        description: 'Slower growth with longer-lived cells',
        values: {
          maxCells: 120,
          activationThreshold: 0.2,
          divisionLimit: 35,
          suppressionStrength: 1.3,
          senescenceRate: 0.7
        }
      },
      highCapacity: {
        name: 'High Capacity',
        description: 'Large population with strong suppression',
        values: {
          maxCells: 180,
          activationThreshold: 0.2,
          divisionLimit: 30,
          suppressionStrength: 1.5,
          senescenceRate: 0.8
        }
      }
    };
    
    // Create UI if container is provided
    if (this.container) {
      this._createUI();
    }
    
    // Load saved parameters if available
    this._loadSavedParameters();
    
    // Apply initial parameters to simulation
    if (this.simulation) {
      this._applyParametersToSimulation();
    }
  }
  
  /**
   * Create the parameter UI controls
   * @private
   */
  _createUI() {
    // Clear container
    this.container.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'parameter-header';
    header.innerHTML = '<h3>Simulation Parameters</h3>';
    this.container.appendChild(header);
    
    // Create preset selector
    this._createPresetSelector();
    
    // Create parameter controls
    Object.keys(this.parameters).forEach(key => {
      this._createParameterControl(key);
    });
    
    // Create save/reset buttons
    this._createActionButtons();
    
    // Add styles
    this._addStyles();
  }
  
  /**
   * Create preset selector dropdown
   * @private
   */
  _createPresetSelector() {
    const presetContainer = document.createElement('div');
    presetContainer.className = 'parameter-preset-container';
    
    const label = document.createElement('label');
    label.textContent = 'Parameter Preset:';
    presetContainer.appendChild(label);
    
    const select = document.createElement('select');
    select.className = 'parameter-preset-select';
    
    // Add presets to dropdown
    Object.keys(this.presets).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = this.presets[key].name;
      select.appendChild(option);
    });
    
    // Add custom option
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Custom';
    select.appendChild(customOption);
    
    // Add change event
    select.addEventListener('change', () => {
      const presetKey = select.value;
      if (presetKey !== 'custom') {
        this._applyPreset(presetKey);
      }
    });
    
    presetContainer.appendChild(select);
    
    // Add preset description
    const description = document.createElement('div');
    description.className = 'parameter-preset-description';
    presetContainer.appendChild(description);
    
    // Update description on select change
    select.addEventListener('change', () => {
      const presetKey = select.value;
      if (presetKey !== 'custom') {
        description.textContent = this.presets[presetKey].description;
      } else {
        description.textContent = 'Custom parameter settings';
      }
    });
    
    // Set initial description
    description.textContent = this.presets.default.description;
    
    this.container.appendChild(presetContainer);
    this.presetSelect = select;
  }
  
  /**
   * Create a control for a single parameter
   * @param {string} key - Parameter key
   * @private
   */
  _createParameterControl(key) {
    const param = this.parameters[key];
    
    const controlContainer = document.createElement('div');
    controlContainer.className = 'parameter-control';
    
    // Create label with tooltip
    const labelContainer = document.createElement('div');
    labelContainer.className = 'parameter-label-container';
    
    const label = document.createElement('label');
    label.textContent = param.label;
    label.title = param.description;
    labelContainer.appendChild(label);
    
    // Add info icon with tooltip
    const infoIcon = document.createElement('span');
    infoIcon.className = 'parameter-info-icon';
    infoIcon.textContent = 'ⓘ';
    infoIcon.title = param.description;
    labelContainer.appendChild(infoIcon);
    
    controlContainer.appendChild(labelContainer);
    
    // Create input based on type
    let input;
    if (param.type === 'range') {
      // Create range slider with value display
      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'parameter-slider-container';
      
      input = document.createElement('input');
      input.type = 'range';
      input.min = param.min;
      input.max = param.max;
      input.step = param.step;
      input.value = param.value;
      
      const valueDisplay = document.createElement('span');
      valueDisplay.className = 'parameter-value-display';
      valueDisplay.textContent = param.value;
      
      input.addEventListener('input', () => {
        valueDisplay.textContent = input.value;
        this._updateParameter(key, parseFloat(input.value));
      });
      
      sliderContainer.appendChild(input);
      sliderContainer.appendChild(valueDisplay);
      controlContainer.appendChild(sliderContainer);
    } else if (param.type === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = param.value;
      
      input.addEventListener('change', () => {
        this._updateParameter(key, input.checked);
      });
      
      controlContainer.appendChild(input);
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.value = param.value;
      
      input.addEventListener('change', () => {
        this._updateParameter(key, input.value);
      });
      
      controlContainer.appendChild(input);
    }
    
    // Add warning indicator if needed
    if (param.warning) {
      const warningIcon = document.createElement('span');
      warningIcon.className = 'parameter-warning-icon';
      warningIcon.textContent = '⚠️';
      warningIcon.title = param.warning;
      controlContainer.appendChild(warningIcon);
    }
    
    this.container.appendChild(controlContainer);
    
    // Store reference to input element
    param.inputElement = input;
  }
  
  /**
   * Create save and reset buttons
   * @private
   */
  _createActionButtons() {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'parameter-button-container';
    
    // Save button
    const saveButton = document.createElement('button');
    saveButton.className = 'parameter-button save-button';
    saveButton.textContent = 'Save Parameters';
    saveButton.addEventListener('click', () => {
      this._saveParameters();
    });
    buttonContainer.appendChild(saveButton);
    
    // Reset button
    const resetButton = document.createElement('button');
    resetButton.className = 'parameter-button reset-button';
    resetButton.textContent = 'Reset to Default';
    resetButton.addEventListener('click', () => {
      this._applyPreset('default');
    });
    buttonContainer.appendChild(resetButton);
    
    this.container.appendChild(buttonContainer);
  }
  
  /**
   * Add CSS styles for parameter controls
   * @private
   */
  _addStyles() {
    // Check if styles already exist
    if (document.getElementById('parameter-manager-styles')) return;
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'parameter-manager-styles';
    
    // Add CSS rules
    style.textContent = `
      .parameter-header h3 {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 16px;
        color: #ccc;
      }
      
      .parameter-preset-container {
        margin-bottom: 20px;
        padding: 10px;
        background: rgba(30, 30, 30, 0.7);
        border-radius: 5px;
      }
      
      .parameter-preset-container label {
        display: block;
        margin-bottom: 5px;
        color: #ccc;
      }
      
      .parameter-preset-select {
        width: 100%;
        padding: 5px;
        background: #333;
        color: white;
        border: 1px solid #555;
        border-radius: 3px;
      }
      
      .parameter-preset-description {
        margin-top: 5px;
        font-size: 12px;
        color: #aaa;
        font-style: italic;
      }
      
      .parameter-control {
        margin-bottom: 15px;
        padding: 10px;
        background: rgba(30, 30, 30, 0.7);
        border-radius: 5px;
        position: relative;
      }
      
      .parameter-label-container {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      }
      
      .parameter-label-container label {
        color: #ccc;
      }
      
      .parameter-info-icon {
        color: #888;
        cursor: help;
      }
      
      .parameter-slider-container {
        display: flex;
        align-items: center;
      }
      
      .parameter-slider-container input[type="range"] {
        flex-grow: 1;
        margin-right: 10px;
        background: #333;
      }
      
      .parameter-value-display {
        min-width: 30px;
        text-align: right;
        color: white;
      }
      
      .parameter-warning-icon {
        position: absolute;
        top: 10px;
        right: 10px;
        cursor: help;
      }
      
      .parameter-button-container {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
      }
      
      .parameter-button {
        padding: 8px 15px;
        border: none;
        border-radius: 3px;
        color: white;
        cursor: pointer;
      }
      
      .save-button {
        background: #2a6b9c;
      }
      
      .save-button:hover {
        background: #3a7bac;
      }
      
      .reset-button {
        background: #8c3a3a;
      }
      
      .reset-button:hover {
        background: #9c4a4a;
      }
    `;
    
    // Add to document
    document.head.appendChild(style);
  }
  
  /**
   * Update a parameter value
   * @param {string} key - Parameter key
   * @param {any} value - New parameter value
   * @private
   */
  _updateParameter(key, value) {
    if (this.parameters[key]) {
      // Validate value
      value = this._validateParameterValue(key, value);
      
      // Update parameter
      this.parameters[key].value = value;
      
      // Update simulation
      if (this.simulation) {
        this.simulation.setParameter(key, value);
      }
      
      // Set preset selector to custom
      if (this.presetSelect) {
        this.presetSelect.value = 'custom';
        
        // Update description
        const descriptionElement = this.container.querySelector('.parameter-preset-description');
        if (descriptionElement) {
          descriptionElement.textContent = 'Custom parameter settings';
        }
      }
      
      // Check for extreme values and show warnings
      this._checkExtremeValue(key, value);
    }
  }
  
  /**
   * Validate a parameter value
   * @param {string} key - Parameter key
   * @param {any} value - Parameter value to validate
   * @returns {any} - Validated value
   * @private
   */
  _validateParameterValue(key, value) {
    const param = this.parameters[key];
    
    if (param.type === 'range') {
      // Convert to number and clamp to min/max
      value = parseFloat(value);
      value = Math.max(param.min, Math.min(param.max, value));
    } else if (param.type === 'checkbox') {
      // Convert to boolean
      value = Boolean(value);
    }
    
    return value;
  }
  
  /**
   * Check if a parameter value is extreme and show warning
   * @param {string} key - Parameter key
   * @param {any} value - Parameter value
   * @private
   */
  _checkExtremeValue(key, value) {
    const param = this.parameters[key];
    
    if (param.type === 'range') {
      const range = param.max - param.min;
      const threshold = range * 0.1; // 10% from min or max is considered extreme
      
      const isExtreme = 
        value <= param.min + threshold || 
        value >= param.max - threshold;
      
      // Update warning visibility
      const controlElement = param.inputElement.closest('.parameter-control');
      if (controlElement) {
        let warningIcon = controlElement.querySelector('.parameter-warning-icon');
        
        if (isExtreme && !warningIcon && param.warning) {
          // Create warning icon if it doesn't exist
          warningIcon = document.createElement('span');
          warningIcon.className = 'parameter-warning-icon';
          warningIcon.textContent = '⚠️';
          warningIcon.title = param.warning;
          controlElement.appendChild(warningIcon);
        } else if (!isExtreme && warningIcon) {
          // Remove warning icon if value is not extreme
          warningIcon.style.display = 'none';
        } else if (isExtreme && warningIcon) {
          // Show warning icon if value is extreme
          warningIcon.style.display = '';
        }
      }
    }
  }
  
  /**
   * Apply a parameter preset
   * @param {string} presetKey - Preset key
   * @private
   */
  _applyPreset(presetKey) {
    const preset = this.presets[presetKey];
    if (!preset) return;
    
    // Update parameters with preset values
    Object.keys(preset.values).forEach(key => {
      if (this.parameters[key]) {
        const value = preset.values[key];
        this.parameters[key].value = value;
        
        // Update input element
        const inputElement = this.parameters[key].inputElement;
        if (inputElement) {
          if (inputElement.type === 'range' || inputElement.type === 'text') {
            inputElement.value = value;
            
            // Update value display for range inputs
            if (inputElement.type === 'range') {
              const valueDisplay = inputElement.parentElement.querySelector('.parameter-value-display');
              if (valueDisplay) {
                valueDisplay.textContent = value;
              }
            }
          } else if (inputElement.type === 'checkbox') {
            inputElement.checked = value;
          }
        }
        
        // Update simulation
        if (this.simulation) {
          this.simulation.setParameter(key, value);
        }
      }
    });
    
    // Update preset selector
    if (this.presetSelect) {
      this.presetSelect.value = presetKey;
      
      // Update description
      const descriptionElement = this.container.querySelector('.parameter-preset-description');
      if (descriptionElement) {
        descriptionElement.textContent = preset.description;
      }
    }
  }
  
  /**
   * Save parameters to local storage
   * @private
   */
  _saveParameters() {
    try {
      // Create object with just the values
      const paramValues = {};
      Object.keys(this.parameters).forEach(key => {
        paramValues[key] = this.parameters[key].value;
      });
      
      // Save to local storage
      localStorage.setItem('clonalSuccessionParameters', JSON.stringify(paramValues));
      
      // Show save confirmation
      this._showNotification('Parameters saved successfully');
    } catch (error) {
      console.error('Error saving parameters:', error);
      this._showNotification('Error saving parameters', true);
    }
  }
  
  /**
   * Load saved parameters from local storage
   * @private
   */
  _loadSavedParameters() {
    try {
      const savedParams = localStorage.getItem('clonalSuccessionParameters');
      if (savedParams) {
        const paramValues = JSON.parse(savedParams);
        
        // Update parameters with saved values
        Object.keys(paramValues).forEach(key => {
          if (this.parameters[key]) {
            const value = this._validateParameterValue(key, paramValues[key]);
            this.parameters[key].value = value;
            
            // Update input element if it exists
            const inputElement = this.parameters[key].inputElement;
            if (inputElement) {
              if (inputElement.type === 'range' || inputElement.type === 'text') {
                inputElement.value = value;
                
                // Update value display for range inputs
                if (inputElement.type === 'range') {
                  const valueDisplay = inputElement.parentElement.querySelector('.parameter-value-display');
                  if (valueDisplay) {
                    valueDisplay.textContent = value;
                  }
                }
              } else if (inputElement.type === 'checkbox') {
                inputElement.checked = value;
              }
            }
          }
        });
        
        // Set preset selector to custom
        if (this.presetSelect) {
          this.presetSelect.value = 'custom';
          
          // Update description
          const descriptionElement = this.container.querySelector('.parameter-preset-description');
          if (descriptionElement) {
            descriptionElement.textContent = 'Custom parameter settings (loaded from storage)';
          }
        }
      }
    } catch (error) {
      console.error('Error loading parameters:', error);
    }
  }
  
  /**
   * Apply current parameters to the simulation
   * @private
   */
  _applyParametersToSimulation() {
    if (!this.simulation) return;
    
    Object.keys(this.parameters).forEach(key => {
      this.simulation.setParameter(key, this.parameters[key].value);
    });
  }
  
  /**
   * Show a notification message
   * @param {string} message - Notification message
   * @param {boolean} isError - Whether this is an error notification
   * @private
   */
  _showNotification(message, isError = false) {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.parameter-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'parameter-notification';
      document.body.appendChild(notification);
      
      // Add notification styles
      const style = document.createElement('style');
      style.textContent = `
        .parameter-notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 10px 20px;
          border-radius: 5px;
          color: white;
          font-size: 14px;
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 1000;
        }
        
        .parameter-notification.show {
          opacity: 1;
        }
        
        .parameter-notification.success {
          background: #2a6b9c;
        }
        
        .parameter-notification.error {
          background: #8c3a3a;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Set notification content and style
    notification.textContent = message;
    notification.className = 'parameter-notification ' + (isError ? 'error' : 'success');
    
    // Show notification
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Hide notification after delay
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
  
  /**
   * Get a parameter value
   * @param {string} key - Parameter key
   * @returns {any} - Parameter value
   */
  getParameterValue(key) {
    return this.parameters[key] ? this.parameters[key].value : undefined;
  }
  
  /**
   * Set a parameter value
   * @param {string} key - Parameter key
   * @param {any} value - New parameter value
   */
  setParameterValue(key, value) {
    this._updateParameter(key, value);
  }
  
  /**
   * Get all parameter values
   * @returns {Object} - Object with all parameter values
   */
  getAllParameterValues() {
    const values = {};
    Object.keys(this.parameters).forEach(key => {
      values[key] = this.parameters[key].value;
    });
    return values;
  }
  
  /**
   * Apply a preset by name
   * @param {string} presetName - Preset name
   */
  applyPreset(presetName) {
    this._applyPreset(presetName);
  }
}

export default ParameterManager;