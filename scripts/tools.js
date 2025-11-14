/**
 * Drawing Tools
 * Implements freehand, line, and rectangle drawing tools
 */

class DrawingTools {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.canvas = canvasManager.canvas;
        this.ctx = canvasManager.ctx;

        this.currentTool = 'freehand';
        this.isDrawing = false;
        this.currentPoints = [];
        this.previewPoints = [];

        this.color = '#000000';
        this.thickness = 2;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
    }

    setTool(tool) {
        this.currentTool = tool;
        this.isDrawing = false;
        this.currentPoints = [];
        this.previewPoints = [];
        this.canvasManager.render();
    }

    handleMouseDown(e) {
        if (this.currentTool === 'select' || this.currentTool === 'camera') {
            return; // These tools will be implemented in later phases
        }

        const pos = this.canvasManager.getCanvasCoordinates(e);
        this.isDrawing = true;
        this.currentPoints = [pos];

        if (this.currentTool === 'freehand') {
            // For freehand, start drawing immediately
            this.previewPoints = [pos];
        }
    }

    handleMouseMove(e) {
        const pos = this.canvasManager.getCanvasCoordinates(e);

        // Update cursor position display
        if (window.updateCursorPosition) {
            window.updateCursorPosition(pos);
        }

        if (!this.isDrawing) {
            return;
        }

        if (this.currentTool === 'freehand') {
            // Add point to freehand path
            this.currentPoints.push(pos);
            this.previewPoints.push(pos);
            this.drawPreview();
        } else if (this.currentTool === 'line' || this.currentTool === 'rectangle') {
            // Update end point for line/rectangle preview
            this.previewPoints = [this.currentPoints[0], pos];
            this.drawPreview();
        }
    }

    handleMouseUp(e) {
        if (!this.isDrawing) {
            return;
        }

        const pos = this.canvasManager.getCanvasCoordinates(e);

        if (this.currentTool === 'freehand') {
            // Finalize freehand drawing
            if (this.currentPoints.length > 1) {
                this.finalizeDrawing();
            }
        } else if (this.currentTool === 'line' || this.currentTool === 'rectangle') {
            // Finalize line or rectangle
            this.currentPoints.push(pos);
            if (this.currentPoints.length === 2) {
                this.finalizeDrawing();
            }
        }

        this.isDrawing = false;
        this.currentPoints = [];
        this.previewPoints = [];
    }

    handleMouseLeave(e) {
        if (this.isDrawing) {
            // Finalize drawing if mouse leaves canvas
            this.handleMouseUp(e);
        }
    }

    drawPreview() {
        // Redraw canvas with current state plus preview
        this.canvasManager.render();

        if (this.previewPoints.length === 0) {
            return;
        }

        // Draw preview in a lighter color
        this.ctx.save();
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.thickness;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = 0.7;

        if (this.currentTool === 'freehand') {
            this.drawFreehandPreview(this.previewPoints);
        } else if (this.currentTool === 'line') {
            this.drawLinePreview(this.previewPoints);
        } else if (this.currentTool === 'rectangle') {
            this.drawRectanglePreview(this.previewPoints);
        }

        this.ctx.restore();
    }

    drawFreehandPreview(points) {
        if (points.length < 2) return;

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }

        this.ctx.stroke();
    }

    drawLinePreview(points) {
        if (points.length < 2) return;

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        this.ctx.lineTo(points[1].x, points[1].y);
        this.ctx.stroke();
    }

    drawRectanglePreview(points) {
        if (points.length < 2) return;

        const x = Math.min(points[0].x, points[1].x);
        const y = Math.min(points[0].y, points[1].y);
        const width = Math.abs(points[1].x - points[0].x);
        const height = Math.abs(points[1].y - points[0].y);

        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this.ctx.stroke();
    }

    finalizeDrawing() {
        const obstacle = {
            type: this.currentTool,
            points: [...this.currentPoints],
            color: this.color,
            thickness: this.thickness
        };

        this.canvasManager.addObstacle(obstacle);

        // Update status
        if (window.updateStatus) {
            window.updateStatus(`${this.currentTool} drawn`);
        }
    }

    setColor(color) {
        this.color = color;
    }

    setThickness(thickness) {
        this.thickness = thickness;
    }
}
