// SVG Generation Functions for Geometric Shapes
// Based on the pizza slice generation approach used in fraction explanations

/**
 * Creates an SVG rectangle with customizable dimensions and styling
 * @param {string} containerId - The ID of the container element
 * @param {number} width - Width of the rectangle
 * @param {number} height - Height of the rectangle
 * @param {object} options - Styling options
 */
export function createRectangleSVG(containerId, width, height, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgWidth = Math.max(width + 40, 200);
  const svgHeight = Math.max(height + 40, 150);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", svgHeight);
  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const rectX = centerX - width / 2;
  const rectY = centerY - height / 2;

  // Create rectangle
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", rectX);
  rect.setAttribute("y", rectY);
  rect.setAttribute("width", width);
  rect.setAttribute("height", height);
  rect.setAttribute("fill", options.fill || "#4ecdc4");
  rect.setAttribute("stroke", options.stroke || "#26a69a");
  rect.setAttribute("stroke-width", options.strokeWidth || "3");

  if (options.showGrid) {
    // Create grid lines for area visualization
    for (let i = 1; i < width / 20; i++) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", rectX + i * 20);
      line.setAttribute("y1", rectY);
      line.setAttribute("x2", rectX + i * 20);
      line.setAttribute("y2", rectY + height);
      line.setAttribute("stroke", "#fff");
      line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
    }

    for (let i = 1; i < height / 20; i++) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", rectX);
      line.setAttribute("y1", rectY + i * 20);
      line.setAttribute("x2", rectX + width);
      line.setAttribute("y2", rectY + i * 20);
      line.setAttribute("stroke", "#fff");
      line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
    }
  }

  svg.appendChild(rect);

  // Add dimension labels if requested
  if (options.showDimensions) {
    // Width label
    const widthText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    widthText.setAttribute("x", centerX);
    widthText.setAttribute("y", rectY - 10);
    widthText.setAttribute("text-anchor", "middle");
    widthText.setAttribute("font-family", "Comic Sans MS, sans-serif");
    widthText.setAttribute("font-size", "14");
    widthText.setAttribute("font-weight", "bold");
    widthText.setAttribute("fill", "#333");
    widthText.textContent = `${width / 20} units`;
    svg.appendChild(widthText);

    // Height label
    const heightText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    heightText.setAttribute("x", rectX - 10);
    heightText.setAttribute("y", centerY);
    heightText.setAttribute("text-anchor", "middle");
    heightText.setAttribute("font-family", "Comic Sans MS, sans-serif");
    heightText.setAttribute("font-size", "14");
    heightText.setAttribute("font-weight", "bold");
    heightText.setAttribute("fill", "#333");
    heightText.setAttribute(
      "transform",
      `rotate(-90, ${rectX - 10}, ${centerY})`
    );
    heightText.textContent = `${height / 20} units`;
    svg.appendChild(heightText);
  }

  container.appendChild(svg);
}

/**
 * Creates an SVG square (special case of rectangle)
 * @param {string} containerId - The ID of the container element
 * @param {number} size - Side length of the square
 * @param {object} options - Styling options
 */
export function createSquareSVG(containerId, size, options = {}) {
  createRectangleSVG(containerId, size, size, {
    ...options,
    fill: options.fill || "#ff9800",
    stroke: options.stroke || "#f57c00",
  });
}

/**
 * Creates an SVG circle
 * @param {string} containerId - The ID of the container element
 * @param {number} radius - Radius of the circle
 * @param {object} options - Styling options
 */
export function createCircleSVG(containerId, radius, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgSize = (radius + 40) * 2;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgSize);
  svg.setAttribute("height", svgSize);
  svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  // Create circle
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("cx", centerX);
  circle.setAttribute("cy", centerY);
  circle.setAttribute("r", radius);
  circle.setAttribute("fill", options.fill || "#e91e63");
  circle.setAttribute("stroke", options.stroke || "#c2185b");
  circle.setAttribute("stroke-width", options.strokeWidth || "3");

  svg.appendChild(circle);

  // Add radius line if requested
  if (options.showRadius) {
    const radiusLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    radiusLine.setAttribute("x1", centerX);
    radiusLine.setAttribute("y1", centerY);
    radiusLine.setAttribute("x2", centerX + radius);
    radiusLine.setAttribute("y2", centerY);
    radiusLine.setAttribute("stroke", "#333");
    radiusLine.setAttribute("stroke-width", "2");
    radiusLine.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(radiusLine);

    // Radius label
    const radiusText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    radiusText.setAttribute("x", centerX + radius / 2);
    radiusText.setAttribute("y", centerY - 5);
    radiusText.setAttribute("text-anchor", "middle");
    radiusText.setAttribute("font-family", "Comic Sans MS, sans-serif");
    radiusText.setAttribute("font-size", "12");
    radiusText.setAttribute("font-weight", "bold");
    radiusText.setAttribute("fill", "#333");
    radiusText.textContent = `r = ${radius / 20}`;
    svg.appendChild(radiusText);
  }

  // Add diameter line if requested
  if (options.showDiameter) {
    const diameterLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    diameterLine.setAttribute("x1", centerX - radius);
    diameterLine.setAttribute("y1", centerY);
    diameterLine.setAttribute("x2", centerX + radius);
    diameterLine.setAttribute("y2", centerY);
    diameterLine.setAttribute("stroke", "#333");
    diameterLine.setAttribute("stroke-width", "2");
    diameterLine.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(diameterLine);

    // Diameter label
    const diameterText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    diameterText.setAttribute("x", centerX);
    diameterText.setAttribute("y", centerY + 20);
    diameterText.setAttribute("text-anchor", "middle");
    diameterText.setAttribute("font-family", "Comic Sans MS, sans-serif");
    diameterText.setAttribute("font-size", "12");
    diameterText.setAttribute("font-weight", "bold");
    diameterText.setAttribute("fill", "#333");
    diameterText.textContent = `d = ${(radius * 2) / 20}`;
    svg.appendChild(diameterText);
  }

  container.appendChild(svg);
}

/**
 * Creates an SVG triangle
 * @param {string} containerId - The ID of the container element
 * @param {number} base - Base width of the triangle
 * @param {number} height - Height of the triangle
 * @param {object} options - Styling options
 */
