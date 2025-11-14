# Camera Layout Planner

A web-based application for planning security camera layouts in physical spaces. Draw floor plans, place cameras with configurable parameters, and visualize coverage areas to optimize camera placement.

## Current Status: Phase 1 Complete ✓

**Implemented Features:**
- ✅ HTML5 Canvas setup with responsive design
- ✅ Freehand drawing tool
- ✅ Line drawing tool
- ✅ Rectangle drawing tool
- ✅ Basic UI with tool selection
- ✅ Clear canvas functionality
- ✅ Cursor position tracking

**Coming Soon:**
- Camera placement and configuration (Phase 2)
- Ray-casting vision calculation (Phase 3)
- Fog of war visualization (Phase 4)
- Heatmap coverage mode (Phase 5)

## How to Use

### Getting Started

1. Open `index.html` in a modern web browser
2. Select a drawing tool from the toolbar
3. Draw obstacles on the white canvas

### Drawing Tools

**Freehand Tool**
- Click and drag to draw free-form lines
- Great for irregular walls or obstacles

**Line Tool**
- Click to set the start point
- Move mouse to preview the line
- Click again to set the end point

**Rectangle Tool**
- Click to set one corner
- Move mouse to preview the rectangle
- Click again to set the opposite corner

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
├── index.html           # Main HTML file
├── styles/
│   └── main.css        # Application styles
├── scripts/
│   ├── app.js          # Main application entry point
│   ├── canvas.js       # Canvas management
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

## Development

### Current Phase: Phase 1 - Basic Drawing ✓

Phase 1 focuses on the foundational drawing capabilities:
- Canvas setup and management
- Three drawing tools (freehand, line, rectangle)
- Basic UI and user interactions
- Shape storage and rendering

### Next Phase: Phase 2 - Camera System

Upcoming features:
- Camera placement on canvas
- Camera configuration panel
- Adjustable angle, FOV, distances
- Camera selection and manipulation
- Camera duplication

## License

MIT License - See SPECS.md for full project details.

## Version

**v0.1.0** - Phase 1 Complete (Basic Drawing)
