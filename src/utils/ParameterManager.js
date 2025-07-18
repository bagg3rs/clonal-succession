/**
 * ParameterManager class
 * Manages simulation parameters with validation, persistence, and UI controls
 * Implements parameter grouping, validation, constraints, and persistence between sessions
 */
class ParameterManager {
  /**
   * Create a new parameter manager
   * @param {Object} options - Configuration options
   * @param {Object} options.simulation - Reference to the simulation
   * @param {HTMLElement} options.container - Container element for parameter controls
   * @param {Object} options.initialParameters - Initial parameter values
   * @param {boolean} options.persistParameters - Whether to persist parameters between sessions (default: true)
   * @param {string} options.storageKey - Key to use for local storage (default: 'clonalSuccessionParameters')
   */
  constructor(options = {}) {
    this.simulation = options.simulation;
    this.container = options.container;
    this.persistParameters = options.persistParameters !== undefined ? options.persistParameters : true;
    this.storageKey = options.storageKey || 'clonalSuccessionParameters';
    
    // Event handlers
    this.eventHandlers = {
      parameterChanged: [],
      presetApplied: [],
      parametersSaved: [],
      parametersLoaded: [],
      validationError: []
    };
    
    // Parameter groups for better organization
    this.parameterGroups = {
      population: {
        label: 'Population Control',
        description: 'Parameters that control the overall cell population',
        parameters: ['maxCells']
      },
      stemCells: {
        label: 'Stem Cell Behavior',
        description: 'Parameters that control stem cell activation and suppression',
        parameters: ['activationThreshold', 'suppressionStrength', 'divisionLimit']
      },
      cellLifecycle: {
        label: 'Cell Lifecycle',
        description: 'Parameters that control cell aging and state transitions',
        parameters: ['senescenceRate', 'cellLifespan']
      },
      visualization: {
        label: 'Visualization',
        description: 'Parameters that control visual aspects of the simulation',
        parameters: ['showSuppressionField', 'showCellStates']
      }
    };
    
    // Default parameters
    this.defaultParameters = {
      // Population Control Group
      maxCells: {
        value: 100,
        min: 10,
        max: 200,
        step: 10,
        type: 'range',
        label: 'Max Cells',
        description: 'Maximum number of cells in the simulation',
        warning: 'High values may impact performance',
        group: 'population',
        validate: (value) => {
          if (value < 10) return 'At least 10 cells are required for meaningful simulation';
          if (value > 200) return 'Values above 200 may cause performance issues';
          return null;
        }
      },
      
      // Stem Cell Behavior Group
      activationThreshold: {
        value: 0.3,
        min: 0.1,
        max: 0.9,
        step: 0.05,
        type: 'range',
        label: 'Activation Threshold',
        description: 'Suppression level below which stem cells can activate',
        warning: 'Low values may cause rapid succession cycles',
        group: 'stemCells',
        validate: (value) => {
          if (value < 0.1) return 'Values below 0.1 cause unrealistically fast activation';
          if (value > 0.9) return 'Values above 0.9 may prevent stem cell activation';
          return null;
        }
      },
      divisionLimit: {
        value: 25,
        min: 5,
        max: 50,
        step: 5,
        type: 'range',
        label: 'Division Limit',
        description: 'Maximum number of divisions per stem cell',
        warning: 'High values may cause population imbalance',
        group: 'stemCells',
        validate: (value) => {
          if (value < 5) return 'Values below 5 cause unrealistically short clone lifespans';
          if (value > 50) return 'Values above 50 are biologically unrealistic';
          return null;
        }
      },
      suppressionStrength: {
        value: 1.0,
        min: 0.1,
        max: 2.0,
        step: 0.1,
        type: 'range',
        label: 'Suppression Strength',
        description: 'Strength of the suppression signal',
        warning: 'Extreme values may disrupt succession cycles',
        group: 'stemCells',
        validate: (value) => {
          if (value < 0.1) return 'Values below 0.1 cause ineffective suppression';
          if (value > 2.0) return 'Values above 2.0 may prevent succession events';
          return null;
        }
      },
      
      // Cell Lifecycle Group
      senescenceRate: {
        value: 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.1,
        type: 'range',
        label: 'Senescence Rate',
        description: 'Rate at which cells become senescent',
        warning: 'Low values may cause unrealistic cell lifespans',
        group: 'cellLifecycle',
        validate: (value) => {
          if (value < 0.5) return 'Values below 0.5 cause unrealistically long cell lifespans';
          if (value > 2.0) return 'Values above 2.0 cause cells to age too quickly';
          return null;
        }
      },
      cellLifespan: {
        value: 100,
        min: 50,
        max: 200,
        step: 10,
        type: 'range',
        label: 'Cell Lifespan',
        description: 'Base lifespan of cells in simulation time units',
        warning: 'Extreme values affect population stability',
        group: 'cellLifecycle',
        validate: (value) => {
          if (value < 50) return 'Values below 50 cause cells to die too quickly';
          if (value > 200) return 'Values above 200 cause unrealistically long cell lifespans';
          return null;
        }
      },
      
      // Visualization Group
      showSuppressionField: {
        value: true,
        type: 'checkbox',
        label: 'Show Suppression Field',
        description: 'Visualize the suppression field around active stem cells',
        group: 'visualization'
      },
      showCellStates: {
        value: true,
        type: 'checkbox',
        label: 'Show Cell States',
        description: 'Visualize different cell states with distinct appearances',
        group: 'visualization'
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
          senescenceRate: 1.0,
          cellLifespan: 100,
          showSuppressionField: true,
          showCellStates: true
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
          senescenceRate: 1.5,
          cellLifespan: 70,
          showSuppressionField: true,
          showCellStates: true
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
          senescenceRate: 0.7,
          cellLifespan: 150,
          showSuppressionField: true,
          showCellStates: true
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
          senescenceRate: 0.8,
          cellLifespan: 120,
          showSuppressionField: true,
          showCellStates: true
        }
      },
      biologicallyRealistic: {
        name: 'Biologically Realistic',
        description: 'Parameters based on biological research data',
        values: {
          maxCells: 120,
          activationThreshold: 0.25,
          divisionLimit: 20,
          suppressionStrength: 1.2,
          senescenceRate: 1.0,
          cellLifespan: 110,
          showSuppressionField: true,
          showCellStates: true
        }
      }
    };
    
