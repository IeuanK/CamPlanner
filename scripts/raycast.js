/**
 * Ray Casting Engine
 * Implements line-of-sight calculations and visibility polygon generation
 * for camera vision calculation with obstacle detection
 */

class RayCaster {
    constructor() {
        this.rayCount = 360; // Number of rays to cast (can be adjusted for performance)
    }

    /**
     * Calculate visibility polygon for a camera considering obstacles
     * @param {Camera} camera - The camera to calculate visibility for
     * @param {Array} obstacles - Array of obstacle objects
     * @param {Object} canvasBounds - Canvas boundaries {width, height}
     * @returns {Object} Visibility data including polygon points and distance info
     */
    calculateVisibility(camera, obstacles, canvasBounds) {
        // Get all obstacle line segments
        const segments = this.getAllSegments(obstacles, canvasBounds);

        // Get all unique angles to cast rays at
        const angles = this.getUniqueAngles(camera, segments);

        // Cast rays and find intersections
        const rayHits = this.castRays(camera, angles, segments);

        // Build visibility polygon
        const visibilityPolygon = this.buildVisibilityPolygon(camera, rayHits);

        return {
            polygon: visibilityPolygon,
            rayHits: rayHits
        };
    }

    /**
     * Extract all line segments from obstacles and add canvas boundaries
     * @param {Array} obstacles - Array of obstacle objects
     * @param {Object} canvasBounds - Canvas boundaries {width, height}
     * @returns {Array} Array of line segments
     */
    getAllSegments(obstacles, canvasBounds) {
        const segments = [];

        // Add canvas boundary segments
        const margin = 10000; // Large margin to ensure rays hit boundaries
        segments.push(
            { p1: {x: -margin, y: -margin}, p2: {x: canvasBounds.width + margin, y: -margin} }, // Top
            { p1: {x: canvasBounds.width + margin, y: -margin}, p2: {x: canvasBounds.width + margin, y: canvasBounds.height + margin} }, // Right
            { p1: {x: canvasBounds.width + margin, y: canvasBounds.height + margin}, p2: {x: -margin, y: canvasBounds.height + margin} }, // Bottom
            { p1: {x: -margin, y: canvasBounds.height + margin}, p2: {x: -margin, y: -margin} } // Left
        );

        // Extract segments from obstacles
        for (const obstacle of obstacles) {
            if (!obstacle.points || obstacle.points.length === 0) continue;

            if (obstacle.type === 'line') {
                if (obstacle.points.length >= 2) {
                    segments.push({
                        p1: obstacle.points[0],
                        p2: obstacle.points[1]
                    });
                }
            } else if (obstacle.type === 'freehand') {
                // Each consecutive pair of points forms a segment
                for (let i = 0; i < obstacle.points.length - 1; i++) {
                    segments.push({
                        p1: obstacle.points[i],
                        p2: obstacle.points[i + 1]
                    });
                }
            } else if (obstacle.type === 'rectangle') {
                const corners = this.getRectangleCorners(obstacle);
                // Create 4 segments from the corners
                for (let i = 0; i < 4; i++) {
                    segments.push({
                        p1: corners[i],
                        p2: corners[(i + 1) % 4]
                    });
                }
            }
        }

        return segments;
    }

    /**
     * Get the four corners of a rectangle, accounting for rotation
     * @param {Object} rectangle - Rectangle obstacle
     * @returns {Array} Array of 4 corner points
     */
    getRectangleCorners(rectangle) {
        const x = Math.min(rectangle.points[0].x, rectangle.points[1].x);
        const y = Math.min(rectangle.points[0].y, rectangle.points[1].y);
        const width = Math.abs(rectangle.points[1].x - rectangle.points[0].x);
        const height = Math.abs(rectangle.points[1].y - rectangle.points[0].y);

        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const angle = (rectangle.angle || 0) * Math.PI / 180;

        // Define corners relative to center
        const localCorners = [
            {x: -width / 2, y: -height / 2},
            {x: width / 2, y: -height / 2},
            {x: width / 2, y: height / 2},
            {x: -width / 2, y: height / 2}
        ];

        // Rotate and translate corners
        const corners = localCorners.map(corner => {
            const rotatedX = corner.x * Math.cos(angle) - corner.y * Math.sin(angle);
            const rotatedY = corner.x * Math.sin(angle) + corner.y * Math.cos(angle);
            return {
                x: centerX + rotatedX,
                y: centerY + rotatedY
            };
        });

        return corners;
    }

    /**
     * Get unique angles to cast rays at (to segment endpoints and camera FOV boundaries)
     * @param {Camera} camera - The camera
     * @param {Array} segments - Array of line segments
     * @returns {Array} Array of angles in radians
     */
    getUniqueAngles(camera, segments) {
        const angles = new Set();

        // Add angles to all segment endpoints with slight offsets
        for (const segment of segments) {
            const angle1 = Math.atan2(segment.p1.y - camera.y, segment.p1.x - camera.x);
            const angle2 = Math.atan2(segment.p2.y - camera.y, segment.p2.x - camera.x);

            // Add the angle and slight offsets to catch edges
            const offset = 0.0001;
            angles.add(angle1 - offset);
            angles.add(angle1);
            angles.add(angle1 + offset);
            angles.add(angle2 - offset);
            angles.add(angle2);
            angles.add(angle2 + offset);
        }

        // Add evenly distributed angles for smooth coverage
        const numRays = this.rayCount;
        for (let i = 0; i < numRays; i++) {
            const angle = (i / numRays) * Math.PI * 2;
            angles.add(angle);
        }

        // Convert to array and filter by FOV
        const angleArray = Array.from(angles);
        const cameraAngleRad = camera.angle * Math.PI / 180;
        const fovRad = camera.fov * Math.PI / 180;

        // Filter angles to only those within the FOV cone
        const filteredAngles = angleArray.filter(angle => {
            // Normalize angle difference to [-PI, PI]
            let diff = angle - cameraAngleRad;
            while (diff > Math.PI) diff -= 2 * Math.PI;
            while (diff < -Math.PI) diff += 2 * Math.PI;

            return Math.abs(diff) <= fovRad / 2;
        });

        // Always include FOV boundary angles
        filteredAngles.push(cameraAngleRad - fovRad / 2);
        filteredAngles.push(cameraAngleRad + fovRad / 2);

        return filteredAngles;
    }

