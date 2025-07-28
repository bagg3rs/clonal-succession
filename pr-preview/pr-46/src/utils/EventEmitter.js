/**
 * EventEmitter class
 * Simple event system for communication between components
 */
class EventEmitter {
  /**
   * Create a new event emitter
   */
  constructor() {
    this.events = {};
  }
  
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} listener - Event handler function
   * @returns {Function} - Unsubscribe function
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(listener);
    
    // Return unsubscribe function
    return () => {
      this.off(event, listener);
    };
  }
  
  /**
   * Subscribe to an event for a single occurrence
   * @param {string} event - Event name
   * @param {Function} listener - Event handler function
   * @returns {Function} - Unsubscribe function
   */
  once(event, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    
    return this.on(event, onceWrapper);
  }
  
  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} listener - Event handler function to remove
   */
  off(event, listener) {
    if (!this.events[event]) {
      return;
    }
    
    const index = this.events[event].indexOf(listener);
    if (index !== -1) {
      this.events[event].splice(index, 1);
    }
  }
  
  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to listeners
   */
  emit(event, ...args) {
    if (!this.events[event]) {
      return;
    }
    
    // Create a copy of the listeners array to avoid issues if listeners are removed during emission
    const listeners = [...this.events[event]];
    
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
  
  /**
   * Remove all listeners for an event
   * @param {string} event - Event name (optional, if not provided, removes all listeners)
   */
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// Export the EventEmitter class
export default EventEmitter;