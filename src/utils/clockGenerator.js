/**
 * Clock SVG Generator Utility
 * Generates analog clock SVGs for educational purposes
 */

/**
 * Generates an SVG analog clock based on the given time
 * @param {number} hours - Hour value (1-12 for 12-hour format)
 * @param {number} minutes - Minute value (0-59)
 * @param {Object} options - Optional configuration
 * @param {number} options.size - Clock size in pixels (default: 200)
 * @param {boolean} options.showNumbers - Whether to show hour numbers (default: true)
 * @param {string} options.faceColor - Clock face color (default: '#ffffff')
 * @param {string} options.borderColor - Clock border color (default: '#333333')
 * @param {string} options.hourHandColor - Hour hand color (default: '#000000')
 * @param {string} options.minuteHandColor - Minute hand color (default: '#000000')
 * @param {string} options.centerColor - Center circle color (default: '#000000')
 * @returns {string} SVG as data URI string
 */
export function generateClockSVG(hours, minutes, options = {}) {
  const {
    size = 200,
    showNumbers = true,
    faceColor = '#ffffff',
    borderColor = '#333333',
    hourHandColor = '#000000',
    minuteHandColor = '#000000',
    centerColor = '#000000'
  } = options;

  const center = size / 2;
  const radius = size / 2 - 10; // Leave some padding
  const hourHandLength = radius * 0.5;
  const minuteHandLength = radius * 0.75;
  const centerRadius = 6;
  const markerLength = radius * 0.1;

  // Calculate hand angles
  // Minute hand: 0 degrees at 12 o'clock, increases clockwise
  const minuteAngle = (minutes / 60) * 360 - 90; // -90 to start at 12 o'clock
  // Hour hand: also accounts for minutes (e.g., 3:30 means hour hand is halfway between 3 and 4)
  const hourAngle = ((hours % 12) / 12) * 360 + (minutes / 60) * 30 - 90;

  // Convert degrees to radians
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  // Calculate hand endpoints
  const hourHandX = center + hourHandLength * Math.cos(toRadians(hourAngle));
  const hourHandY = center + hourHandLength * Math.sin(toRadians(hourAngle));
  const minuteHandX = center + minuteHandLength * Math.cos(toRadians(minuteAngle));
  const minuteHandY = center + minuteHandLength * Math.sin(toRadians(minuteAngle));

  // Build SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  
  // Clock face circle
  svg += `<circle cx="${center}" cy="${center}" r="${radius}" fill="${faceColor}" stroke="${borderColor}" stroke-width="3"/>`;
  
  // Hour markers (12 positions)
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) - 90; // -90 to start at 12 o'clock
    const rad = toRadians(angle);
    const x1 = center + (radius - markerLength) * Math.cos(rad);
    const y1 = center + (radius - markerLength) * Math.sin(rad);
    const x2 = center + radius * Math.cos(rad);
    const y2 = center + radius * Math.sin(rad);
    
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${borderColor}" stroke-width="2"/>`;
    
    // Hour numbers
    if (showNumbers) {
      const hourNumber = i === 0 ? 12 : i;
      const numberRadius = radius - markerLength - 15;
      const numberX = center + numberRadius * Math.cos(rad);
      const numberY = center + numberRadius * Math.sin(rad);
      svg += `<text x="${numberX}" y="${numberY}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold" fill="${borderColor}">${hourNumber}</text>`;
    }
  }
  
  // Minute hand (longer, thinner)
  svg += `<line x1="${center}" y1="${center}" x2="${minuteHandX}" y2="${minuteHandY}" stroke="${minuteHandColor}" stroke-width="2" stroke-linecap="round"/>`;
  
  // Hour hand (shorter, thicker)
  svg += `<line x1="${center}" y1="${center}" x2="${hourHandX}" y2="${hourHandY}" stroke="${hourHandColor}" stroke-width="3" stroke-linecap="round"/>`;
  
  // Center circle
  svg += `<circle cx="${center}" cy="${center}" r="${centerRadius}" fill="${centerColor}"/>`;
  
  svg += `</svg>`;

  // Convert to base64 data URI (modern, safe for Unicode)
  const base64 = btoa(encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Formats time in 12-hour format with AM/PM
 * @param {number} hours - Hour value (0-23 for 24-hour format or 1-12 for 12-hour)
 * @param {number} minutes - Minute value (0-59)
 * @param {boolean} is24Hour - Whether input hours are in 24-hour format (default: false)
 * @param {string} period - Optional AM/PM override when using 12-hour format input
 * @returns {string} Formatted time string (e.g., "3:45 PM")
 */
export function formatTime12Hour(hours, minutes, is24Hour = false, period = null) {
  let displayHours = hours;
  let displayPeriod;

  if (is24Hour) {
    if (hours === 0) {
      displayHours = 12;
      displayPeriod = 'AM';
    } else if (hours === 12) {
      displayHours = 12;
      displayPeriod = 'PM';
    } else if (hours > 12) {
      displayHours = hours - 12;
      displayPeriod = 'PM';
    } else {
      displayHours = hours;
      displayPeriod = 'AM';
    }
  } else {
    // Assume 12-hour format input (1-12)
    // If period is provided, use it; otherwise default based on hour
    if (period === null) {
      if (hours === 12) {
        displayPeriod = 'PM';
      } else if (hours === 0) {
        displayHours = 12;
        displayPeriod = 'AM';
      } else {
        // Default to AM for 1-11, but this should be specified
        displayPeriod = 'AM';
      }
    } else {
      displayPeriod = period;
    }
  }

  // Format minutes with leading zero if needed
  const formattedMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${formattedMinutes} ${displayPeriod}`;
}