    /**
     * Cast rays at given angles and find intersections
     * @param {Camera} camera - The camera
     * @param {Array} angles - Array of angles to cast rays at
     * @param {Array} segments - Array of line segments
     * @returns {Array} Array of ray hit information
     */
    castRays(camera, angles, segments) {
        const hits = [];

        for (const angle of angles) {
            // Create ray endpoint at max distance
            const rayEnd = {
                x: camera.x + Math.cos(angle) * camera.maxDistance * 2,
                y: camera.y + Math.sin(angle) * camera.maxDistance * 2
            };

            // Find closest intersection
            let closestIntersection = null;
            let closestDistance = Infinity;

            for (const segment of segments) {
                const intersection = this.lineIntersection(
                    camera,
                    rayEnd,
                    segment.p1,
                    segment.p2
                );

                if (intersection) {
                    const distance = this.distance(camera, intersection);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestIntersection = intersection;
                    }
                }
            }

            // If we found an intersection, cap it at max distance
            if (closestIntersection) {
                const distance = this.distance(camera, closestIntersection);
                if (distance > camera.maxDistance) {
                    // Cap the point at max distance
                    closestIntersection = {
                        x: camera.x + Math.cos(angle) * camera.maxDistance,
                        y: camera.y + Math.sin(angle) * camera.maxDistance
                    };
                    closestDistance = camera.maxDistance;
                }

                hits.push({
                    angle: angle,
                    point: closestIntersection,
                    distance: closestDistance
                });
            }
        }

        // Sort hits by angle for proper polygon construction
        hits.sort((a, b) => a.angle - b.angle);

        return hits;
    }

    /**
     * Build visibility polygon from ray hits
     * @param {Camera} camera - The camera
     * @param {Array} rayHits - Array of ray hit information
     * @returns {Array} Array of polygon points
     */
    buildVisibilityPolygon(camera, rayHits) {
        const polygon = [{x: camera.x, y: camera.y}];

        for (const hit of rayHits) {
            polygon.push(hit.point);
        }

        return polygon;
    }

    /**
     * Calculate line segment intersection
     * @param {Object} p1 - First point of first line
     * @param {Object} p2 - Second point of first line
     * @param {Object} p3 - First point of second line
     * @param {Object} p4 - Second point of second line
     * @returns {Object|null} Intersection point or null
     */
    lineIntersection(p1, p2, p3, p4) {
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;

        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (Math.abs(denominator) < 0.0001) {
            // Lines are parallel
            return null;
        }

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            // Intersection exists
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1)
            };
        }

        return null;
    }

    /**
     * Calculate distance between two points
     * @param {Object} p1 - First point
     * @param {Object} p2 - Second point
     * @returns {number} Distance
     */
    distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

/**
 * Vision Calculator
 * Handles debounced recalculation of camera vision and manages vision data
 */
class VisionCalculator {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.rayCaster = new RayCaster();
        this.visionData = new Map(); // Map camera ID to vision data
        this.debounceTimer = null;
        this.debounceDelay = 400; // 400ms debounce delay
        this.enabled = true;
    }

    /**
     * Request a vision recalculation (debounced)
     */
    requestRecalculation() {
        if (!this.enabled) return;

        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Set new timer
        this.debounceTimer = setTimeout(() => {
            this.recalculateAll();
        }, this.debounceDelay);
    }

    /**
     * Force immediate recalculation (bypasses debounce)
     */
    recalculateAll() {
        if (!this.enabled) return;

        console.log('Recalculating vision for all cameras...');

        const canvasBounds = {
            width: this.canvasManager.canvas.width,
            height: this.canvasManager.canvas.height
        };

        // Clear old vision data
        this.visionData.clear();

        // Calculate vision for each camera
        for (const camera of this.canvasManager.cameras) {
            const visionResult = this.rayCaster.calculateVisibility(
                camera,
                this.canvasManager.obstacles,
                canvasBounds
            );

            this.visionData.set(camera.id, visionResult);
        }

        // Trigger re-render to show new vision data
        this.canvasManager.render();

        console.log(`Vision calculated for ${this.canvasManager.cameras.length} camera(s)`);
    }

    /**
     * Get vision data for a specific camera
     * @param {string} cameraId - Camera ID
     * @returns {Object|null} Vision data or null
     */
    getVisionData(cameraId) {
        return this.visionData.get(cameraId) || null;
    }

    /**
     * Enable or disable vision calculation
     * @param {boolean} enabled - Whether to enable vision calculation
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.visionData.clear();
            this.canvasManager.render();
        } else {
            this.requestRecalculation();
        }
    }

    /**
     * Check if vision calculation is enabled
     * @returns {boolean} Whether vision calculation is enabled
     */
    isEnabled() {
        return this.enabled;
    }
}