export function createTriangleSVG(containerId, base, height, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgWidth = Math.max(base + 40, 200);
  const svgHeight = Math.max(height + 40, 150);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", svgHeight);
  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Triangle points (equilateral by default, or specified dimensions)
  const topX = centerX;
  const topY = centerY - height / 2;
  const leftX = centerX - base / 2;
  const leftY = centerY + height / 2;
  const rightX = centerX + base / 2;
  const rightY = centerY + height / 2;

  // Create triangle
  const triangle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  triangle.setAttribute(
    "points",
    `${topX},${topY} ${leftX},${leftY} ${rightX},${rightY}`
  );
  triangle.setAttribute("fill", options.fill || "#9c27b0");
  triangle.setAttribute("stroke", options.stroke || "#7b1fa2");
  triangle.setAttribute("stroke-width", options.strokeWidth || "3");

  svg.appendChild(triangle);

  // Add dimension labels if requested
  if (options.showDimensions) {
    // Base label
    const baseText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    baseText.setAttribute("x", centerX);
    baseText.setAttribute("y", leftY + 20);
    baseText.setAttribute("text-anchor", "middle");
    baseText.setAttribute("font-family", "Comic Sans MS, sans-serif");
    baseText.setAttribute("font-size", "14");
    baseText.setAttribute("font-weight", "bold");
    baseText.setAttribute("fill", "#333");
    baseText.textContent = `base = ${base / 20} units`;
    svg.appendChild(baseText);

    // Height line and label
    const heightLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    heightLine.setAttribute("x1", centerX);
    heightLine.setAttribute("y1", topY);
    heightLine.setAttribute("x2", centerX);
    heightLine.setAttribute("y2", leftY);
    heightLine.setAttribute("stroke", "#333");
    heightLine.setAttribute("stroke-width", "2");
    heightLine.setAttribute("stroke-dasharray", "3,3");
    svg.appendChild(heightLine);

    const heightText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    heightText.setAttribute("x", centerX + 15);
    heightText.setAttribute("y", centerY);
    heightText.setAttribute("text-anchor", "middle");
    heightText.setAttribute("font-family", "Comic Sans MS, sans-serif");
    heightText.setAttribute("font-size", "14");
    heightText.setAttribute("font-weight", "bold");
    heightText.setAttribute("fill", "#333");
    heightText.setAttribute(
      "transform",
      `rotate(-90, ${centerX + 15}, ${centerY})`
    );
    heightText.textContent = `h = ${height / 20}`;
    svg.appendChild(heightText);
  }

  container.appendChild(svg);
}

/**
 * Creates an SVG parallelogram
 * @param {string} containerId - The ID of the container element
 * @param {number} base - Base width of the parallelogram
 * @param {number} height - Height of the parallelogram
 * @param {number} skew - Skew amount (default 20)
 * @param {object} options - Styling options
 */
export function createParallelogramSVG(
  containerId,
  base,
  height,
  skew = 20,
  options = {}
) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgWidth = Math.max(base + skew + 40, 200);
  const svgHeight = Math.max(height + 40, 150);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", svgHeight);
  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Parallelogram points
  const topLeftX = centerX - base / 2 + skew / 2;
  const topLeftY = centerY - height / 2;
  const topRightX = centerX + base / 2 + skew / 2;
  const topRightY = centerY - height / 2;
  const bottomRightX = centerX + base / 2 - skew / 2;
  const bottomRightY = centerY + height / 2;
  const bottomLeftX = centerX - base / 2 - skew / 2;
  const bottomLeftY = centerY + height / 2;

  // Create parallelogram
  const parallelogram = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  parallelogram.setAttribute(
    "points",
    `${topLeftX},${topLeftY} ${topRightX},${topRightY} ${bottomRightX},${bottomRightY} ${bottomLeftX},${bottomLeftY}`
  );
  parallelogram.setAttribute("fill", options.fill || "#607d8b");
  parallelogram.setAttribute("stroke", options.stroke || "#455a64");
  parallelogram.setAttribute("stroke-width", options.strokeWidth || "3");

  svg.appendChild(parallelogram);

  container.appendChild(svg);
}

/**
 * Creates an SVG trapezoid
 * @param {string} containerId - The ID of the container element
 * @param {number} topBase - Top base width
 * @param {number} bottomBase - Bottom base width
 * @param {number} height - Height of the trapezoid
 * @param {object} options - Styling options
 */
export function createTrapezoidSVG(
  containerId,
  topBase,
  bottomBase,
  height,
  options = {}
) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const maxBase = Math.max(topBase, bottomBase);
  const svgWidth = Math.max(maxBase + 40, 200);
  const svgHeight = Math.max(height + 40, 150);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", svgHeight);
  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Trapezoid points
  const topLeftX = centerX - topBase / 2;
  const topLeftY = centerY - height / 2;
  const topRightX = centerX + topBase / 2;
  const topRightY = centerY - height / 2;
  const bottomRightX = centerX + bottomBase / 2;
  const bottomRightY = centerY + height / 2;
  const bottomLeftX = centerX - bottomBase / 2;
  const bottomLeftY = centerY + height / 2;

  // Create trapezoid
  const trapezoid = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  trapezoid.setAttribute(
    "points",
    `${topLeftX},${topLeftY} ${topRightX},${topRightY} ${bottomRightX},${bottomRightY} ${bottomLeftX},${bottomLeftY}`
  );
  trapezoid.setAttribute("fill", options.fill || "#ff5722");
  trapezoid.setAttribute("stroke", options.stroke || "#d84315");
  trapezoid.setAttribute("stroke-width", options.strokeWidth || "3");

  svg.appendChild(trapezoid);

  container.appendChild(svg);
}

/**
 * Creates an SVG rhombus (diamond)
 * @param {string} containerId - The ID of the container element
 * @param {number} width - Width of the rhombus
 * @param {number} height - Height of the rhombus
 * @param {object} options - Styling options
 */
export function createRhombusSVG(containerId, width, height, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgWidth = Math.max(width + 40, 200);
  const svgHeight = Math.max(height + 40, 150);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", svgHeight);
  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Rhombus points
  const topX = centerX;
  const topY = centerY - height / 2;
  const rightX = centerX + width / 2;
  const rightY = centerY;
  const bottomX = centerX;
  const bottomY = centerY + height / 2;
  const leftX = centerX - width / 2;
  const leftY = centerY;

  // Create rhombus
  const rhombus = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  rhombus.setAttribute(
    "points",
    `${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`
  );
  rhombus.setAttribute("fill", options.fill || "#8bc34a");
  rhombus.setAttribute("stroke", options.stroke || "#689f38");
  rhombus.setAttribute("stroke-width", options.strokeWidth || "3");

  svg.appendChild(rhombus);

  container.appendChild(svg);
}

