/**
 * Canvas Manager
 * Handles canvas initialization, resizing, and basic rendering
 */

class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.obstacles = [];
        this.cameras = [];
        this.cameraRenderer = null;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setCameraRenderer(renderer) {
        this.cameraRenderer = renderer;
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // Set canvas size to fit container with some padding
        this.canvas.width = Math.min(1200, rect.width - 40);
        this.canvas.height = Math.min(800, rect.height - 40);

        // Redraw everything after resize
        this.render();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render(selectedCamera = null) {
        this.clear();

        // Draw all cameras first (so obstacles appear on top)
        if (this.cameraRenderer) {
            this.cameras.forEach(camera => {
                const isSelected = selectedCamera && selectedCamera.id === camera.id;
                this.cameraRenderer.drawCamera(camera, isSelected);
            });
        }

        // Draw all obstacles
        this.obstacles.forEach(obstacle => {
            this.drawObstacle(obstacle);
        });
    }

    drawObstacle(obstacle) {
        const ctx = this.ctx;

        if (!obstacle.points || obstacle.points.length === 0) {
            return;
        }

        ctx.save();
        ctx.strokeStyle = obstacle.color || '#000000';
        ctx.lineWidth = obstacle.thickness || 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        switch (obstacle.type) {
            case 'freehand':
                this.drawFreehand(obstacle.points);
                break;
            case 'line':
                this.drawLine(obstacle.points);
                break;
            case 'rectangle':
                this.drawRectangle(obstacle.points, obstacle.angle || 0);
                break;
        }

        ctx.restore();
    }

    drawFreehand(points) {
        if (points.length < 2) return;

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }

        this.ctx.stroke();
    }

    drawLine(points) {
        if (points.length < 2) return;

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        this.ctx.lineTo(points[1].x, points[1].y);
        this.ctx.stroke();
    }

    drawRectangle(points, angle = 0) {
        if (points.length < 2) return;

        const x = Math.min(points[0].x, points[1].x);
        const y = Math.min(points[0].y, points[1].y);
        const width = Math.abs(points[1].x - points[0].x);
        const height = Math.abs(points[1].y - points[0].y);

        if (angle !== 0) {
            // Draw rotated rectangle
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            const angleRad = (angle * Math.PI) / 180;

            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(angleRad);
            this.ctx.beginPath();
            this.ctx.rect(-width / 2, -height / 2, width, height);
            this.ctx.stroke();
            this.ctx.restore();
        } else {
            // Draw normal rectangle
            this.ctx.beginPath();
            this.ctx.rect(x, y, width, height);
            this.ctx.stroke();
        }
    }

    addObstacle(obstacle) {
        obstacle.id = this.generateId();
        this.obstacles.push(obstacle);
        this.render();
    }

    removeObstacle(id) {
        this.obstacles = this.obstacles.filter(obs => obs.id !== id);
        this.render();
    }

    addCamera(camera) {
        this.cameras.push(camera);
        this.render();
    }

    removeCamera(id) {
        this.cameras = this.cameras.filter(cam => cam.id !== id);
        this.render();
    }

    findCameraAtPoint(point) {
        // Search in reverse order to select topmost camera
        for (let i = this.cameras.length - 1; i >= 0; i--) {
            const camera = this.cameras[i];
            if (camera.containsPoint(point)) {
                console.log('Camera found:', camera.id);
                return camera;
            }
        }
        return null;
    }

    clearAll() {
        this.obstacles = [];
        this.cameras = [];
        this.render();
    }

    generateId() {
        return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }
}
