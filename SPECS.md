# Camera Layout Planner - Technical Specifications

## Project Overview

A web-based application for planning security camera layouts in physical spaces. Users can draw floor plans, place cameras with configurable parameters, and visualize coverage areas to optimize camera placement.

## Core Features

### 1. Drawing Tools

Users can draw obstacles and walls that obstruct camera views:

- **Freehand Tool**: Draw arbitrary shapes by clicking and dragging
- **Line Tool**: Draw straight lines between two points
- **Rectangle Tool**: Draw rectangular obstacles

All drawn elements act as obstructions that block camera line-of-sight.

### 2. Camera Placement & Configuration

Each camera has the following configurable parameters:

- **Position**: X, Y coordinates on the canvas
- **Angle**: Direction the camera is facing (in degrees)
- **Field of View (FOV)**: Angular width of the camera's view cone (in degrees)
- **Max View Distance**: Maximum distance the camera can see (with degraded quality)
- **Max Clear View Distance**: Distance within which the camera has perfect clarity

Cameras can be:
- Placed individually on the canvas
- Duplicated/copied to create multiple instances
- Moved and rotated after placement
- Deleted

### 3. Vision Calculation System

**Calculation Trigger**:
- Debounced recalculation (300-500ms delay) after any change:
  - Camera moved/rotated
  - Camera parameters changed
  - Obstacles drawn/modified

**Vision Algorithm**:
1. Cast rays from camera position within the FOV cone
2. Detect intersections with drawn obstacles
3. Calculate visible areas considering:
   - Line-of-sight occlusion by obstacles
   - Distance-based fog of war effect
   - FOV boundaries

**Fog of War Effect**:
- Areas within "Max Clear View Distance": 0% fog (fully visible)
- Areas between clear distance and max distance: Gradually fade from 0% to 100% fog
- Areas beyond max view distance: 100% fog (not visible)
- Areas outside FOV: 100% fog (not visible)
- Areas blocked by obstacles: 100% fog (not visible)

### 4. Visualization Modes

**Default Mode (Fog of War)**:
- Shows individual camera coverage with fog effect
- Visual feedback for distance-based clarity degradation
- Dark/obscured areas where cameras don't reach

**Heatmap Mode**:
- Aggregates coverage from all cameras
- Color-coded visualization:
  - Red/Hot: Areas covered by 0 cameras (blind spots)
  - Yellow/Warm: Areas covered by 1 camera
  - Green/Cool: Areas covered by 2+ cameras
- Helps identify gaps in coverage and optimize camera placement

## Technical Stack

### Frontend
- **HTML5 Canvas**: Primary rendering surface for drawing and visualization
- **JavaScript (Vanilla or Framework)**: Application logic
- **CSS3**: Styling and UI

### Suggested Libraries
- **Paper.js** or **Fabric.js**: Canvas manipulation and drawing tools
- **Ray Casting Library**: For line-of-sight calculations
- Or implement custom ray-casting algorithm

## Data Structures

### Camera Object
```javascript
{
  id: string,
  x: number,              // X position
  y: number,              // Y position
  angle: number,          // Facing direction in degrees (0-360)
  fov: number,            // Field of view in degrees (e.g., 60, 90, 120)
  maxDistance: number,    // Maximum view distance in pixels/units
  clearDistance: number,  // Maximum clear view distance in pixels/units
  name: string            // Optional camera identifier
}
```

### Obstacle Object
```javascript
{
  id: string,
  type: 'freehand' | 'line' | 'rectangle',
  points: [{x, y}, ...],  // Array of points defining the shape
  color: string,
  thickness: number
}
```

### Canvas State
```javascript
{
  obstacles: Obstacle[],
  cameras: Camera[],
  viewMode: 'fog' | 'heatmap',
  selectedTool: 'freehand' | 'line' | 'rectangle' | 'camera' | 'select',
  selectedCamera: string | null
}
```

## User Interface Layout

```
+----------------------------------------------------------+
| [Tools Panel]                                   [View Mode]|
| [Freehand] [Line] [Rectangle] [Camera] [Select]          |
|                                           [Fog] [Heatmap] |
+----------------------------------------------------------+
|                                                           |
|                                                           |
|                    Canvas Area                            |
|                  (drawing surface)                        |
|                                                           |
|                                                           |
+----------------------------------------------------------+
| [Properties Panel - when camera selected]                |
| Angle: [____] FOV: [____]                                |
| Max Distance: [____] Clear Distance: [____]              |
| [Duplicate Camera] [Delete Camera]                       |
+----------------------------------------------------------+
```

