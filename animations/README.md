# Clonal Succession Animations

This folder contains the essential animation files for the Clonal Succession project.

## Animation Files

### Core Files

1. **clonal-succession-cycle.html** - The main simulation that demonstrates the clonal succession process. This is the primary animation that should be used for all demonstrations and educational purposes.

### Support Files

1. **mobile-responsive.css** - CSS styles for making animations responsive on mobile devices.
2. **mobile-responsive.js** - JavaScript functionality for responsive design across different screen sizes.
3. **time-tracking.js** - Provides simulation time tracking functionality.

### Documentation

1. **animation-specs.md** - Contains the specifications for the animations.
2. **MOBILE_RESPONSIVE_GUIDE.md** - Documentation for making animations mobile-responsive.
3. **README.md** - This file, explaining the animation folder structure.

## Naming Conventions

For any new animations added to this folder, please follow these naming conventions:

1. Use kebab-case for all filenames (e.g., `clonal-succession-cycle.html`).
2. Include a descriptive name that clearly indicates the purpose of the animation.
3. Use the `.html` extension for animation files.
4. Use the `.js` extension for JavaScript utility files.
5. Use the `.css` extension for CSS style files.
6. Use the `.md` extension for documentation files.

## Adding New Animations

If you need to add a new animation:

1. Start by duplicating the `clonal-succession-cycle.html` file.
2. Rename it according to the naming conventions above.
3. Modify the code to implement your new animation.
4. Ensure it includes the mobile responsive files:
   ```html
   <link rel="stylesheet" href="mobile-responsive.css">
   <script src="mobile-responsive.js"></script>
   ```
5. Update this README.md file to include your new animation.

## Animation Cleanup

In July 2025, the animations folder was cleaned up to remove redundant and experimental animations. All the removed animations were backed up in the `animations_backup_20250718_105143` folder. The reference.html file was updated to point all animation links to the main clonal-succession-cycle.html file.

If you need access to any of the removed animations, please check the backup folder.