/**
 * Creates an SVG pentagon
 * @param {string} containerId - The ID of the container element
 * @param {number} radius - Radius of the pentagon (distance from center to vertex)
 * @param {object} options - Styling options
 */
export function createPentagonSVG(containerId, radius, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgSize = (radius + 40) * 2;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgSize);
  svg.setAttribute("height", svgSize);
  svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  // Pentagon points (5 vertices)
  const points = [];
  for (let i = 0; i < 5; i++) {
    const angle = ((i * 72 - 90) * Math.PI) / 180; // 72 degrees between vertices, start from top
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  // Create pentagon
  const pentagon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  pentagon.setAttribute("points", points.join(" "));
  pentagon.setAttribute("fill", options.fill || "#00bcd4");
  pentagon.setAttribute("stroke", options.stroke || "#0097a7");
  pentagon.setAttribute("stroke-width", options.strokeWidth || "3");

  svg.appendChild(pentagon);

  container.appendChild(svg);
}

/**
 * Creates an SVG hexagon
 * @param {string} containerId - The ID of the container element
 * @param {number} radius - Radius of the hexagon (distance from center to vertex)
 * @param {object} options - Styling options
 */
export function createHexagonSVG(containerId, radius, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgSize = (radius + 40) * 2;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgSize);
  svg.setAttribute("height", svgSize);
  svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  // Hexagon points (6 vertices)
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = ((i * 60 - 90) * Math.PI) / 180; // 60 degrees between vertices, start from top
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  // Create hexagon
  const hexagon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  hexagon.setAttribute("points", points.join(" "));
  hexagon.setAttribute("fill", options.fill || "#795548");
  hexagon.setAttribute("stroke", options.stroke || "#5d4037");
  hexagon.setAttribute("stroke-width", options.strokeWidth || "3");

  svg.appendChild(hexagon);

  container.appendChild(svg);
}

/**
 * Creates an SVG 3D cube representation (isometric view)
 * @param {string} containerId - The ID of the container element
 * @param {number} size - Size of the cube
 * @param {object} options - Styling options
 */
export function createCubeSVG(containerId, size, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgSize = size * 2 + 80;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgSize);
  svg.setAttribute("height", svgSize);
  svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const depth = size * 0.6; // 3D effect depth

  // Front face
  const frontFace = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  frontFace.setAttribute("x", centerX - size / 2);
  frontFace.setAttribute("y", centerY - size / 2);
  frontFace.setAttribute("width", size);
  frontFace.setAttribute("height", size);
  frontFace.setAttribute("fill", options.frontFill || "#2196f3");
  frontFace.setAttribute("stroke", options.stroke || "#1976d2");
  frontFace.setAttribute("stroke-width", options.strokeWidth || "2");

  // Top face (parallelogram)
  const topPoints = [
    `${centerX - size / 2},${centerY - size / 2}`,
    `${centerX + size / 2},${centerY - size / 2}`,
    `${centerX + size / 2 + depth},${centerY - size / 2 - depth}`,
    `${centerX - size / 2 + depth},${centerY - size / 2 - depth}`,
  ];
  const topFace = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  topFace.setAttribute("points", topPoints.join(" "));
  topFace.setAttribute("fill", options.topFill || "#64b5f6");
  topFace.setAttribute("stroke", options.stroke || "#1976d2");
  topFace.setAttribute("stroke-width", options.strokeWidth || "2");

  // Right face (parallelogram)
  const rightPoints = [
    `${centerX + size / 2},${centerY - size / 2}`,
    `${centerX + size / 2 + depth},${centerY - size / 2 - depth}`,
    `${centerX + size / 2 + depth},${centerY + size / 2 - depth}`,
    `${centerX + size / 2},${centerY + size / 2}`,
  ];
  const rightFace = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  rightFace.setAttribute("points", rightPoints.join(" "));
  rightFace.setAttribute("fill", options.rightFill || "#1976d2");
  rightFace.setAttribute("stroke", options.stroke || "#1976d2");
  rightFace.setAttribute("stroke-width", options.strokeWidth || "2");

  svg.appendChild(topFace);
  svg.appendChild(rightFace);
  svg.appendChild(frontFace);

  container.appendChild(svg);
}

/**
 * Creates an animated SVG shape that demonstrates area calculation
 * @param {string} containerId - The ID of the container element
 * @param {number} width - Width in grid units
 * @param {number} height - Height in grid units
 * @param {object} options - Animation and styling options
 */
