/**
 * Chart utility functions for path generation and curve calculations
 */

/**
 * Calculate control points for cubic Bezier curves to create smooth transitions
 * Based on D3's curve generation logic
 */
function getControlPoints(points, i, tension = 0.5) {
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[Math.min(points.length - 1, i + 1)];
  const p3 = points[Math.min(points.length - 1, i + 2)];

  const x0 = p0.x;
  const y0 = p0.y;
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;
  const x3 = p3.x;
  const y3 = p3.y;

  const cp1x = x1 + ((x2 - x0) / 6) * tension;
  const cp1y = y1 + ((y2 - y0) / 6) * tension;
  const cp2x = x2 - ((x3 - x1) / 6) * tension;
  const cp2y = y2 - ((y3 - y1) / 6) * tension;

  return {
    cp1: { x: cp1x, y: cp1y },
    cp2: { x: cp2x, y: cp2y },
  };
}

/**
 * Generate a smooth path from data points using Cubic Bezier curves
 * Ensures all paths have the same structure for interpolation
 * @param {Array<{x: number, y: number}>} dataPoints - Array of pre-scaled coordinate objects
 * @returns {Object} Path object with Skia Path commands
 */
export function getSmoothPath(dataPoints) {
  if (!dataPoints || dataPoints.length === 0) {
    return null;
  }

  if (dataPoints.length === 1) {
    return {
      commands: [
        { type: "moveTo", x: dataPoints[0].x, y: dataPoints[0].y },
        { type: "lineTo", x: dataPoints[0].x, y: dataPoints[0].y },
      ],
      segments: [{ start: 0, end: 0 }],
    };
  }

  const commands = [];
  const segments = [];

  // Start with moveTo to first point
  commands.push({
    type: "moveTo",
    x: dataPoints[0].x,
    y: dataPoints[0].y,
  });

  // For 2 points, use a simple line
  if (dataPoints.length === 2) {
    commands.push({
      type: "lineTo",
      x: dataPoints[1].x,
      y: dataPoints[1].y,
    });
      segments.push({ start: dataPoints[0], end: dataPoints[1], cp1: dataPoints[0], cp2: dataPoints[1] });
    return { commands, segments };
  }

  // For 3+ points, use cubic Bezier curves
  for (let i = 0; i < dataPoints.length - 1; i++) {
    const current = dataPoints[i];
    const next = dataPoints[i + 1];

    if (i === 0) {
      // First segment: use next point and control point
      const cp2x = current.x + (next.x - current.x) * 0.3;
      const cp2y = current.y + (next.y - current.y) * 0.3;
      commands.push({
        type: "cubicTo",
        cpx1: current.x,
        cpy1: current.y,
        cpx2: cp2x,
        cpy2: cp2y,
        x: next.x,
        y: next.y,
      });
      segments.push({ start: current, end: next, cp1: current, cp2: { x: cp2x, y: cp2y } });
    } else if (i === dataPoints.length - 2) {
      // Last segment: use previous point and control point
      const prev = dataPoints[i - 1];
      const cp1x = current.x - (current.x - prev.x) * 0.3;
      const cp1y = current.y - (current.y - prev.y) * 0.3;
      commands.push({
        type: "cubicTo",
        cpx1: cp1x,
        cpy1: cp1y,
        cpx2: next.x,
        cpy2: next.y,
        x: next.x,
        y: next.y,
      });
      segments.push({ start: current, end: next, cp1: { x: cp1x, y: cp1y }, cp2: next });
    } else {
      // Middle segments: use control points from both sides
      const { cp1, cp2 } = getControlPoints(dataPoints, i);
      commands.push({
        type: "cubicTo",
        cpx1: cp1.x,
        cpy1: cp1.y,
        cpx2: cp2.x,
        cpy2: cp2.y,
        x: next.x,
        y: next.y,
      });
      segments.push({ start: current, end: next, cp1, cp2 });
    }
  }

  return { commands, segments };
}

/**
 * Find the y-coordinate on a Bezier curve for a given x-coordinate
 * This solves the cubic Bezier equation: B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
 * @param {Array} segments - Array of Bezier segments with start, end, cp1, cp2
 * @param {number} xCoordinate - Target x coordinate
 * @returns {number|null} - The corresponding y coordinate or null if not found
 */
