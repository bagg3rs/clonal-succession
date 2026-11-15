# Technical Stack & Build System

## Technologies Used

### Core Technologies
- **JavaScript (ES6+)** - Primary programming language
- **HTML5 Canvas** - Rendering engine for cell visualization
- **Matter.js** - Physics engine for cell movement and interactions
- **CSS3** - Styling and responsive design

### Architecture
- **Module-based** - ES6 modules for component organization
- **Event-driven** - EventEmitter pattern for communication between components
- **Object-oriented** - Class-based inheritance for cell types and behaviors

## Project Setup

### Development Environment
- No build system required - pure JavaScript
- Served directly from file system or any static file server
- No transpilation or bundling needed

### Dependencies
- Matter.js (physics engine)
- No other external dependencies

## Common Commands

### Running the Project
```bash
# Serve the project using any static file server
# For example, with Python:
python -m http.server

# Or with Node.js:
npx serve
```

### GitHub Pages Deployment
The project is configured to automatically deploy to GitHub Pages when changes are pushed to the main branch.

```bash
# Push changes to deploy
git push origin main
```

## Testing
- Manual testing through browser
- No automated testing framework currently implemented

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- Responsive design for all screen sizes

## Performance Considerations
- Limit cell count to ~100 for optimal performance
- Use requestAnimationFrame for smooth animations
- Optimize physics calculations for mobile devices