    // Create UI if container is provided
    if (this.container) {
      this._createUI();
    }
    
    // Load saved parameters if available and persistence is enabled
    if (this.persistParameters) {
      this._loadSavedParameters();
    }
    
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
    
    // Create parameter groups
    this._createParameterGroups();
    
    // Create save/reset buttons
    this._createActionButtons();
    
    // Add styles
    this._addStyles();
  }
  
  /**
   * Create parameter groups with collapsible sections
   * @private
   */
  _createParameterGroups() {
    // Create a map of parameters by group
    const paramsByGroup = {};
    
    // Initialize groups
    Object.keys(this.parameterGroups).forEach(groupKey => {
      paramsByGroup[groupKey] = [];
    });
    
    // Add ungrouped category
    paramsByGroup.ungrouped = [];
    
    // Assign parameters to groups
    Object.keys(this.parameters).forEach(paramKey => {
      const param = this.parameters[paramKey];
      const groupKey = param.group || 'ungrouped';
      
      if (paramsByGroup[groupKey]) {
        paramsByGroup[groupKey].push(paramKey);
      } else {
        paramsByGroup.ungrouped.push(paramKey);
      }
    });
    
    // Create group sections
    Object.keys(this.parameterGroups).forEach(groupKey => {
      const group = this.parameterGroups[groupKey];
      const params = paramsByGroup[groupKey];
      
      if (params.length > 0) {
        this._createParameterGroupSection(groupKey, group, params);
      }
    });
    
    // Create ungrouped section if needed
    if (paramsByGroup.ungrouped.length > 0) {
      this._createParameterGroupSection('ungrouped', {
        label: 'Other Parameters',
        description: 'Additional simulation parameters'
      }, paramsByGroup.ungrouped);
    }
  }
  
  /**
   * Create a collapsible section for a parameter group
   * @param {string} groupKey - Group identifier
   * @param {Object} group - Group definition
   * @param {Array} paramKeys - Parameter keys in this group
   * @private
   */
  _createParameterGroupSection(groupKey, group, paramKeys) {
    // Create group container
    const groupContainer = document.createElement('div');
    groupContainer.className = 'parameter-group';
    groupContainer.dataset.group = groupKey;
    
    // Create header with toggle
    const groupHeader = document.createElement('div');
    groupHeader.className = 'parameter-group-header';
    
    const groupTitle = document.createElement('h4');
    groupTitle.textContent = group.label;
    groupHeader.appendChild(groupTitle);
    
    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'parameter-group-toggle';
    toggleButton.textContent = '−'; // Default to expanded
    toggleButton.title = 'Collapse/Expand';
    groupHeader.appendChild(toggleButton);
    
    groupContainer.appendChild(groupHeader);
    
    // Add group description
    if (group.description) {
      const groupDescription = document.createElement('div');
      groupDescription.className = 'parameter-group-description';
      groupDescription.textContent = group.description;
      groupContainer.appendChild(groupDescription);
    }
    
    // Create content container for parameters
    const contentContainer = document.createElement('div');
    contentContainer.className = 'parameter-group-content';
    
    // Add parameters to group
    paramKeys.forEach(key => {
      this._createParameterControl(key, contentContainer);
    });
    
    groupContainer.appendChild(contentContainer);
    
    // Add to main container
    this.container.appendChild(groupContainer);
    
    // Set up toggle functionality
    toggleButton.addEventListener('click', () => {
      const isCollapsed = contentContainer.style.display === 'none';
      
      if (isCollapsed) {
        // Expand
        contentContainer.style.display = '';
        toggleButton.textContent = '−';
      } else {
        // Collapse
        contentContainer.style.display = 'none';
        toggleButton.textContent = '+';
      }
    });
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
   * @param {HTMLElement} parentContainer - Optional parent container (defaults to this.container)
   * @private
   */
  _createParameterControl(key, parentContainer = null) {
    const param = this.parameters[key];
    const container = parentContainer || this.container;
    
    const controlContainer = document.createElement('div');
    controlContainer.className = 'parameter-control';
    controlContainer.dataset.paramKey = key;
    
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
      
      // Add min/max labels for better usability
      const rangeLabels = document.createElement('div');
      rangeLabels.className = 'parameter-range-labels';
      rangeLabels.innerHTML = `
        <span class="min-label">${param.min}</span>
        <span class="max-label">${param.max}</span>
      `;
      controlContainer.appendChild(rangeLabels);
    } else if (param.type === 'checkbox') {
      const checkboxContainer = document.createElement('div');
      checkboxContainer.className = 'parameter-checkbox-container';
      
      input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `param-${key}-checkbox`;
      input.checked = param.value;
      
      const checkboxLabel = document.createElement('label');
      checkboxLabel.htmlFor = `param-${key}-checkbox`;
      checkboxLabel.textContent = 'Enabled';
      
      input.addEventListener('change', () => {
        this._updateParameter(key, input.checked);
      });
      
      checkboxContainer.appendChild(input);
      checkboxContainer.appendChild(checkboxLabel);
      controlContainer.appendChild(checkboxContainer);
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.value = param.value;
      
      input.addEventListener('change', () => {
        this._updateParameter(key, input.value);
      });
      
      controlContainer.appendChild(input);
    }
    
    // Add validation error container
    const validationError = document.createElement('div');
    validationError.className = 'parameter-validation-error';
    validationError.style.display = 'none';
    controlContainer.appendChild(validationError);
    
    // Add warning indicator if needed
    if (param.warning) {
      const warningIcon = document.createElement('span');
      warningIcon.className = 'parameter-warning-icon';
      warningIcon.textContent = '⚠️';
      warningIcon.title = param.warning;
      controlContainer.appendChild(warningIcon);
    }
    
    container.appendChild(controlContainer);
    
    // Store references
    param.inputElement = input;
    param.validationElement = validationError;
    param.controlElement = controlContainer;
    
    // Register validation error handler
    this.on('validationError', (data) => {
      if (data.key === key && param.validationElement) {
        param.validationElement.textContent = data.error;
        param.validationElement.style.display = 'block';
        
        // Hide after a delay
        setTimeout(() => {
          param.validationElement.style.display = 'none';
        }, 5000);
      }
    });
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
      
      /* Parameter Groups */
      .parameter-group {
        margin-bottom: 20px;
        background: rgba(40, 40, 40, 0.7);
        border-radius: 5px;
        overflow: hidden;
      }
      
      .parameter-group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: rgba(50, 50, 50, 0.7);
        cursor: pointer;
      }
      
      .parameter-group-header h4 {
        margin: 0;
        color: #ddd;
        font-size: 14px;
      }
      
      .parameter-group-toggle {
        background: none;
        border: none;
        color: #aaa;
        font-size: 16px;
        cursor: pointer;
        padding: 0 5px;
      }
      
      .parameter-group-toggle:hover {
        color: #fff;
      }
      
      .parameter-group-description {
        padding: 5px 10px;
        font-size: 12px;
        color: #aaa;
        font-style: italic;
        border-bottom: 1px solid rgba(80, 80, 80, 0.5);
      }
      
      .parameter-group-content {
        padding: 10px;
      }
      
      /* Parameter Controls */
      .parameter-control {
        margin-bottom: 15px;
        padding: 10px;
        background: rgba(30, 30, 30, 0.7);
        border-radius: 5px;
        position: relative;
      }
      
      .parameter-control:last-child {
        margin-bottom: 0;
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
      
      /* Checkbox styling */
      .parameter-control input[type="checkbox"] {
        width: 18px;
        height: 18px;
        margin-right: 5px;
      }
      
      /* Text input styling */
      .parameter-control input[type="text"] {
        width: 100%;
        padding: 5px;
        background: #333;
        color: white;
        border: 1px solid #555;
        border-radius: 3px;
      }
      
      /* Buttons */
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
        transition: background-color 0.2s;
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
      
      /* Notification */
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
      
      /* Validation error styling */
      .parameter-validation-error {
        color: #ff6b6b;
        font-size: 12px;
        margin-top: 5px;
      }
    `;
    
    // Add to document
    document.head.appendChild(style);
  }
  
  /**
   * Register an event handler
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler function
   * @returns {Function} - Function to remove the handler
   */
  on(eventType, handler) {
    if (!this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = [];
    }
    
    this.eventHandlers[eventType].push(handler);
    
    // Return function to remove handler
    return () => {
      this.off(eventType, handler);
    };
  }
  
  /**
   * Remove an event handler
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler function
   */
  off(eventType, handler) {
    if (!this.eventHandlers[eventType]) return;
    
    const index = this.eventHandlers[eventType].indexOf(handler);
    if (index !== -1) {
      this.eventHandlers[eventType].splice(index, 1);
    }
  }
  
  /**
   * Emit an event
   * @param {string} eventType - Event type
   * @param {any} data - Event data
   * @private
   */
  _emit(eventType, data) {
    if (!this.eventHandlers[eventType]) return;
    
    this.eventHandlers[eventType].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in parameter manager event handler (${eventType}):`, error);
      }
    });
  }

  /**
   * Update a parameter value
   * @param {string} key - Parameter key
   * @param {any} value - New parameter value
   * @private
   */
  _updateParameter(key, value) {
    if (this.parameters[key]) {
      const oldValue = this.parameters[key].value;
      
      // Validate value
      const validationResult = this._validateParameterValue(key, value);
      value = validationResult.value;
      
      // Check for validation errors
      if (validationResult.error) {
        this._emit('validationError', {
          key,
          value,
          error: validationResult.error
        });
        
        // Show validation error notification
        this._showNotification(`Parameter error: ${validationResult.error}`, true);
        return;
      }
      
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
      
      // Emit parameter changed event
      this._emit('parameterChanged', {
        key,
        oldValue,
        newValue: value
      });
    }
  }
  
  /**
   * Validate a parameter value
   * @param {string} key - Parameter key
   * @param {any} value - Parameter value to validate
   * @returns {Object} - Object with validated value and optional error message
   * @private
   */
  _validateParameterValue(key, value) {
    const param = this.parameters[key];
    let error = null;
    
    if (param.type === 'range') {
      // Convert to number
      value = parseFloat(value);
      
      // Check for NaN
      if (isNaN(value)) {
        return {
          value: param.value, // Keep old value
          error: 'Value must be a number'
        };
      }
      
      // Check min/max constraints
      if (value < param.min) {
        error = `Value must be at least ${param.min}`;
        value = param.min;
      } else if (value > param.max) {
        error = `Value must be at most ${param.max}`;
        value = param.max;
      }
      
      // Run custom validation if provided
      if (param.validate && !error) {
        const customError = param.validate(value);
        if (customError) {
          error = customError;
        }
      }
    } else if (param.type === 'checkbox') {
      // Convert to boolean
      value = Boolean(value);
    } else if (param.type === 'text') {
      // Run custom validation if provided
      if (param.validate) {
        const customError = param.validate(value);
        if (customError) {
          error = customError;
        }
      }
    }
    
    return { value, error };
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
   * @param {boolean} showNotification - Whether to show a notification (default: true)
   * @returns {boolean} - Whether the save was successful
   */
  _saveParameters(showNotification = true) {
    if (!this.persistParameters) return false;
    
    try {
      // Create object with parameter values and metadata
      const saveData = {
        values: {},
        timestamp: Date.now(),
        version: '1.0.0' // For future compatibility
      };
      
      // Save parameter values
      Object.keys(this.parameters).forEach(key => {
        saveData.values[key] = this.parameters[key].value;
      });
      
      // Save to local storage
      localStorage.setItem(this.storageKey, JSON.stringify(saveData));
      
      // Show confirmation if requested
      if (showNotification) {
        this._showNotification('Parameters saved successfully');
      }
      
      // Emit event
      this._emit('parametersSaved', {
        parameters: saveData.values,
        timestamp: saveData.timestamp
      });
      
      return true;
    } catch (error) {
      console.error('Error saving parameters:', error);
      
      if (showNotification) {
        this._showNotification('Error saving parameters', true);
      }
      
      return false;
    }
  }
  
  /**
   * Load saved parameters from local storage
   * @param {boolean} showNotification - Whether to show a notification (default: false)
   * @returns {boolean} - Whether parameters were loaded successfully
   */
  _loadSavedParameters(showNotification = false) {
    if (!this.persistParameters) return false;
    
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (!savedData) return false;
      
      let paramData;
      try {
        paramData = JSON.parse(savedData);
      } catch (parseError) {
        console.error('Error parsing saved parameters:', parseError);
        return false;
      }
      
      // Handle legacy format (just values without metadata)
      const paramValues = paramData.values || paramData;
      
      // Track if any parameters were actually loaded
      let parametersLoaded = false;
      
      // Update parameters with saved values
      Object.keys(paramValues).forEach(key => {
        if (this.parameters[key]) {
          // Validate the value
          const validationResult = this._validateParameterValue(key, paramValues[key]);
          
          // Skip if validation error
          if (validationResult.error) {
            console.warn(`Skipping invalid saved parameter "${key}": ${validationResult.error}`);
            return;
          }
          
          const value = validationResult.value;
          const oldValue = this.parameters[key].value;
          
          // Update parameter value
          this.parameters[key].value = value;
          parametersLoaded = true;
          
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
          
          // Emit parameter changed event
          this._emit('parameterChanged', {
            key,
            oldValue,
            newValue: value,
            source: 'load'
          });
        }
      });
      
      // Set preset selector to custom if parameters were loaded
      if (parametersLoaded) {
        if (this.presetSelect) {
          this.presetSelect.value = 'custom';
          
          // Update description
          const descriptionElement = this.container.querySelector('.parameter-preset-description');
          if (descriptionElement) {
            descriptionElement.textContent = 'Custom parameter settings (loaded from storage)';
          }
        }
        
        // Show notification if requested
        if (showNotification) {
          this._showNotification('Parameters loaded from storage');
        }
        
        // Emit event
        this._emit('parametersLoaded', {
          parameters: paramValues,
          timestamp: paramData.timestamp || Date.now()
        });
      }
      
      return parametersLoaded;
    } catch (error) {
      console.error('Error loading parameters:', error);
      
      if (showNotification) {
        this._showNotification('Error loading parameters', true);
      }
      
      return false;
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
   * @returns {boolean} - Whether the parameter was successfully set
   */
  setParameterValue(key, value) {
    if (!this.parameters[key]) {
      console.warn(`Parameter "${key}" does not exist`);
      return false;
    }
    
    this._updateParameter(key, value);
    return true;
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
   * Get parameter metadata
   * @param {string} key - Parameter key
   * @returns {Object|null} - Parameter metadata or null if parameter doesn't exist
   */
  getParameterMetadata(key) {
    if (!this.parameters[key]) return null;
    
    const param = this.parameters[key];
    return {
      label: param.label,
      description: param.description,
      type: param.type,
      min: param.min,
      max: param.max,
      step: param.step,
      group: param.group,
      warning: param.warning
    };
  }
  
  /**
   * Get all parameters in a specific group
   * @param {string} groupKey - Group identifier
   * @returns {Object} - Object with parameter keys and values in the group
   */
  getParametersByGroup(groupKey) {
    const result = {};
    
    Object.keys(this.parameters).forEach(key => {
      const param = this.parameters[key];
      if (param.group === groupKey) {
        result[key] = param.value;
      }
    });
    
    return result;
  }
  
  /**
   * Apply a preset by name
   * @param {string} presetName - Preset name
   * @returns {boolean} - Whether the preset was successfully applied
   */
  applyPreset(presetName) {
    if (!this.presets[presetName]) {
      console.warn(`Preset "${presetName}" does not exist`);
      return false;
    }
    
    this._applyPreset(presetName);
    
    // Emit preset applied event
    this._emit('presetApplied', {
      presetName,
      values: this.presets[presetName].values
    });
    
    return true;
  }
  
  /**
   * Reset all parameters to default values
   */
  resetToDefaults() {
    Object.keys(this.defaultParameters).forEach(key => {
      this.setParameterValue(key, this.defaultParameters[key].value);
    });
    
    // Update UI
    if (this.presetSelect) {
      this.presetSelect.value = 'default';
      
      // Update description
      const descriptionElement = this.container.querySelector('.parameter-preset-description');
      if (descriptionElement) {
        descriptionElement.textContent = this.presets.default.description;
      }
    }
  }
  
  /**
   * Save current parameters to local storage
   * @param {boolean} showNotification - Whether to show a notification
   * @returns {boolean} - Whether the save was successful
   */
  saveParameters(showNotification = true) {
    return this._saveParameters(showNotification);
  }
  
  /**
   * Load parameters from local storage
   * @param {boolean} showNotification - Whether to show a notification
   * @returns {boolean} - Whether parameters were loaded successfully
   */
  loadParameters(showNotification = true) {
    return this._loadSavedParameters(showNotification);
  }
  
  /**
   * Export parameters as JSON string
   * @returns {string} - JSON string with parameter values
   */
  exportParameters() {
    const exportData = {
      values: this.getAllParameterValues(),
      timestamp: Date.now(),
      version: '1.0.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Import parameters from JSON string
   * @param {string} jsonString - JSON string with parameter values
   * @returns {boolean} - Whether the import was successful
   */
  importParameters(jsonString) {
    try {
      const importData = JSON.parse(jsonString);
      
      // Handle different formats
      const paramValues = importData.values || importData;
      
      // Update parameters
      Object.keys(paramValues).forEach(key => {
        if (this.parameters[key]) {
          this.setParameterValue(key, paramValues[key]);
        }
      });
      
      // Update UI
      if (this.presetSelect) {
        this.presetSelect.value = 'custom';
        
        // Update description
        const descriptionElement = this.container.querySelector('.parameter-preset-description');
        if (descriptionElement) {
          descriptionElement.textContent = 'Custom parameter settings (imported)';
        }
      }
      
      // Show notification
      this._showNotification('Parameters imported successfully');
      
      return true;
    } catch (error) {
      console.error('Error importing parameters:', error);
      this._showNotification('Error importing parameters', true);
      return false;
    }
  }
  
  /**
   * Add a new parameter
   * @param {string} key - Parameter key
   * @param {Object} paramDefinition - Parameter definition
   * @returns {boolean} - Whether the parameter was added successfully
   */
  addParameter(key, paramDefinition) {
    // Check if parameter already exists
    if (this.parameters[key]) {
      console.warn(`Parameter "${key}" already exists`);
      return false;
    }
    
    // Add parameter
    this.parameters[key] = {
      ...paramDefinition,
      value: paramDefinition.value !== undefined ? paramDefinition.value : null
    };
    
    // Update UI if it exists
    if (this.container) {
      // Find the appropriate group container
      let container = this.container;
      
      if (paramDefinition.group) {
        const groupContainer = this.container.querySelector(`.parameter-group[data-group="${paramDefinition.group}"]`);
        if (groupContainer) {
          container = groupContainer.querySelector('.parameter-group-content');
        }
      }
      
      // Create control
      this._createParameterControl(key, container);
    }
    
    return true;
  }
  
  /**
   * Remove a parameter
   * @param {string} key - Parameter key
   * @returns {boolean} - Whether the parameter was removed successfully
   */
  removeParameter(key) {
    // Check if parameter exists
    if (!this.parameters[key]) {
      console.warn(`Parameter "${key}" does not exist`);
      return false;
    }
    
    // Remove parameter control from UI if it exists
    if (this.container && this.parameters[key].inputElement) {
      const controlElement = this.parameters[key].inputElement.closest('.parameter-control');
      if (controlElement) {
        controlElement.remove();
      }
    }
    
    // Remove parameter
    delete this.parameters[key];
    
    return true;
  }
  
  /**
   * Add a new parameter group
   * @param {string} groupKey - Group identifier
   * @param {Object} groupDefinition - Group definition
   * @returns {boolean} - Whether the group was added successfully
   */
  addParameterGroup(groupKey, groupDefinition) {
    // Check if group already exists
    if (this.parameterGroups[groupKey]) {
      console.warn(`Parameter group "${groupKey}" already exists`);
      return false;
    }
    
    // Add group
    this.parameterGroups[groupKey] = {
      label: groupDefinition.label || groupKey,
      description: groupDefinition.description || '',
      parameters: groupDefinition.parameters || []
    };
    
    // Update UI if it exists
    if (this.container) {
      // Find parameters for this group
      const params = Object.keys(this.parameters).filter(key => 
        this.parameters[key].group === groupKey
      );
      
      if (params.length > 0) {
        this._createParameterGroupSection(groupKey, this.parameterGroups[groupKey], params);
      }
    }
    
    return true;
  }
}

export default ParameterManager;