/**
 * UI Controller
 * Handles all user interface interactions and events
 */

class UIController {
    constructor(canvasManager, drawingTools) {
        this.canvasManager = canvasManager;
        this.drawingTools = drawingTools;
        this.currentTool = 'freehand';

        this.setupToolButtons();
        this.setupActionButtons();
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
        } else if (tool === 'camera') {
            canvas.classList.add('cursor-pointer');
        } else {
            canvas.classList.add('cursor-crosshair');
        }

        // Update status
        this.updateStatus(`${tool.charAt(0).toUpperCase() + tool.slice(1)} tool selected`);
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
