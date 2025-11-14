# Camera Layout Planner

A web-based application for planning security camera layouts in physical spaces. Draw floor plans, place cameras with configurable parameters, and visualize coverage areas to optimize camera placement.

## Current Status: Phase 2 Complete ✓

**Implemented Features:**
- ✅ HTML5 Canvas setup with responsive design
- ✅ Freehand drawing tool
- ✅ Line drawing tool with shift-snap to 16 directions
- ✅ Rectangle drawing tool
- ✅ Select tool with drag and resize (Figma-style)
- ✅ Camera placement tool
- ✅ Camera configuration (angle, FOV, distances)
- ✅ Visual FOV cone rendering
- ✅ Camera selection and dragging
- ✅ Camera properties panel
- ✅ Camera duplication
- ✅ Basic UI with tool selection
- ✅ Clear canvas functionality
- ✅ Cursor position tracking
- ✅ Delete shapes with Delete/Backspace key

**Coming Soon:**
- Ray-casting vision calculation (Phase 3)
- Fog of war visualization (Phase 4)
- Heatmap coverage mode (Phase 5)

## How to Use

### Live Demo

The app is automatically deployed to GitHub Pages on every commit to the main branch.

### Local Development

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Select a drawing tool from the toolbar
4. Draw obstacles on the white canvas

No build process required - it's a static site!

### Tools

**Select Tool**
- Click on any shape to select it
- Drag selected shapes to move them
- Drag the resize handles (blue squares) to resize
- Press Delete or Backspace to remove selected shape
- Click empty space to deselect

**Freehand Tool**
- Click and drag to draw free-form lines
- Great for irregular walls or obstacles

**Line Tool**
- Click to set the start point
- Move mouse to preview the line
- **Hold Shift** to snap to 16 directions (0°, 22.5°, 45°, etc.)
- Click again to set the end point

**Rectangle Tool**
- Click to set one corner
- Move mouse to preview the rectangle
- Click again to set the opposite corner

**Camera Tool**
- Click anywhere to place a camera
- Cameras show a blue circle with direction arrow
- FOV cone is displayed (lighter = max distance, darker = clear distance)
- Select a camera to configure its properties

### Camera Configuration

When a camera is selected, the properties panel appears with:

- **Angle**: Direction the camera is facing (0° = right, 90° = down, etc.)
- **Field of View (FOV)**: Angular width of camera view (typically 60-120°)
- **Max Distance**: How far the camera can see (with degraded quality)
- **Clear Distance**: Distance within which the camera has perfect clarity
- **Duplicate**: Create a copy of the selected camera
- **Delete**: Remove the selected camera

### Interface

**Toolbar** (top)
- Tool buttons: Select drawing tools
- View modes: Switch between fog and heatmap views (coming in later phases)
- Actions: Clear canvas, undo operations

**Canvas** (center)
- Main drawing area with white background
- Shows cursor coordinates in bottom-right

**Status Bar** (bottom)
- Displays current action status
- Shows precise cursor position

## Technical Details

### File Structure
```
camera-planner/
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Pages deployment
├── index.html          # Main HTML file
├── styles/
│   └── main.css        # Application styles
├── scripts/
│   ├── app.js          # Main application entry point
│   ├── canvas.js       # Canvas management
│   ├── camera.js       # Camera class and renderer
│   ├── tools.js        # Drawing tools implementation
│   └── ui.js           # UI controller
├── SPECS.md            # Full technical specifications
└── README.md           # This file
```

### Browser Compatibility

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires HTML5 Canvas support.

## Deployment

This project uses GitHub Actions to automatically deploy to GitHub Pages on every push to the main branch.

**Setup Requirements:**
1. Enable GitHub Pages in repository settings
2. Set Pages source to "GitHub Actions"
3. Push to main branch to trigger deployment

The workflow file is located at `.github/workflows/deploy.yml`.

## Development

### Phase 1 - Enhanced Drawing ✓

Foundational drawing capabilities:
- Canvas setup and management
- Three drawing tools (freehand, line, rectangle)
- Select tool with Figma-style manipulation
- Line tool with shift-snap to 16 directions
- Basic UI and user interactions
- Shape storage and rendering

### Phase 2 - Camera System ✓

Camera placement and configuration:
- Camera class with position, angle, FOV, and distances
- Camera placement tool
- Visual FOV cone rendering with two zones (clear/max distance)
- Camera selection and dragging
- Properties panel for real-time camera configuration
- Camera duplication functionality
- Integration with select tool

### Next Phase: Phase 3 - Vision Calculation

Upcoming features:
- Ray-casting algorithm for line-of-sight
- Obstacle detection and occlusion
- Vision polygon generation
- Debounced recalculation system

## License

MIT License - See SPECS.md for full project details.

## Version

**v0.3.0** - Phase 2 Complete (Camera System with Placement & Configuration)