export function createAnimatedAreaDemo(containerId, width, height, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const unitSize = 25;
  const svgWidth = width * unitSize + 40;
  const svgHeight = height * unitSize + 40;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", svgHeight);
  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

  const startX = 20;
  const startY = 20;

  // Create grid squares with animation
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const square = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      square.setAttribute("x", startX + col * unitSize);
      square.setAttribute("y", startY + row * unitSize);
      square.setAttribute("width", unitSize - 1);
      square.setAttribute("height", unitSize - 1);
      square.setAttribute("fill", options.fill || "#4caf50");
      square.setAttribute("stroke", "#fff");
      square.setAttribute("stroke-width", "1");

      if (options.animate) {
        const delay = (row * width + col) * 0.1;
        square.style.opacity = "0";
        square.style.animation = `fadeIn 0.5s ease-in-out ${delay}s forwards`;

        // Add CSS animation
        const style = document.createElement("style");
        style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; transform: scale(0); }
                        to { opacity: 1; transform: scale(1); }
                    }
                `;
        document.head.appendChild(style);
      }

      // Add number to each square
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", startX + col * unitSize + unitSize / 2);
      text.setAttribute("y", startY + row * unitSize + unitSize / 2 + 4);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-family", "Comic Sans MS, sans-serif");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-weight", "bold");
      text.setAttribute("fill", "#fff");
      text.textContent = row * width + col + 1;

      svg.appendChild(square);
      svg.appendChild(text);
    }
  }

  // Add border
  const border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  border.setAttribute("x", startX);
  border.setAttribute("y", startY);
  border.setAttribute("width", width * unitSize);
  border.setAttribute("height", height * unitSize);
  border.setAttribute("fill", "none");
  border.setAttribute("stroke", "#333");
  border.setAttribute("stroke-width", "3");
  svg.appendChild(border);

  container.appendChild(svg);
}

/**
 * Creates an SVG point
 * @param {string} containerId - The ID of the container element
 * @param {object} options - Styling options
 */
export function createPointSVG(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgSize = 150;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgSize);
  svg.setAttribute("height", svgSize);
  svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  // Create point
  const point = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  point.setAttribute("cx", centerX);
  point.setAttribute("cy", centerY);
  point.setAttribute("r", options.radius || "6");
  point.setAttribute("fill", options.fill || "#333");

  svg.appendChild(point);

  // Add label if requested
  if (options.showLabel) {
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", centerX + 15);
    label.setAttribute("y", centerY - 10);
    label.setAttribute("font-family", "Comic Sans MS, sans-serif");
    label.setAttribute("font-size", "14");
    label.setAttribute("font-weight", "bold");
    label.setAttribute("fill", "#333");
    label.textContent = options.label || "P";
    svg.appendChild(label);
  }

  container.appendChild(svg);
}

/**
 * Creates an SVG line
 * @param {string} containerId - The ID of the container element
 * @param {object} options - Styling options
 */
export function createLineSVG(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgSize = 150;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgSize);
  svg.setAttribute("height", svgSize);
  svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const lineLength = 140;

  // Create line
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", centerX - lineLength / 2);
  line.setAttribute("y1", centerY);
  line.setAttribute("x2", centerX + lineLength / 2);
  line.setAttribute("y2", centerY);
  line.setAttribute("stroke", options.stroke || "#2196f3");
  line.setAttribute("stroke-width", options.strokeWidth || "3");

  svg.appendChild(line);

  // Add arrows at both ends to show infinite extension
  const leftArrow = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  leftArrow.setAttribute(
    "points",
    `${centerX - lineLength / 2},${centerY} ${centerX - lineLength / 2 + 10},${
      centerY - 5
    } ${centerX - lineLength / 2 + 10},${centerY + 5}`
  );
  leftArrow.setAttribute("fill", options.stroke || "#2196f3");
  svg.appendChild(leftArrow);

  const rightArrow = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  rightArrow.setAttribute(
    "points",
    `${centerX + lineLength / 2},${centerY} ${centerX + lineLength / 2 - 10},${
      centerY - 5
    } ${centerX + lineLength / 2 - 10},${centerY + 5}`
  );
  rightArrow.setAttribute("fill", options.stroke || "#2196f3");
  svg.appendChild(rightArrow);

  // Add points on the line if requested
  if (options.showPoints) {
    const point1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    point1.setAttribute("cx", centerX - 30);
    point1.setAttribute("cy", centerY);
    point1.setAttribute("r", "4");
    point1.setAttribute("fill", "#333");
    svg.appendChild(point1);

    const point2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    point2.setAttribute("cx", centerX + 30);
    point2.setAttribute("cy", centerY);
    point2.setAttribute("r", "4");
    point2.setAttribute("fill", "#333");
    svg.appendChild(point2);
  }

  container.appendChild(svg);
}

/**
 * Creates an SVG ray
 * @param {string} containerId - The ID of the container element
 * @param {object} options - Styling options
 */
export function createRaySVG(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgSize = 150;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgSize);
  svg.setAttribute("height", svgSize);
  svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const rayLength = 120;

  // Create ray
  const ray = document.createElementNS("http://www.w3.org/2000/svg", "line");
  ray.setAttribute("x1", centerX - 40);
  ray.setAttribute("y1", centerY);
  ray.setAttribute("x2", centerX + rayLength);
  ray.setAttribute("y2", centerY);
  ray.setAttribute("stroke", options.stroke || "#ff9800");
  ray.setAttribute("stroke-width", options.strokeWidth || "3");

  svg.appendChild(ray);

  // Add starting point
  const startPoint = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  startPoint.setAttribute("cx", centerX - 40);
  startPoint.setAttribute("cy", centerY);
  startPoint.setAttribute("r", "5");
  startPoint.setAttribute("fill", "#333");
  svg.appendChild(startPoint);

  // Add arrow at the end to show infinite extension
  const arrow = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  arrow.setAttribute(
    "points",
    `${centerX + rayLength},${centerY} ${centerX + rayLength - 10},${
      centerY - 5
    } ${centerX + rayLength - 10},${centerY + 5}`
  );
  arrow.setAttribute("fill", options.stroke || "#ff9800");
  svg.appendChild(arrow);

  // Add label if requested
  if (options.showLabel) {
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", centerX - 50);
    label.setAttribute("y", centerY - 10);
    label.setAttribute("font-family", "Comic Sans MS, sans-serif");
    label.setAttribute("font-size", "12");
    label.setAttribute("font-weight", "bold");
    label.setAttribute("fill", "#333");
    label.textContent = options.label || "A";
    svg.appendChild(label);
  }

  container.appendChild(svg);
}

/**
 * Creates an SVG line segment
 * @param {string} containerId - The ID of the container element
 * @param {object} options - Styling options
 */
export function createLineSegmentSVG(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgSize = 150;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgSize);
  svg.setAttribute("height", svgSize);
  svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const lineLength = 100;

  // Create line segment
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", centerX - lineLength / 2);
  line.setAttribute("y1", centerY);
  line.setAttribute("x2", centerX + lineLength / 2);
  line.setAttribute("y2", centerY);
  line.setAttribute("stroke", options.stroke || "#2196f3");
  line.setAttribute("stroke-width", options.strokeWidth || "3");
  svg.appendChild(line);

  // Add endpoints
  const startPoint = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  startPoint.setAttribute("cx", centerX - lineLength / 2);
  startPoint.setAttribute("cy", centerY);
  startPoint.setAttribute("r", "5");
  startPoint.setAttribute("fill", "#333");
  svg.appendChild(startPoint);

  const endPoint = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  endPoint.setAttribute("cx", centerX + lineLength / 2);
  endPoint.setAttribute("cy", centerY);
  endPoint.setAttribute("r", "5");
  endPoint.setAttribute("fill", "#333");
  svg.appendChild(endPoint);

  container.appendChild(svg);
}

/**
 * Creates an SVG angle
 * @param {string} containerId - The ID of the container element
 * @param {number} angle - Angle in degrees
 * @param {object} options - Styling options
 */
export function createAngleSVG(containerId, angle = 45, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgSize = 150;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgSize);
  svg.setAttribute("height", svgSize);
  svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const rayLength = 80;

  // Create vertex point
  const vertex = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  vertex.setAttribute("cx", centerX);
  vertex.setAttribute("cy", centerY);
  vertex.setAttribute("r", "4");
  vertex.setAttribute("fill", "#333");
  svg.appendChild(vertex);

  // Create first ray (horizontal)
  const ray1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  ray1.setAttribute("x1", centerX);
  ray1.setAttribute("y1", centerY);
  ray1.setAttribute("x2", centerX + rayLength);
  ray1.setAttribute("y2", centerY);
  ray1.setAttribute("stroke", options.stroke || "#9c27b0");
  ray1.setAttribute("stroke-width", options.strokeWidth || "3");
  svg.appendChild(ray1);

  // Create second ray at specified angle
  const angleRad = (angle * Math.PI) / 180;
  const ray2X = centerX + rayLength * Math.cos(angleRad);
  const ray2Y = centerY - rayLength * Math.sin(angleRad); // Negative because SVG Y increases downward

  const ray2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  ray2.setAttribute("x1", centerX);
  ray2.setAttribute("y1", centerY);
  ray2.setAttribute("x2", ray2X);
  ray2.setAttribute("y2", ray2Y);
  ray2.setAttribute("stroke", options.stroke || "#9c27b0");
  ray2.setAttribute("stroke-width", options.strokeWidth || "3");
  svg.appendChild(ray2);

  // Create angle arc
  const arcRadius = 30;
  const arcEndX = centerX + arcRadius * Math.cos(angleRad);
  const arcEndY = centerY - arcRadius * Math.sin(angleRad);

  const arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const largeArcFlag = angle > 180 ? 1 : 0;
  const pathData = `M ${
    centerX + arcRadius
  } ${centerY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 0 ${arcEndX} ${arcEndY}`;
  arc.setAttribute("d", pathData);
  arc.setAttribute("fill", "none");
  arc.setAttribute("stroke", options.arcStroke || "#e91e63");
  arc.setAttribute("stroke-width", "2");
  svg.appendChild(arc);

  // Add angle label if requested
  if (options.showLabel) {
    const labelRadius = arcRadius + 15;
    const labelAngle = angle / 2;
    const labelAngleRad = (labelAngle * Math.PI) / 180;
    const labelX = centerX + labelRadius * Math.cos(labelAngleRad);
    const labelY = centerY - labelRadius * Math.sin(labelAngleRad);

    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", labelX);
    label.setAttribute("y", labelY + 4);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-family", "Comic Sans MS, sans-serif");
    label.setAttribute("font-size", "12");
    label.setAttribute("font-weight", "bold");
    label.setAttribute("fill", "#333");
    label.textContent = `${angle}°`;
    svg.appendChild(label);
  }

  container.appendChild(svg);
}

/**
 * Creates an SVG triangle with classification features
 * @param {string} containerId - The ID of the container element
 * @param {string} type - Triangle type: 'equilateral', 'isosceles', 'scalene', 'right', 'acute', 'obtuse'
 * @param {object} options - Styling options
 */
export function createClassifiedTriangleSVG(
  containerId,
  type = "equilateral",
  options = {}
) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgSize = 180;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgSize);
  svg.setAttribute("height", svgSize);
  svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  let points = "";

  switch (type) {
    case "equilateral":
      // Equilateral triangle
      const size = 60;
      const height = (size * Math.sqrt(3)) / 2;
      points = `${centerX},${centerY - (height * 2) / 3} ${
        centerX - size / 2
      },${centerY + height / 3} ${centerX + size / 2},${centerY + height / 3}`;
      break;
    case "isosceles":
      // Isosceles triangle
      points = `${centerX},${centerY - 50} ${centerX - 40},${centerY + 30} ${
        centerX + 40
      },${centerY + 30}`;
      break;
    case "scalene":
      // Scalene triangle (all sides different)
      points = `${centerX - 10},${centerY - 40} ${centerX - 50},${
        centerY + 30
      } ${centerX + 45},${centerY + 25}`;
      break;
    case "right":
      // Right triangle
      points = `${centerX - 40},${centerY - 40} ${centerX - 40},${
        centerY + 30
      } ${centerX + 30},${centerY + 30}`;
      break;
    case "acute":
      // Acute triangle (all angles < 90°)
      points = `${centerX},${centerY - 35} ${centerX - 35},${centerY + 25} ${
        centerX + 35
      },${centerY + 25}`;
      break;
    case "obtuse":
      // Obtuse triangle (one angle > 90°)
      points = `${centerX - 10},${centerY - 20} ${centerX - 55},${
        centerY + 35
      } ${centerX + 45},${centerY + 35}`;
      break;
    default:
      points = `${centerX},${centerY - 40} ${centerX - 35},${centerY + 25} ${
        centerX + 35
      },${centerY + 25}`;
  }

  // Create triangle
  const triangle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  triangle.setAttribute("points", points);
  triangle.setAttribute("fill", options.fill || "#9c27b0");
  triangle.setAttribute("stroke", options.stroke || "#7b1fa2");
  triangle.setAttribute("stroke-width", options.strokeWidth || "3");

  svg.appendChild(triangle);

  // Add right angle marker for right triangles
  if (type === "right") {
    const rightAngleMarker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    rightAngleMarker.setAttribute(
      "d",
      `M ${centerX - 40} ${centerY + 20} L ${centerX - 30} ${centerY + 20} L ${
        centerX - 30
      } ${centerY + 30}`
    );
    rightAngleMarker.setAttribute("fill", "none");
    rightAngleMarker.setAttribute("stroke", "#ff0000");
    rightAngleMarker.setAttribute("stroke-width", "2");
    svg.appendChild(rightAngleMarker);
  }

  // Add equal side markers for equilateral and isosceles
  if (type === "equilateral" || type === "isosceles") {
    // Add tick marks to show equal sides
    // This is a simplified representation - in a full implementation you'd calculate the actual midpoints
    if (type === "equilateral") {
      // Add three tick marks for three equal sides
      for (let i = 0; i < 3; i++) {
        const tick = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        // Simplified positioning for demonstration
        svg.appendChild(tick);
      }
    }
  }

  container.appendChild(svg);
}

/**
 * Creates symmetry line demonstration for shapes
 * @param {string} containerId - The ID of the container element
 * @param {string} shapeType - Type of shape: 'square', 'circle', 'butterfly', 'triangle'
 * @param {object} options - Styling options
 */
export function createSymmetryDemoSVG(
  containerId,
  shapeType = "square",
  options = {}
) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const svgSize = 180;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgSize);
  svg.setAttribute("height", svgSize);
  svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  // Create the shape first
  switch (shapeType) {
    case "square":
      const square = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      square.setAttribute("x", centerX - 40);
      square.setAttribute("y", centerY - 40);
      square.setAttribute("width", 80);
      square.setAttribute("height", 80);
      square.setAttribute("fill", options.fill || "#ff9800");
      square.setAttribute("stroke", options.stroke || "#f57c00");
      square.setAttribute("stroke-width", "2");
      svg.appendChild(square);

      // Add symmetry lines for square (4 lines)
      const lines = [
        `M ${centerX} ${centerY - 50} L ${centerX} ${centerY + 50}`, // Vertical
        `M ${centerX - 50} ${centerY} L ${centerX + 50} ${centerY}`, // Horizontal
        `M ${centerX - 45} ${centerY - 45} L ${centerX + 45} ${centerY + 45}`, // Diagonal 1
        `M ${centerX - 45} ${centerY + 45} L ${centerX + 45} ${centerY - 45}`, // Diagonal 2
      ];

      lines.forEach((pathData) => {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        line.setAttribute("d", pathData);
        line.setAttribute("stroke", "#e91e63");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(line);
      });
      break;

    case "circle":
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("cx", centerX);
      circle.setAttribute("cy", centerY);
      circle.setAttribute("r", 45);
      circle.setAttribute("fill", options.fill || "#4caf50");
      circle.setAttribute("stroke", options.stroke || "#388e3c");
      circle.setAttribute("stroke-width", "2");
      svg.appendChild(circle);

      // Add a few symmetry lines for circle (representing infinite lines)
      for (let i = 0; i < 6; i++) {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = centerX - 50 * Math.cos(angle);
        const y1 = centerY - 50 * Math.sin(angle);
        const x2 = centerX + 50 * Math.cos(angle);
        const y2 = centerY + 50 * Math.sin(angle);

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", "#e91e63");
        line.setAttribute("stroke-width", "1");
        line.setAttribute("stroke-dasharray", "3,3");
        svg.appendChild(line);
      }
      break;

    case "butterfly":
      // Simple butterfly shape using paths
      const butterfly = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      butterfly.setAttribute(
        "d",
        `M ${centerX} ${centerY - 30} Q ${centerX - 25} ${centerY - 10} ${
          centerX - 15
        } ${centerY + 10} Q ${centerX - 30} ${centerY + 20} ${centerX} ${
          centerY + 30
        } Q ${centerX + 30} ${centerY + 20} ${centerX + 15} ${centerY + 10} Q ${
          centerX + 25
        } ${centerY - 10} ${centerX} ${centerY - 30}`
      );
      butterfly.setAttribute("fill", options.fill || "#9c27b0");
      butterfly.setAttribute("stroke", options.stroke || "#7b1fa2");
      butterfly.setAttribute("stroke-width", "2");
      svg.appendChild(butterfly);

      // Add vertical symmetry line
      const butterflyLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      butterflyLine.setAttribute("x1", centerX);
      butterflyLine.setAttribute("y1", centerY - 40);
      butterflyLine.setAttribute("x2", centerX);
      butterflyLine.setAttribute("y2", centerY + 40);
      butterflyLine.setAttribute("stroke", "#e91e63");
      butterflyLine.setAttribute("stroke-width", "2");
      butterflyLine.setAttribute("stroke-dasharray", "5,5");
      svg.appendChild(butterflyLine);
      break;
    default:
      // Default case - no shape created
      break;
  }

  container.appendChild(svg);
}

/**
 * Creates an SVG quadrilateral with classification features and property annotations
 * @param {string} containerId - The ID of the container element
 * @param {string} type - Quadrilateral type: 'square', 'rectangle', 'rhombus', 'parallelogram', 'trapezoid', 'quadrilateral'
 * @param {object} options - Styling options
 */
export function createClassifiedQuadrilateralSVG(containerId, type = 'square', options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const svgSize = 180;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgSize);
    svg.setAttribute('height', svgSize);
    svg.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`);
    
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;
    
    let points = '';
    let shape = null;
    
    switch (type) {
        case 'square':
            // Square - all sides equal, all angles 90°
            const squareSize = 70;
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', centerX - squareSize / 2);
            shape.setAttribute('y', centerY - squareSize / 2);
            shape.setAttribute('width', squareSize);
            shape.setAttribute('height', squareSize);
            shape.setAttribute('fill', options.fill || '#ff9800');
            shape.setAttribute('stroke', options.stroke || '#f57c00');
            shape.setAttribute('stroke-width', options.strokeWidth || '3');
            svg.appendChild(shape);
            
            // Add right angle markers for square
            if (options.showProperties) {
                const corners = [
                    {x: centerX - squareSize / 2, y: centerY - squareSize / 2}, // top-left
                    {x: centerX + squareSize / 2, y: centerY - squareSize / 2}, // top-right
                    {x: centerX + squareSize / 2, y: centerY + squareSize / 2}, // bottom-right
                    {x: centerX - squareSize / 2, y: centerY + squareSize / 2}  // bottom-left
                ];
                
                corners.forEach(corner => {
                    const rightAngle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const size = 8;
                    let d = '';
                    
                    if (corner.x < centerX && corner.y < centerY) { // top-left
                        d = `M ${corner.x} ${corner.y + size} L ${corner.x + size} ${corner.y + size} L ${corner.x + size} ${corner.y}`;
                    } else if (corner.x > centerX && corner.y < centerY) { // top-right
                        d = `M ${corner.x - size} ${corner.y} L ${corner.x - size} ${corner.y + size} L ${corner.x} ${corner.y + size}`;
                    } else if (corner.x > centerX && corner.y > centerY) { // bottom-right
                        d = `M ${corner.x} ${corner.y - size} L ${corner.x - size} ${corner.y - size} L ${corner.x - size} ${corner.y}`;
                    } else { // bottom-left
                        d = `M ${corner.x + size} ${corner.y} L ${corner.x + size} ${corner.y - size} L ${corner.x} ${corner.y - size}`;
                    }
                    
                    rightAngle.setAttribute('d', d);
                    rightAngle.setAttribute('fill', 'none');
                    rightAngle.setAttribute('stroke', '#e91e63');
                    rightAngle.setAttribute('stroke-width', '2');
                    svg.appendChild(rightAngle);
                });
                
                // Add equal side markers
                addEqualSideMarkers(svg, [
                    {x1: centerX - squareSize / 2, y1: centerY - squareSize / 2, x2: centerX + squareSize / 2, y2: centerY - squareSize / 2}, // top
                    {x1: centerX + squareSize / 2, y1: centerY - squareSize / 2, x2: centerX + squareSize / 2, y2: centerY + squareSize / 2}, // right
                    {x1: centerX + squareSize / 2, y1: centerY + squareSize / 2, x2: centerX - squareSize / 2, y2: centerY + squareSize / 2}, // bottom
                    {x1: centerX - squareSize / 2, y1: centerY + squareSize / 2, x2: centerX - squareSize / 2, y2: centerY - squareSize / 2}  // left
                ], 1); // All sides equal
            }
            break;
            
        case 'rectangle':
            // Rectangle - opposite sides equal, all angles 90°
            const rectWidth = 90;
            const rectHeight = 60;
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', centerX - rectWidth / 2);
            shape.setAttribute('y', centerY - rectHeight / 2);
            shape.setAttribute('width', rectWidth);
            shape.setAttribute('height', rectHeight);
            shape.setAttribute('fill', options.fill || '#4ecdc4');
            shape.setAttribute('stroke', options.stroke || '#26a69a');
            shape.setAttribute('stroke-width', options.strokeWidth || '3');
            svg.appendChild(shape);
            
            if (options.showProperties) {
                // Add right angle markers at corners
                const corners = [
                    {x: centerX - rectWidth / 2, y: centerY - rectHeight / 2},
                    {x: centerX + rectWidth / 2, y: centerY - rectHeight / 2},
                    {x: centerX + rectWidth / 2, y: centerY + rectHeight / 2},
                    {x: centerX - rectWidth / 2, y: centerY + rectHeight / 2}
                ];
                
                corners.forEach(corner => {
                    const rightAngle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const size = 6;
                    let d = '';
                    
                    if (corner.x < centerX && corner.y < centerY) {
                        d = `M ${corner.x} ${corner.y + size} L ${corner.x + size} ${corner.y + size} L ${corner.x + size} ${corner.y}`;
                    } else if (corner.x > centerX && corner.y < centerY) {
                        d = `M ${corner.x - size} ${corner.y} L ${corner.x - size} ${corner.y + size} L ${corner.x} ${corner.y + size}`;
                    } else if (corner.x > centerX && corner.y > centerY) {
                        d = `M ${corner.x} ${corner.y - size} L ${corner.x - size} ${corner.y - size} L ${corner.x - size} ${corner.y}`;
                    } else {
                        d = `M ${corner.x + size} ${corner.y} L ${corner.x + size} ${corner.y - size} L ${corner.x} ${corner.y - size}`;
                    }
                    
                    rightAngle.setAttribute('d', d);
                    rightAngle.setAttribute('fill', 'none');
                    rightAngle.setAttribute('stroke', '#e91e63');
                    rightAngle.setAttribute('stroke-width', '1.5');
                    svg.appendChild(rightAngle);
                });
                
                // Add equal side markers for opposite sides
                addEqualSideMarkers(svg, [
                    {x1: centerX - rectWidth / 2, y1: centerY - rectHeight / 2, x2: centerX + rectWidth / 2, y2: centerY - rectHeight / 2}, // top
                    {x1: centerX + rectWidth / 2, y1: centerY + rectHeight / 2, x2: centerX - rectWidth / 2, y2: centerY + rectHeight / 2}  // bottom
                ], 1);
                
                addEqualSideMarkers(svg, [
                    {x1: centerX + rectWidth / 2, y1: centerY - rectHeight / 2, x2: centerX + rectWidth / 2, y2: centerY + rectHeight / 2}, // right
                    {x1: centerX - rectWidth / 2, y1: centerY + rectHeight / 2, x2: centerX - rectWidth / 2, y2: centerY - rectHeight / 2}  // left
                ], 2);
            }
            break;
            
        case 'rhombus':
            // Rhombus - all sides equal, opposite angles equal
            const rhombusWidth = 80;
            const rhombusHeight = 100;
            points = `${centerX},${centerY - rhombusHeight / 2} ${centerX + rhombusWidth / 2},${centerY} ${centerX},${centerY + rhombusHeight / 2} ${centerX - rhombusWidth / 2},${centerY}`;
            
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            shape.setAttribute('points', points);
            shape.setAttribute('fill', options.fill || '#8bc34a');
            shape.setAttribute('stroke', options.stroke || '#689f38');
            shape.setAttribute('stroke-width', options.strokeWidth || '3');
            svg.appendChild(shape);
            
            if (options.showProperties) {
                // Add equal side markers for all sides
                addEqualSideMarkers(svg, [
                    {x1: centerX, y1: centerY - rhombusHeight / 2, x2: centerX + rhombusWidth / 2, y2: centerY}, // top-right
                    {x1: centerX + rhombusWidth / 2, y1: centerY, x2: centerX, y2: centerY + rhombusHeight / 2}, // bottom-right
                    {x1: centerX, y1: centerY + rhombusHeight / 2, x2: centerX - rhombusWidth / 2, y2: centerY}, // bottom-left
                    {x1: centerX - rhombusWidth / 2, y1: centerY, x2: centerX, y2: centerY - rhombusHeight / 2}  // top-left
                ], 1);
            }
            break;
            
        case 'parallelogram':
            // Parallelogram - opposite sides equal and parallel
            const paraWidth = 90;
            const paraHeight = 60;
            const skew = 25;
            points = `${centerX - paraWidth / 2 + skew / 2},${centerY - paraHeight / 2} ${centerX + paraWidth / 2 + skew / 2},${centerY - paraHeight / 2} ${centerX + paraWidth / 2 - skew / 2},${centerY + paraHeight / 2} ${centerX - paraWidth / 2 - skew / 2},${centerY + paraHeight / 2}`;
            
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            shape.setAttribute('points', points);
            shape.setAttribute('fill', options.fill || '#607d8b');
            shape.setAttribute('stroke', options.stroke || '#455a64');
            shape.setAttribute('stroke-width', options.strokeWidth || '3');
            svg.appendChild(shape);
            
            if (options.showProperties) {
                // Add equal side markers for opposite sides
                addEqualSideMarkers(svg, [
                    {x1: centerX - paraWidth / 2 + skew / 2, y1: centerY - paraHeight / 2, x2: centerX + paraWidth / 2 + skew / 2, y2: centerY - paraHeight / 2}, // top
                    {x1: centerX + paraWidth / 2 - skew / 2, y1: centerY + paraHeight / 2, x2: centerX - paraWidth / 2 - skew / 2, y2: centerY + paraHeight / 2}  // bottom
                ], 1);
                
                addEqualSideMarkers(svg, [
                    {x1: centerX + paraWidth / 2 + skew / 2, y1: centerY - paraHeight / 2, x2: centerX + paraWidth / 2 - skew / 2, y2: centerY + paraHeight / 2}, // right
                    {x1: centerX - paraWidth / 2 - skew / 2, y1: centerY + paraHeight / 2, x2: centerX - paraWidth / 2 + skew / 2, y2: centerY - paraHeight / 2}  // left
                ], 2);
                
                // Add parallel markers
                addParallelMarkers(svg, [
                    {x1: centerX - paraWidth / 2 + skew / 2, y1: centerY - paraHeight / 2, x2: centerX + paraWidth / 2 + skew / 2, y2: centerY - paraHeight / 2},
                    {x1: centerX - paraWidth / 2 - skew / 2, y1: centerY + paraHeight / 2, x2: centerX + paraWidth / 2 - skew / 2, y2: centerY + paraHeight / 2}
                ]);
            }
            break;
            
        case 'trapezoid':
            // Trapezoid - exactly one pair of parallel sides
            const topBase = 60;
            const bottomBase = 100;
            const trapHeight = 70;
            points = `${centerX - topBase / 2},${centerY - trapHeight / 2} ${centerX + topBase / 2},${centerY - trapHeight / 2} ${centerX + bottomBase / 2},${centerY + trapHeight / 2} ${centerX - bottomBase / 2},${centerY + trapHeight / 2}`;
            
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            shape.setAttribute('points', points);
            shape.setAttribute('fill', options.fill || '#ff5722');
            shape.setAttribute('stroke', options.stroke || '#d84315');
            shape.setAttribute('stroke-width', options.strokeWidth || '3');
            svg.appendChild(shape);
            
            if (options.showProperties) {
                // Add parallel markers only for the parallel sides (top and bottom)
                addParallelMarkers(svg, [
                    {x1: centerX - topBase / 2, y1: centerY - trapHeight / 2, x2: centerX + topBase / 2, y2: centerY - trapHeight / 2},
                    {x1: centerX - bottomBase / 2, y1: centerY + trapHeight / 2, x2: centerX + bottomBase / 2, y2: centerY + trapHeight / 2}
                ]);
            }
            break;
            
        case 'quadrilateral':
        default:
            // General quadrilateral - any four-sided shape
            points = `${centerX - 40},${centerY - 35} ${centerX + 50},${centerY - 25} ${centerX + 35},${centerY + 40} ${centerX - 45},${centerY + 30}`;
            
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            shape.setAttribute('points', points);
            shape.setAttribute('fill', options.fill || '#9c27b0');
            shape.setAttribute('stroke', options.stroke || '#7b1fa2');
            shape.setAttribute('stroke-width', options.strokeWidth || '3');
            svg.appendChild(shape);
            break;
    }
    
    container.appendChild(svg);
}

