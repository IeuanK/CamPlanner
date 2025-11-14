/**
 * Camera Class
 * Handles camera objects with position, angle, FOV, and viewing distances
 */

class Camera {
    constructor(x, y) {
        this.id = this.generateId();
        this.x = x;
        this.y = y;
        this.angle = 0;           // Direction in degrees (0 = right, 90 = down)
        this.fov = 90;            // Field of view in degrees
        this.maxDistance = 300;   // Maximum view distance
        this.clearDistance = 150; // Clear view distance (no fog)
        this.name = `Camera ${Date.now() % 1000}`;
    }

    generateId() {
        return `camera_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get the FOV cone points for rendering
    getFOVPoints() {
        const angleRad = (this.angle * Math.PI) / 180;
        const fovRad = (this.fov * Math.PI) / 180;

        const startAngle = angleRad - fovRad / 2;
        const endAngle = angleRad + fovRad / 2;

        return {
            start: {
                x: this.x + Math.cos(startAngle) * this.maxDistance,
                y: this.y + Math.sin(startAngle) * this.maxDistance
            },
            end: {
                x: this.x + Math.cos(endAngle) * this.maxDistance,
                y: this.y + Math.sin(endAngle) * this.maxDistance
            },
            center: {
                x: this.x + Math.cos(angleRad) * this.maxDistance,
                y: this.y + Math.sin(angleRad) * this.maxDistance
            }
        };
    }

    // Check if a point is within the camera body (for selection)
    containsPoint(point, radius = 15) {
        const dx = point.x - this.x;
        const dy = point.y - this.y;
        return Math.sqrt(dx * dx + dy * dy) <= radius;
    }

    // Clone camera for duplication
    clone() {
        const newCamera = new Camera(this.x + 30, this.y + 30);
        newCamera.angle = this.angle;
        newCamera.fov = this.fov;
        newCamera.maxDistance = this.maxDistance;
        newCamera.clearDistance = this.clearDistance;
        newCamera.name = `${this.name} (copy)`;
        return newCamera;
    }

    // Update camera properties
    updateProperties(properties) {
        if (properties.angle !== undefined) this.angle = properties.angle;
        if (properties.fov !== undefined) this.fov = properties.fov;
        if (properties.maxDistance !== undefined) this.maxDistance = properties.maxDistance;
        if (properties.clearDistance !== undefined) this.clearDistance = properties.clearDistance;
    }
}

/**
 * Camera Renderer
 * Handles rendering of cameras and their FOV cones
 */
class CameraRenderer {
    constructor(ctx) {
        this.ctx = ctx;
    }

    drawCamera(camera, isSelected = false) {
        const ctx = this.ctx;
        ctx.save();

        // Draw FOV cone
        this.drawFOVCone(camera, isSelected);

        // Draw camera body
        this.drawCameraBody(camera, isSelected);

        // Draw direction indicator
        this.drawDirectionIndicator(camera);

        // Draw rotation handle if selected
        if (isSelected) {
            this.drawRotationHandle(camera);
        }

        ctx.restore();
    }

    drawFOVCone(camera, isSelected) {
        const ctx = this.ctx;
        const fovPoints = camera.getFOVPoints();

        // Draw max distance cone (lighter)
        ctx.beginPath();
        ctx.moveTo(camera.x, camera.y);
        ctx.lineTo(fovPoints.start.x, fovPoints.start.y);
        ctx.arc(
            camera.x,
            camera.y,
            camera.maxDistance,
            (camera.angle - camera.fov / 2) * Math.PI / 180,
            (camera.angle + camera.fov / 2) * Math.PI / 180
        );
        ctx.lineTo(camera.x, camera.y);
        ctx.fillStyle = isSelected ? 'rgba(79, 195, 247, 0.1)' : 'rgba(76, 175, 80, 0.08)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? 'rgba(79, 195, 247, 0.4)' : 'rgba(76, 175, 80, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw clear distance cone (darker/more opaque)
        ctx.beginPath();
        ctx.moveTo(camera.x, camera.y);
        const clearFovPoints = this.getFOVPointsAtDistance(camera, camera.clearDistance);
        ctx.lineTo(clearFovPoints.start.x, clearFovPoints.start.y);
        ctx.arc(
            camera.x,
            camera.y,
            camera.clearDistance,
            (camera.angle - camera.fov / 2) * Math.PI / 180,
            (camera.angle + camera.fov / 2) * Math.PI / 180
        );
        ctx.lineTo(camera.x, camera.y);
        ctx.fillStyle = isSelected ? 'rgba(79, 195, 247, 0.2)' : 'rgba(76, 175, 80, 0.15)';
        ctx.fill();
    }

    getFOVPointsAtDistance(camera, distance) {
        const angleRad = (camera.angle * Math.PI) / 180;
        const fovRad = (camera.fov * Math.PI) / 180;

        const startAngle = angleRad - fovRad / 2;
        const endAngle = angleRad + fovRad / 2;

        return {
            start: {
                x: camera.x + Math.cos(startAngle) * distance,
                y: camera.y + Math.sin(startAngle) * distance
            },
            end: {
                x: camera.x + Math.cos(endAngle) * distance,
                y: camera.y + Math.sin(endAngle) * distance
            }
        };
    }

    drawCameraBody(camera, isSelected) {
        const ctx = this.ctx;
        const size = 15;

        // Camera body (circle)
        ctx.beginPath();
        ctx.arc(camera.x, camera.y, size, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#4fc3f7' : '#2196F3';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Selection indicator
        if (isSelected) {
            ctx.beginPath();
            ctx.arc(camera.x, camera.y, size + 4, 0, Math.PI * 2);
            ctx.strokeStyle = '#4fc3f7';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    drawDirectionIndicator(camera) {
        const ctx = this.ctx;
        const length = 20;
        const angleRad = (camera.angle * Math.PI) / 180;

        // Direction arrow
        ctx.beginPath();
        ctx.moveTo(camera.x, camera.y);
        const endX = camera.x + Math.cos(angleRad) * length;
        const endY = camera.y + Math.sin(angleRad) * length;
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Arrow head
        const arrowSize = 6;
        const arrowAngle = 0.5;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(angleRad - arrowAngle),
            endY - arrowSize * Math.sin(angleRad - arrowAngle)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(angleRad + arrowAngle),
            endY - arrowSize * Math.sin(angleRad + arrowAngle)
        );
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawRotationHandle(camera) {
        const ctx = this.ctx;
        const handleDistance = 40; // Distance from camera center
        const handleRadius = 8;
        const angleRad = (camera.angle * Math.PI) / 180;

        // Calculate handle position
        const handleX = camera.x + Math.cos(angleRad) * handleDistance;
        const handleY = camera.y + Math.sin(angleRad) * handleDistance;

        // Draw connecting line (dashed)
        ctx.beginPath();
        ctx.moveTo(camera.x, camera.y);
        ctx.lineTo(handleX, handleY);
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw rotation handle circle
        ctx.beginPath();
        ctx.arc(handleX, handleY, handleRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#4fc3f7';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw rotation icon (curved arrow)
        ctx.beginPath();
        ctx.arc(handleX, handleY, handleRadius * 0.5, 0.5, Math.PI * 1.5);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Small arrow tip
        const tipAngle = Math.PI * 1.5;
        const tipSize = 3;
        ctx.beginPath();
        ctx.moveTo(
            handleX + Math.cos(tipAngle) * handleRadius * 0.5,
            handleY + Math.sin(tipAngle) * handleRadius * 0.5
        );
        ctx.lineTo(
            handleX + Math.cos(tipAngle) * handleRadius * 0.5 + tipSize * Math.cos(tipAngle - 0.5),
            handleY + Math.sin(tipAngle) * handleRadius * 0.5 + tipSize * Math.sin(tipAngle - 0.5)
        );
        ctx.stroke();
    }

    // Get rotation handle position for hit testing
    getRotationHandlePosition(camera) {
        const handleDistance = 40;
        const angleRad = (camera.angle * Math.PI) / 180;
        return {
            x: camera.x + Math.cos(angleRad) * handleDistance,
            y: camera.y + Math.sin(angleRad) * handleDistance,
            radius: 8
        };
    }
}