## Implementation Phases

### Phase 1: Basic Drawing (MVP)
- Set up HTML5 Canvas
- Implement drawing tools:
  - Freehand drawing
  - Line tool
  - Rectangle tool
- Basic shape storage and rendering

### Phase 2: Camera System
- Camera placement UI
- Camera configuration panel
- Basic camera rendering (show position, direction, FOV cone)
- Camera selection and manipulation

### Phase 3: Vision Calculation
- Implement ray-casting algorithm
- Line-of-sight calculation with obstacle detection
- Basic visibility polygon generation
- Debounced recalculation system

### Phase 4: Fog of War Visualization
- Render visibility areas with distance-based fog
- Implement gradient effect from clear to max distance
- Optimize rendering performance

### Phase 5: Heatmap Mode
- Aggregate coverage data from all cameras
- Implement heatmap color scheme
- Toggle between fog and heatmap modes

### Phase 6: Polish & Features
- Camera duplication
- Undo/redo functionality
- Save/load layouts
- Export visualization as image
- Responsive design
- Touch support for tablets

## Algorithm: Ray Casting for Line-of-Sight

**Basic Approach**:
1. For each camera, determine the FOV cone boundaries
2. Cast multiple rays (e.g., 100-360 rays) within the FOV cone
3. For each ray:
   - Check intersection with all obstacle line segments
   - Find nearest intersection point
   - Record distance and visibility
4. Create a visibility polygon from ray endpoints
5. Render polygon with distance-based opacity/color

**Optimization Considerations**:
- Use spatial partitioning (quadtree) for obstacle lookup
- Limit ray count based on FOV (wider FOV = more rays)
- Cache calculations when nothing changes
- Use Web Workers for heavy calculations
- Only recalculate affected regions when obstacles change

## Performance Targets

- Smooth drawing at 60fps
- Vision recalculation < 100ms for typical scenes (5-10 cameras, 20-30 obstacles)
- Support for up to 50 cameras and 100 obstacles without significant lag
- Debounce delay: 300-500ms

## Future Enhancements

- **Camera presets**: Common camera models with predefined FOV/distance
- **3D visualization**: Isometric or 3D view for multi-floor layouts
- **Camera cost calculator**: Budget planning based on camera count
- **Blind spot alerts**: Automatic detection and highlighting of coverage gaps
- **Video feed simulation**: Mockup of what each camera would actually see
- **Collaborative editing**: Multiple users planning together
- **Mobile app**: Native iOS/Android version
- **Import floor plans**: Upload existing building layouts
- **Distance measurement tool**: Measure distances on the canvas
- **Camera linking**: Show which cameras cover overlapping areas

## Technical Challenges

1. **Efficient ray casting**: Need fast algorithm for real-time updates
2. **Polygon rendering**: Smooth gradients for fog effect
3. **Heatmap generation**: Efficient pixel-by-pixel coverage calculation
4. **Touch/mobile support**: Gesture handling for drawing tools
5. **State management**: Handle complex undo/redo with multiple object types

## Browser Compatibility

Target modern browsers with Canvas API support:
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## File Structure

```
camera-planner/
├── index.html
├── styles/
│   └── main.css
├── scripts/
│   ├── app.js              # Main application entry
│   ├── canvas.js           # Canvas setup and management
│   ├── tools.js            # Drawing tools implementation
│   ├── camera.js           # Camera class and logic
│   ├── raycast.js          # Ray casting algorithm
│   ├── rendering.js        # Visualization rendering
│   └── ui.js               # UI controls and events
└── README.md
```

## Success Criteria

The application is successful when:
1. Users can easily draw floor plans with obstacles
2. Cameras can be placed and configured intuitively
3. Coverage visualization clearly shows blind spots
4. Heatmap mode effectively helps optimize camera placement
5. Performance remains smooth with realistic camera/obstacle counts
6. The tool helps users make better camera placement decisions

---

**Version**: 1.0
**Last Updated**: 2025-11-14