/**
 * Helper function to add equal side markers to indicate equal lengths
 * @param {SVGElement} svg - The SVG element
 * @param {Array} sides - Array of side objects with x1, y1, x2, y2 coordinates
 * @param {number} markType - Type of mark (1 for single tick, 2 for double tick, etc.)
 */
function addEqualSideMarkers(svg, sides, markType = 1) {
    sides.forEach(side => {
        const midX = (side.x1 + side.x2) / 2;
        const midY = (side.y1 + side.y2) / 2;
        const angle = Math.atan2(side.y2 - side.y1, side.x2 - side.x1);
        const perpAngle = angle + Math.PI / 2;
        const markLength = 6;
        const markSpacing = 3;
        
        for (let i = 0; i < markType; i++) {
            const offset = (i - (markType - 1) / 2) * markSpacing;
            const startX = midX + offset * Math.cos(angle) - markLength / 2 * Math.cos(perpAngle);
            const startY = midY + offset * Math.sin(angle) - markLength / 2 * Math.sin(perpAngle);
            const endX = midX + offset * Math.cos(angle) + markLength / 2 * Math.cos(perpAngle);
            const endY = midY + offset * Math.sin(angle) + markLength / 2 * Math.sin(perpAngle);
            
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', startX);
            tick.setAttribute('y1', startY);
            tick.setAttribute('x2', endX);
            tick.setAttribute('y2', endY);
            tick.setAttribute('stroke', '#333');
            tick.setAttribute('stroke-width', '2');
            svg.appendChild(tick);
        }
    });
}

