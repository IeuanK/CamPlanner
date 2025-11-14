/**
 * UI Controller
 * Handles all user interface interactions and events
 */

class UIController {
    constructor(canvasManager, drawingTools) {
        this.canvasManager = canvasManager;
        this.drawingTools = drawingTools;
        this.currentTool = 'freehand';
        this.currentViewMode = 'fog';

        this.setupToolButtons();
        this.setupViewModeButtons();
        this.setupActionButtons();
        this.setupCameraControls();
        this.setupStatusBar();
    }

    setupToolButtons() {
        const toolButtons = document.querySelectorAll('.tool-btn');

        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.disabled) return;

                const tool = button.dataset.tool;
                this.selectTool(tool);
            });
        });
    }

    selectTool(tool) {
        this.currentTool = tool;
        this.drawingTools.setTool(tool);

        // Update button states
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeButton = document.querySelector(`[data-tool="${tool}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Update cursor style
        const canvas = this.canvasManager.canvas;
        canvas.className = '';
        if (tool === 'select') {
            canvas.classList.add('cursor-default');
            this.updateStatus('Select mode - Click on cameras or objects to select and modify them');
        } else if (tool === 'camera') {
            canvas.classList.add('cursor-pointer');
            this.updateStatus('Camera mode - Click to place cameras');
        } else {
            canvas.classList.add('cursor-crosshair');
            this.updateStatus(`${tool.charAt(0).toUpperCase() + tool.slice(1)} tool selected - Draw on canvas`);
        }
    }

    setupViewModeButtons() {
        const modeButtons = document.querySelectorAll('.mode-btn');

        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.disabled) return;

                const mode = button.dataset.mode;
                this.selectViewMode(mode);
            });
        });
    }

    selectViewMode(mode) {
        // If clicking the same mode, toggle it off
        if (this.currentViewMode === mode) {
            this.currentViewMode = null;

            // Remove active state from all buttons
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Disable vision calculation
            if (this.canvasManager.visionCalculator) {
                this.canvasManager.visionCalculator.setEnabled(false);
                this.updateStatus('Vision view disabled');
            }
            return;
        }

        this.currentViewMode = mode;

        // Update button states
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeButton = document.querySelector(`[data-mode="${mode}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Toggle vision calculation based on mode
        if (this.canvasManager.visionCalculator) {
            if (mode === 'fog') {
                this.canvasManager.visionCalculator.setEnabled(true);
                this.updateStatus('Fog view enabled - Visibility areas shown');
            } else if (mode === 'heatmap') {
                // Heatmap mode not yet implemented (Phase 5)
                this.updateStatus('Heatmap mode not yet implemented');
            }
        }
    }

    setupActionButtons() {
        // Clear All button
        const clearButton = document.getElementById('btn-clear');
        clearButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear everything?')) {
                this.canvasManager.clearAll();
                this.updateStatus('Canvas cleared');
            }
        });

        // Undo button (will be implemented with undo/redo system)
        const undoButton = document.getElementById('btn-undo');
        undoButton.addEventListener('click', () => {
            // TODO: Implement undo functionality
            this.updateStatus('Undo not yet implemented');
        });
    }

    setupCameraControls() {
        // Camera property inputs
        const angleInput = document.getElementById('camera-angle');
        const fovInput = document.getElementById('camera-fov');
        const maxDistanceInput = document.getElementById('camera-max-distance');
        const clearDistanceInput = document.getElementById('camera-clear-distance');

        if (!angleInput || !fovInput || !maxDistanceInput || !clearDistanceInput) {
            console.error('Camera property inputs not found!');
            return;
        }

        console.log('Setting up camera controls...');

        // Update camera properties when inputs change
        const updateCameraProperty = () => {
            const camera = this.drawingTools.getSelectedCamera();
            if (!camera) {
                console.warn('No camera selected for property update');
                return;
            }

            console.log('Updating camera properties...');
            camera.updateProperties({
                angle: parseInt(angleInput.value) || 0,
                fov: parseInt(fovInput.value) || 90,
                maxDistance: parseInt(maxDistanceInput.value) || 300,
                clearDistance: parseInt(clearDistanceInput.value) || 150
            });

            // Trigger vision recalculation when camera properties change
            if (this.canvasManager.visionCalculator) {
                this.canvasManager.visionCalculator.requestRecalculation();
            }

            this.canvasManager.render(camera);
        };

        angleInput.addEventListener('input', updateCameraProperty);
        fovInput.addEventListener('input', updateCameraProperty);
        maxDistanceInput.addEventListener('input', updateCameraProperty);
        clearDistanceInput.addEventListener('input', updateCameraProperty);

        // Duplicate camera button
        const duplicateButton = document.getElementById('btn-duplicate-camera');
        duplicateButton.addEventListener('click', () => {
            this.drawingTools.duplicateSelectedCamera();
        });

        // Delete camera button
        const deleteButton = document.getElementById('btn-delete-camera');
        deleteButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this camera?')) {
                this.drawingTools.deleteSelectedCamera();
            }
        });
    }

    setupStatusBar() {
        const canvas = this.canvasManager.canvas;

        // Global functions for updating status (can be called from other modules)
        window.updateStatus = (message) => {
            this.updateStatus(message);
        };

        window.updateCursorPosition = (pos) => {
            this.updateCursorPosition(pos);
        };

        // Set initial status
        this.updateStatus('Ready - Select a tool to start drawing');
    }

    updateStatus(message) {
        const statusText = document.getElementById('status-text');
        statusText.textContent = message;
    }

    updateCursorPosition(pos) {
        const cursorPosition = document.getElementById('cursor-position');
        cursorPosition.textContent = `X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}`;
    }
}
