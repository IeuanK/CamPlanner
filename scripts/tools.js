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

        // Select mode state
        this.selectedObstacle = null;
        this.dragState = null; // { mode: 'move'|'resize'|'rotate', handleIndex: number, startPos: {x,y}, originalPoints: [...], startAngle: number }
        this.hoverHandle = null;
        this.hoverRotationHandle = false;
        this.shiftPressed = false;

        // Camera mode state
        this.selectedCamera = null;
        this.cameraDragState = null; // { mode: 'move'|'rotate'|'fov-left'|'fov-right'|'range'|'clear-range', startPos, startAngle, startValue, side }

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));

        // Keyboard listeners for shift key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                this.shiftPressed = true;
            }
            // Delete key to remove selected object
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedObstacle && this.currentTool === 'select') {
                    this.deleteSelectedObstacle();
                }
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.shiftPressed = false;
            }
        });
    }

    setTool(tool) {
        this.currentTool = tool;
        this.isDrawing = false;
        this.currentPoints = [];
        this.previewPoints = [];

        // Clear selection when switching tools
        if (tool !== 'select') {
            this.selectedObstacle = null;
            this.dragState = null;
            this.hoverHandle = null;
        }

        this.canvasManager.render();
        if (this.currentTool === 'select' && this.selectedObstacle) {
            this.drawSelection();
        }
    }

    handleMouseDown(e) {
        const pos = this.canvasManager.getCanvasCoordinates(e);

        if (this.currentTool === 'select') {
            // Check if clicking on handles of selected camera first
            if (this.selectedCamera) {
                // Check rotation handle
                const rotationHandle = this.canvasManager.cameraRenderer.getRotationHandlePosition(this.selectedCamera);
                let dx = pos.x - rotationHandle.x;
                let dy = pos.y - rotationHandle.y;
                let distToHandle = Math.sqrt(dx * dx + dy * dy);

                if (distToHandle <= rotationHandle.radius) {
                    console.log('Rotation handle clicked');
                    this.cameraDragState = {
                        mode: 'rotate',
                        startPos: pos,
                        startAngle: this.selectedCamera.angle
                    };
                    return;
                }

                // Check FOV handles
                const fovHandles = this.canvasManager.cameraRenderer.getFOVHandlePositions(this.selectedCamera);

                dx = pos.x - fovHandles.left.x;
                dy = pos.y - fovHandles.left.y;
                distToHandle = Math.sqrt(dx * dx + dy * dy);

                if (distToHandle <= fovHandles.left.radius) {
                    console.log('Left FOV handle clicked');
                    this.cameraDragState = {
                        mode: 'fov',
                        side: 'left',
                        startPos: pos,
                        startFOV: this.selectedCamera.fov,
                        startAngle: this.selectedCamera.angle
                    };
                    return;
                }

                dx = pos.x - fovHandles.right.x;
                dy = pos.y - fovHandles.right.y;
                distToHandle = Math.sqrt(dx * dx + dy * dy);

                if (distToHandle <= fovHandles.right.radius) {
                    console.log('Right FOV handle clicked');
                    this.cameraDragState = {
                        mode: 'fov',
                        side: 'right',
                        startPos: pos,
                        startFOV: this.selectedCamera.fov,
                        startAngle: this.selectedCamera.angle
                    };
                    return;
                }

                // Check range handle
                const rangeHandle = this.canvasManager.cameraRenderer.getRangeHandlePosition(this.selectedCamera);
                dx = pos.x - rangeHandle.x;
                dy = pos.y - rangeHandle.y;
                distToHandle = Math.sqrt(dx * dx + dy * dy);

                if (distToHandle <= rangeHandle.radius) {
                    console.log('Range handle clicked');
                    this.cameraDragState = {
                        mode: 'range',
                        startPos: pos,
                        startDistance: this.selectedCamera.maxDistance
                    };
                    return;
                }

                // Check clear range handle
                const clearRangeHandle = this.canvasManager.cameraRenderer.getClearRangeHandlePosition(this.selectedCamera);
                dx = pos.x - clearRangeHandle.x;
                dy = pos.y - clearRangeHandle.y;
                distToHandle = Math.sqrt(dx * dx + dy * dy);

                if (distToHandle <= clearRangeHandle.radius) {
                    console.log('Clear range handle clicked');
                    this.cameraDragState = {
                        mode: 'clear-range',
                        startPos: pos,
                        startDistance: this.selectedCamera.clearDistance
                    };
                    return;
                }
            }

            // Check if clicking on a camera
            const clickedCamera = this.canvasManager.findCameraAtPoint(pos);
            if (clickedCamera) {
                console.log('Camera clicked:', clickedCamera.id);
                this.selectedCamera = clickedCamera;
                this.selectedObstacle = null;
                this.cameraDragState = {
                    mode: 'move',
                    startPos: pos,
                    startX: clickedCamera.x,
                    startY: clickedCamera.y
                };
                this.canvasManager.render(this.selectedCamera);
                this.showCameraProperties();
                if (window.updateStatus) {
                    window.updateStatus(`Selected camera`);
                }
                return;
            }

            // Check if clicking on rotation handle of selected rectangle
            if (this.selectedObstacle && this.selectedObstacle.type === 'rectangle' && this.hoverRotationHandle) {
                this.dragState = {
                    mode: 'rotate',
                    startPos: pos,
                    startAngle: this.selectedObstacle.angle || 0,
                    center: this.getRectangleCenter(this.selectedObstacle)
                };
                return;
            }

            // Check if clicking on a resize handle
            if (this.selectedObstacle && this.hoverHandle !== null) {
                this.dragState = {
                    mode: 'resize',
                    handleIndex: this.hoverHandle,
                    startPos: pos,
                    originalPoints: JSON.parse(JSON.stringify(this.selectedObstacle.points))
                };
                return;
            }

            // Check if clicking on selected obstacle to drag
            if (this.selectedObstacle && this.isPointInObstacle(pos, this.selectedObstacle)) {
                this.dragState = {
                    mode: 'move',
                    startPos: pos,
                    originalPoints: JSON.parse(JSON.stringify(this.selectedObstacle.points))
                };
                return;
            }

            // Try to select a new obstacle
            const clickedObstacle = this.findObstacleAtPoint(pos);
            if (clickedObstacle) {
                console.log('Obstacle clicked:', clickedObstacle.type, clickedObstacle.id);
                this.selectedObstacle = clickedObstacle;
                this.selectedCamera = null;
                this.hideCameraProperties();
                this.canvasManager.render();
                this.drawSelection();
                if (window.updateStatus) {
                    window.updateStatus(`Selected ${clickedObstacle.type}`);
                }
            } else {
                // Deselect if clicking on empty space
                this.selectedObstacle = null;
                this.selectedCamera = null;
                this.hideCameraProperties();
                this.canvasManager.render();
            }
            return;
        }

        if (this.currentTool === 'camera') {
            // Place a new camera
            const camera = new Camera(pos.x, pos.y);
            this.canvasManager.addCamera(camera);
            if (window.updateStatus) {
                window.updateStatus('Camera placed');
            }
            return;
        }

        // Drawing tools
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

        // Handle select mode
        if (this.currentTool === 'select') {
            // If dragging camera
            if (this.cameraDragState) {
                if (this.cameraDragState.mode === 'move' && this.selectedCamera) {
                    const dx = pos.x - this.cameraDragState.startPos.x;
                    const dy = pos.y - this.cameraDragState.startPos.y;
                    this.selectedCamera.x = this.cameraDragState.startX + dx;
                    this.selectedCamera.y = this.cameraDragState.startY + dy;
                    this.canvasManager.render(this.selectedCamera);
                } else if (this.cameraDragState.mode === 'rotate' && this.selectedCamera) {
                    // Calculate angle from camera center to mouse position
                    const dx = pos.x - this.selectedCamera.x;
                    const dy = pos.y - this.selectedCamera.y;
                    const angleRad = Math.atan2(dy, dx);
                    const angleDeg = (angleRad * 180) / Math.PI;

                    // Update camera angle
                    this.selectedCamera.angle = angleDeg;
                    this.canvasManager.render(this.selectedCamera);

                    // Update properties panel
                    const angleInput = document.getElementById('camera-angle');
                    if (angleInput) {
                        angleInput.value = Math.round(angleDeg);
                    }
                } else if (this.cameraDragState.mode === 'fov' && this.selectedCamera) {
                    // Calculate angle from camera to mouse
                    const dx = pos.x - this.selectedCamera.x;
                    const dy = pos.y - this.selectedCamera.y;
                    const mouseAngle = Math.atan2(dy, dx);

                    // Calculate the new FOV based on which handle is being dragged
                    const centerAngleRad = (this.cameraDragState.startAngle * Math.PI) / 180;
                    const startFOVRad = (this.cameraDragState.startFOV * Math.PI) / 180;

                    let newFOV;
                    if (this.cameraDragState.side === 'left') {
                        // Left handle: angle from mouse to center angle
                        let angleDiff = centerAngleRad - mouseAngle;
                        // Normalize angle to [-PI, PI]
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                        newFOV = Math.abs(angleDiff) * 2;
                    } else {
                        // Right handle: angle from center angle to mouse
                        let angleDiff = mouseAngle - centerAngleRad;
                        // Normalize angle to [-PI, PI]
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                        newFOV = Math.abs(angleDiff) * 2;
                    }

                    // Convert to degrees and clamp
                    newFOV = (newFOV * 180) / Math.PI;
                    newFOV = Math.max(10, Math.min(180, newFOV));

                    this.selectedCamera.fov = newFOV;
                    this.canvasManager.render(this.selectedCamera);

                    // Update properties panel
                    const fovInput = document.getElementById('camera-fov');
                    if (fovInput) {
                        fovInput.value = Math.round(newFOV);
                    }
                } else if (this.cameraDragState.mode === 'range' && this.selectedCamera) {
                    // Calculate distance from camera to mouse
                    const dx = pos.x - this.selectedCamera.x;
                    const dy = pos.y - this.selectedCamera.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Update max distance, clamped to reasonable values
                    this.selectedCamera.maxDistance = Math.max(50, Math.min(1000, distance));
                    this.canvasManager.render(this.selectedCamera);

                    // Update properties panel
                    const maxDistanceInput = document.getElementById('camera-max-distance');
                    if (maxDistanceInput) {
                        maxDistanceInput.value = Math.round(this.selectedCamera.maxDistance);
                    }
                } else if (this.cameraDragState.mode === 'clear-range' && this.selectedCamera) {
                    // Calculate distance from camera to mouse
                    const dx = pos.x - this.selectedCamera.x;
                    const dy = pos.y - this.selectedCamera.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Update clear distance, clamped to reasonable values and not exceeding max distance
                    this.selectedCamera.clearDistance = Math.max(50, Math.min(this.selectedCamera.maxDistance, distance));
                    this.canvasManager.render(this.selectedCamera);

                    // Update properties panel
                    const clearDistanceInput = document.getElementById('camera-clear-distance');
                    if (clearDistanceInput) {
                        clearDistanceInput.value = Math.round(this.selectedCamera.clearDistance);
                    }
                }
                return;
            }

            // If dragging/resizing/rotating obstacle
            if (this.dragState) {
                if (this.dragState.mode === 'move') {
                    this.moveObstacle(pos);
                } else if (this.dragState.mode === 'resize') {
                    this.resizeObstacle(pos);
                } else if (this.dragState.mode === 'rotate') {
                    this.rotateRectangle(pos);
                }
                return;
            }

            // Update hover state for resize and rotation handles
            if (this.selectedObstacle) {
                const handleIndex = this.getHandleAtPoint(pos);
                let rotationHandleHover = false;

                if (this.selectedObstacle.type === 'rectangle') {
                    rotationHandleHover = this.isPointOnRotationHandle(pos);
                }

                if (handleIndex !== this.hoverHandle || rotationHandleHover !== this.hoverRotationHandle) {
                    this.hoverHandle = handleIndex;
                    this.hoverRotationHandle = rotationHandleHover;
                    this.canvasManager.render();
                    this.drawSelection();
                }
            }
            return;
        }

        if (!this.isDrawing) {
            return;
        }

        if (this.currentTool === 'freehand') {
            // Add point to freehand path only if it's far enough from the last point
            const minDistance = 2; // pixels
            const lastPoint = this.currentPoints[this.currentPoints.length - 1];

            if (lastPoint) {
                const dx = pos.x - lastPoint.x;
                const dy = pos.y - lastPoint.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance >= minDistance) {
                    this.currentPoints.push(pos);
                    this.previewPoints.push(pos);
                    this.drawPreview();
                }
            }
        } else if (this.currentTool === 'line') {
            // Update end point for line preview with optional shift-snapping
            let endPoint = pos;
            if (this.shiftPressed) {
                endPoint = this.snapToAngles(this.currentPoints[0], pos);
            }
            this.previewPoints = [this.currentPoints[0], endPoint];
            this.drawPreview();
        } else if (this.currentTool === 'rectangle') {
            // Update end point for rectangle preview
            this.previewPoints = [this.currentPoints[0], pos];
            this.drawPreview();
        }
    }

    handleMouseUp(e) {
        // Handle select mode camera drag end
        if (this.currentTool === 'select' && this.cameraDragState) {
            this.cameraDragState = null;
            if (window.updateStatus) {
                window.updateStatus('Camera modified');
            }
            return;
        }

        // Handle select mode drag end
        if (this.currentTool === 'select' && this.dragState) {
            this.dragState = null;
            if (window.updateStatus) {
                window.updateStatus('Shape modified');
            }
            return;
        }

        if (!this.isDrawing) {
            return;
        }

        const pos = this.canvasManager.getCanvasCoordinates(e);

        if (this.currentTool === 'freehand') {
            // Finalize freehand drawing
            if (this.currentPoints.length > 1) {
                this.finalizeDrawing();
            }
        } else if (this.currentTool === 'line') {
            // Finalize line with optional shift-snapping
            let endPoint = pos;
            if (this.shiftPressed) {
                endPoint = this.snapToAngles(this.currentPoints[0], pos);
            }
            this.currentPoints.push(endPoint);
            if (this.currentPoints.length === 2) {
                this.finalizeDrawing();
            }
        } else if (this.currentTool === 'rectangle') {
            // Finalize rectangle
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

        // Add angle property for rectangles
        if (this.currentTool === 'rectangle') {
            obstacle.angle = 0;
        }

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

    // ===== SHIFT-SNAPPING FOR LINE TOOL =====

    snapToAngles(startPoint, endPoint) {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate angle in radians
        let angle = Math.atan2(dy, dx);

        // Snap to nearest 16th (22.5 degrees)
        const snapAngle = Math.PI / 8; // 22.5 degrees in radians
        angle = Math.round(angle / snapAngle) * snapAngle;

        // Calculate new end point
        return {
            x: startPoint.x + distance * Math.cos(angle),
            y: startPoint.y + distance * Math.sin(angle)
        };
    }

    // ===== SELECT MODE HELPER METHODS =====

    findObstacleAtPoint(point) {
        // Search in reverse order (top to bottom) to select topmost obstacle
        for (let i = this.canvasManager.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.canvasManager.obstacles[i];
            if (this.isPointInObstacle(point, obstacle)) {
                console.log('Obstacle found:', obstacle.type, obstacle.id);
                return obstacle;
            }
        }
        return null;
    }

    isPointInObstacle(point, obstacle) {
        const threshold = 10; // pixels

        if (obstacle.type === 'freehand') {
            // Check if point is near any line segment
            for (let i = 0; i < obstacle.points.length - 1; i++) {
                if (this.distanceToLineSegment(point, obstacle.points[i], obstacle.points[i + 1]) < threshold) {
                    return true;
                }
            }
            return false;
        } else if (obstacle.type === 'line') {
            return this.distanceToLineSegment(point, obstacle.points[0], obstacle.points[1]) < threshold;
        } else if (obstacle.type === 'rectangle') {
            const x = Math.min(obstacle.points[0].x, obstacle.points[1].x);
            const y = Math.min(obstacle.points[0].y, obstacle.points[1].y);
            const width = Math.abs(obstacle.points[1].x - obstacle.points[0].x);
            const height = Math.abs(obstacle.points[1].y - obstacle.points[0].y);

            // Check if point is near any of the rectangle edges
            const edges = [
                [{x, y}, {x: x + width, y}],
                [{x: x + width, y}, {x: x + width, y: y + height}],
                [{x: x + width, y: y + height}, {x, y: y + height}],
                [{x, y: y + height}, {x, y}]
            ];

            for (const edge of edges) {
                if (this.distanceToLineSegment(point, edge[0], edge[1]) < threshold) {
                    return true;
                }
            }
            return false;
        }
        return false;
    }

    distanceToLineSegment(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const lengthSquared = dx * dx + dy * dy;

        if (lengthSquared === 0) {
            // Line segment is a point
            const pdx = point.x - lineStart.x;
            const pdy = point.y - lineStart.y;
            return Math.sqrt(pdx * pdx + pdy * pdy);
        }

        // Calculate parameter t for projection onto line
        let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));

        // Find closest point on line segment
        const closestX = lineStart.x + t * dx;
        const closestY = lineStart.y + t * dy;

        // Calculate distance
        const pdx = point.x - closestX;
        const pdy = point.y - closestY;
        return Math.sqrt(pdx * pdx + pdy * pdy);
    }

    getHandleAtPoint(point) {
        if (!this.selectedObstacle) return null;

        const handleSize = 8;
        const points = this.selectedObstacle.points;

        for (let i = 0; i < points.length; i++) {
            const dx = point.x - points[i].x;
            const dy = point.y - points[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < handleSize) {
                return i;
            }
        }

        return null;
    }

    moveObstacle(currentPos) {
        if (!this.selectedObstacle || !this.dragState) return;

        const dx = currentPos.x - this.dragState.startPos.x;
        const dy = currentPos.y - this.dragState.startPos.y;

        // Update all points
        for (let i = 0; i < this.selectedObstacle.points.length; i++) {
            this.selectedObstacle.points[i] = {
                x: this.dragState.originalPoints[i].x + dx,
                y: this.dragState.originalPoints[i].y + dy
            };
        }

        this.canvasManager.render();
        this.drawSelection();
    }

    resizeObstacle(currentPos) {
        if (!this.selectedObstacle || !this.dragState) return;

        const handleIndex = this.dragState.handleIndex;
        let newPoint = currentPos;

        // Apply shift-snapping for lines
        if (this.selectedObstacle.type === 'line' && this.shiftPressed) {
            // Get the other point (not being dragged)
            const otherIndex = handleIndex === 0 ? 1 : 0;
            const anchorPoint = this.selectedObstacle.points[otherIndex];
            newPoint = this.snapToAngles(anchorPoint, currentPos);
        }

        // Update the specific handle point
        this.selectedObstacle.points[handleIndex] = {
            x: newPoint.x,
            y: newPoint.y
        };

        this.canvasManager.render();
        this.drawSelection();
    }

    drawSelection() {
        if (!this.selectedObstacle) return;

        const ctx = this.ctx;
        ctx.save();

        // Draw selection outline
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        // Draw bounding box for the obstacle
        const points = this.selectedObstacle.points;

        if (this.selectedObstacle.type === 'rectangle') {
            const x = Math.min(points[0].x, points[1].x);
            const y = Math.min(points[0].y, points[1].y);
            const width = Math.abs(points[1].x - points[0].x);
            const height = Math.abs(points[1].y - points[0].y);
            ctx.strokeRect(x, y, width, height);
        } else {
            // For lines and freehand, draw around the points
            ctx.beginPath();
            if (points.length === 2) {
                ctx.moveTo(points[0].x, points[0].y);
                ctx.lineTo(points[1].x, points[1].y);
            }
            ctx.stroke();
        }

        ctx.setLineDash([]);

        // Draw resize handles
        ctx.fillStyle = '#4fc3f7';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        for (let i = 0; i < points.length; i++) {
            const isHover = this.hoverHandle === i;
            const size = isHover ? 10 : 8;

            ctx.fillRect(points[i].x - size / 2, points[i].y - size / 2, size, size);
            ctx.strokeRect(points[i].x - size / 2, points[i].y - size / 2, size, size);
        }

        // Draw rotation handle for rectangles
        if (this.selectedObstacle.type === 'rectangle') {
            const handle = this.getRotationHandlePosition(this.selectedObstacle);
            if (handle) {
                const center = this.getRectangleCenter(this.selectedObstacle);

                // Draw connecting line (dashed)
                ctx.beginPath();
                ctx.moveTo(center.x, center.y);
                ctx.lineTo(handle.x, handle.y);
                ctx.strokeStyle = '#4fc3f7';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw rotation handle circle
                const size = this.hoverRotationHandle ? 10 : 8;
                ctx.beginPath();
                ctx.arc(handle.x, handle.y, size, 0, Math.PI * 2);
                ctx.fillStyle = '#4fc3f7';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw rotation icon (curved arrow)
                ctx.beginPath();
                ctx.arc(handle.x, handle.y, size * 0.5, 0.5, Math.PI * 1.5);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    deleteSelectedObstacle() {
        if (!this.selectedObstacle) return;

        this.canvasManager.removeObstacle(this.selectedObstacle.id);
        this.selectedObstacle = null;
        this.canvasManager.render();

        if (window.updateStatus) {
            window.updateStatus('Shape deleted');
        }
    }

    // ===== RECTANGLE ROTATION METHODS =====

    getRectangleCenter(rectangle) {
        const x = Math.min(rectangle.points[0].x, rectangle.points[1].x);
        const y = Math.min(rectangle.points[0].y, rectangle.points[1].y);
        const width = Math.abs(rectangle.points[1].x - rectangle.points[0].x);
        const height = Math.abs(rectangle.points[1].y - rectangle.points[0].y);
        return {
            x: x + width / 2,
            y: y + height / 2
        };
    }

    rotateRectangle(currentPos) {
        if (!this.selectedObstacle || !this.dragState || this.dragState.mode !== 'rotate') return;

        const center = this.dragState.center;
        const dx = currentPos.x - center.x;
        const dy = currentPos.y - center.y;
        let angleRad = Math.atan2(dy, dx);
        let angleDeg = (angleRad * 180) / Math.PI;

        // Apply shift-snapping for rotation
        if (this.shiftPressed) {
            // Snap to 15 degree increments
            const snapAngle = 15;
            angleDeg = Math.round(angleDeg / snapAngle) * snapAngle;
        }

        this.selectedObstacle.angle = angleDeg;
        this.canvasManager.render();
        this.drawSelection();
    }

    getRotationHandlePosition(rectangle) {
        if (!rectangle || rectangle.type !== 'rectangle') return null;

        const center = this.getRectangleCenter(rectangle);
        const handleDistance = 50;
        const angle = (rectangle.angle || 0);
        const angleRad = (angle * Math.PI) / 180;

        return {
            x: center.x + Math.cos(angleRad) * handleDistance,
            y: center.y + Math.sin(angleRad) * handleDistance,
            radius: 8
        };
    }

    isPointOnRotationHandle(point) {
        if (!this.selectedObstacle || this.selectedObstacle.type !== 'rectangle') return false;

        const handle = this.getRotationHandlePosition(this.selectedObstacle);
        if (!handle) return false;

        const dx = point.x - handle.x;
        const dy = point.y - handle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        return dist <= handle.radius;
    }

    // ===== CAMERA PROPERTIES PANEL =====

    showCameraProperties() {
        const panel = document.getElementById('properties-panel');
        if (!panel) {
            console.error('Properties panel not found!');
            return;
        }
        if (!this.selectedCamera) {
            console.warn('No camera selected');
            return;
        }

        console.log('Showing camera properties for camera:', this.selectedCamera.id);
        panel.style.display = 'block';

        // Populate fields with camera properties
        const angleInput = document.getElementById('camera-angle');
        const fovInput = document.getElementById('camera-fov');
        const maxDistanceInput = document.getElementById('camera-max-distance');
        const clearDistanceInput = document.getElementById('camera-clear-distance');

        if (angleInput) angleInput.value = this.selectedCamera.angle;
        if (fovInput) fovInput.value = this.selectedCamera.fov;
        if (maxDistanceInput) maxDistanceInput.value = this.selectedCamera.maxDistance;
        if (clearDistanceInput) clearDistanceInput.value = this.selectedCamera.clearDistance;
    }

    hideCameraProperties() {
        const panel = document.getElementById('properties-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    getSelectedCamera() {
        return this.selectedCamera;
    }

    deleteSelectedCamera() {
        if (!this.selectedCamera) return;

        this.canvasManager.removeCamera(this.selectedCamera.id);
        this.selectedCamera = null;
        this.hideCameraProperties();
        this.canvasManager.render();

        if (window.updateStatus) {
            window.updateStatus('Camera deleted');
        }
    }

    duplicateSelectedCamera() {
        if (!this.selectedCamera) return;

        const newCamera = this.selectedCamera.clone();
        this.canvasManager.addCamera(newCamera);
        this.selectedCamera = newCamera;
        this.canvasManager.render(this.selectedCamera);
        this.showCameraProperties();

        if (window.updateStatus) {
            window.updateStatus('Camera duplicated');
        }
    }
}