export function getYforX(segments, xCoordinate) {
  "worklet";
  if (!segments || segments.length === 0) return null;

  // Binary search to find the segment containing the x-coordinate
  let segment = null;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const startX = seg.start.x;
    const endX = seg.end.x;

    // Handle both increasing and decreasing x values
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);

    if (xCoordinate >= minX && xCoordinate <= maxX) {
      segment = seg;
      break;
    }
  }

  if (!segment) {
    // If not found, return closest endpoint
    const firstSeg = segments[0];
    const lastSeg = segments[segments.length - 1];
    if (xCoordinate < firstSeg.start.x) {
      return firstSeg.start.y;
    }
    if (xCoordinate > lastSeg.end.x) {
      return lastSeg.end.y;
    }
    return null;
  }

  // Extract control points
  const p0 = { x: segment.start.x, y: segment.start.y };
  const p1 = segment.cp1 ? { x: segment.cp1.x, y: segment.cp1.y } : p0;
  const p2 = segment.cp2 ? { x: segment.cp2.x, y: segment.cp2.y } : { x: segment.end.x, y: segment.end.y };
  const p3 = { x: segment.end.x, y: segment.end.y };

  // If segment is essentially a line, use linear interpolation
  if (Math.abs(p0.x - p3.x) < 0.001) {
    return p0.y;
  }

  // Solve for t using Newton-Raphson method
  // We need to find t such that x(t) = xCoordinate
  // x(t) = (1-t)³x₀ + 3(1-t)²tx₁ + 3(1-t)t²x₂ + t³x₃
  let t = (xCoordinate - p0.x) / (p3.x - p0.x); // Initial guess
  t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]

  // Newton-Raphson iteration
  for (let iter = 0; iter < 20; iter++) {
    // Calculate x(t) and its derivative
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
    const dx = -3 * mt2 * p0.x + 3 * (mt2 - 2 * mt * t) * p1.x + 3 * (2 * mt * t - t2) * p2.x + 3 * t2 * p3.x;

    if (Math.abs(dx) < 0.0001) break; // Avoid division by zero

    const error = x - xCoordinate;
    if (Math.abs(error) < 0.001) break; // Close enough

    t = t - error / dx;
    t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]
  }

  // Calculate y(t) using the found t value
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;

  return y;
}

/**
 * Convert data points to canvas coordinates with scaling
 * @param {Array} data - Raw data points with x (time/date) and y (value)
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} padding - Padding object { top, bottom, left, right }
 * @returns {Array<{x: number, y: number}>} - Scaled coordinates ready for drawing
 */
export function scaleDataToCanvas(data, width, height, padding = { top: 20, bottom: 20, left: 20, right: 20 }) {
  if (!data || data.length === 0) return [];

  const { top = 20, bottom = 20, left = 20, right = 20 } = padding;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  // Extract x and y values
  const xValues = data.map((d) => (d.x instanceof Date ? d.x.getTime() : d.x));
  const yValues = data.map((d) => d.y || d.close || d.open || 0);

  // Find min/max for scaling
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  // Add some padding to y range
  const yRange = yMax - yMin;
  const yPadding = yRange * 0.1; // 10% padding
  const scaledYMin = yMin - yPadding;
  const scaledYMax = yMax + yPadding;

  // Scale factors
  const xScale = xMax !== xMin ? chartWidth / (xMax - xMin) : 1;
  const yScale = scaledYMax !== scaledYMin ? chartHeight / (scaledYMax - scaledYMin) : 1;

  // Convert to canvas coordinates (y is flipped)
  return data.map((d, i) => {
    const x = xValues[i];
    const y = yValues[i];
    const canvasX = left + (x - xMin) * xScale;
    const canvasY = top + chartHeight - (y - scaledYMin) * yScale;
    return { x: canvasX, y: canvasY, originalY: y };
  });
}

/**
 * Convert hex color to RGB values
 * Worklet-compatible version
 */
function hexToRgb(hex) {
  "worklet";
  const hexStr = hex.startsWith("#") ? hex.slice(1) : hex;
  const num = parseInt(hexStr, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Convert RGB to hex color
 * Worklet-compatible version
 */
function rgbToHex(r, g, b) {
  "worklet";
  const toHex = (n) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Interpolate between two colors based on a value
 * Worklet-compatible version
 * @param {string} color1 - Start color (hex)
 * @param {string} color2 - End color (hex)
 * @param {number} t - Interpolation factor [0, 1]
 * @returns {string} - Interpolated color (hex)
 */
export function interpolateColor(color1, color2, t) {
  "worklet";
  const clampT = Math.max(0, Math.min(1, t));

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const r = rgb1.r + (rgb2.r - rgb1.r) * clampT;
  const g = rgb1.g + (rgb2.g - rgb1.g) * clampT;
  const b = rgb1.b + (rgb2.b - rgb1.b) * clampT;

  return rgbToHex(r, g, b);
}

