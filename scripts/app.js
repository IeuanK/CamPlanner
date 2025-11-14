/**
 * Main Application Entry Point
 * Initializes the Camera Layout Planner application
 */

class CameraPlanner {
    constructor() {
        this.canvasManager = null;
        this.drawingTools = null;
        this.uiController = null;

        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    start() {
        console.log('Camera Layout Planner - Starting...');

        // Initialize canvas manager
        this.canvasManager = new CanvasManager('mainCanvas');
        console.log('Canvas Manager initialized');

        // Initialize camera renderer
        const cameraRenderer = new CameraRenderer(this.canvasManager.ctx);
        this.canvasManager.setCameraRenderer(cameraRenderer);
        console.log('Camera Renderer initialized');

        // Initialize vision calculator
        const visionCalculator = new VisionCalculator(this.canvasManager);
        this.canvasManager.setVisionCalculator(visionCalculator);
        console.log('Vision Calculator initialized');

        // Initialize drawing tools
        this.drawingTools = new DrawingTools(this.canvasManager);
        console.log('Drawing Tools initialized');

        // Initialize UI controller
        this.uiController = new UIController(this.canvasManager, this.drawingTools);
        console.log('UI Controller initialized');

        // Set default tool to Select for easier camera/object manipulation
        this.uiController.selectTool('select');

        console.log('Camera Layout Planner - Ready!');
        console.log('Current tool:', this.drawingTools.currentTool);
    }
}

// Initialize the application
const app = new CameraPlanner();