/**
 * Helper function to add parallel markers to indicate parallel sides
 * @param {SVGElement} svg - The SVG element
 * @param {Array} sides - Array of parallel side pairs
 */
function addParallelMarkers(svg, sides) {
    sides.forEach((side, index) => {
        const midX = (side.x1 + side.x2) / 2;
        const midY = (side.y1 + side.y2) / 2;
        const angle = Math.atan2(side.y2 - side.y1, side.x2 - side.x1);
        const perpAngle = angle + Math.PI / 2;
        const arrowSize = 8;
        
        // Create small arrow markers to indicate parallel lines
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const arrowPoints = [
            midX - arrowSize / 2 * Math.cos(perpAngle),
            midY - arrowSize / 2 * Math.sin(perpAngle),
            midX + arrowSize / 2 * Math.cos(perpAngle),
            midY + arrowSize / 2 * Math.sin(perpAngle),
            midX + arrowSize / 4 * Math.cos(angle),
            midY + arrowSize / 4 * Math.sin(angle)
        ].join(',');
        
        arrow.setAttribute('points', arrowPoints);
        arrow.setAttribute('fill', '#2196f3');
        arrow.setAttribute('stroke', '#1976d2');
        arrow.setAttribute('stroke-width', '1');
        svg.appendChild(arrow);
    });
}

// Default export with all shape functions
const geometricShapes = {
  createRectangleSVG,
  createSquareSVG,
  createCircleSVG,
  createTriangleSVG,
  createParallelogramSVG,
  createTrapezoidSVG,
  createRhombusSVG,
  createPentagonSVG,
  createHexagonSVG,
  createCubeSVG,
  createAnimatedAreaDemo,
  createPointSVG,
  createLineSVG,
  createLineSegmentSVG,
  createRaySVG,
  createAngleSVG,
  createClassifiedTriangleSVG,
  createSymmetryDemoSVG,
  createClassifiedQuadrilateralSVG,
};

export default geometricShapes;
