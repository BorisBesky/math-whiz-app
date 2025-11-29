import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Pen, RotateCcw, Trash2 } from 'lucide-react';

/**
 * DrawingCanvas Component
 * 
 * An embedded canvas component for interactive drawing questions.
 * Students can draw shapes/diagrams as answers to geometry questions.
 * 
 * Features:
 * - Drawing with pen tool
 * - Eraser tool
 * - Undo functionality
 * - Clear canvas
 * - Export to base64 image
 */
const DrawingCanvas = ({ onChange, width = 600, height = 400, className = '', backgroundImage = null }) => {
  const canvasRef = useRef(null);
  const currentStrokeRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('draw'); // 'draw' or 'erase'
  const [strokes, setStrokes] = useState([]);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(-1);
  const [context, setContext] = useState(null);
  const [bgImageObj, setBgImageObj] = useState(null);

  // Keep the onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Load background image
  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Enable CORS if needed
      img.src = backgroundImage;
      img.onload = () => setBgImageObj(img);
      img.onerror = (e) => console.error("Failed to load background image", e);
    } else {
      setBgImageObj(null);
    }
  }, [backgroundImage]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    
    // Set white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    setContext(ctx);
  }, [width, height]);

  // Redraw canvas whenever strokes change or background image changes
  useEffect(() => {
    if (!context) return;
    
    // Create an offscreen canvas for strokes to handle eraser properly
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const offCtx = offscreenCanvas.getContext('2d');

    // Draw all strokes up to currentStrokeIndex on offscreen canvas
    const strokesToDraw = currentStrokeIndex >= 0 
      ? strokes.slice(0, currentStrokeIndex + 1)
      : [];

    strokesToDraw.forEach(stroke => {
      offCtx.strokeStyle = stroke.color;
      offCtx.lineWidth = stroke.width;
      offCtx.lineCap = 'round';
      offCtx.lineJoin = 'round';
      offCtx.globalCompositeOperation = stroke.mode === 'erase' ? 'destination-out' : 'source-over';

      offCtx.beginPath();
      stroke.points.forEach((point, index) => {
        if (index === 0) {
          offCtx.moveTo(point.x, point.y);
        } else {
          offCtx.lineTo(point.x, point.y);
        }
      });
      offCtx.stroke();
    });

    // Clear main canvas
    context.clearRect(0, 0, width, height);
    
    // Draw background (white or image)
    if (bgImageObj) {
      // Draw image to fit canvas while maintaining aspect ratio
      const scale = Math.min(width / bgImageObj.width, height / bgImageObj.height);
      const x = (width / 2) - (bgImageObj.width / 2) * scale;
      const y = (height / 2) - (bgImageObj.height / 2) * scale;
      
      // Fill white first
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, width, height);
      
      context.drawImage(bgImageObj, x, y, bgImageObj.width * scale, bgImageObj.height * scale);
    } else {
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, width, height);
    }

    // Draw strokes from offscreen canvas
    context.globalCompositeOperation = 'source-over';
    context.drawImage(offscreenCanvas, 0, 0);

    // Notify parent of changes with base64 image
    if (onChangeRef.current) {
      const imageData = canvasRef.current.toDataURL('image/png');
      onChangeRef.current(imageData);
    }
  }, [strokes, currentStrokeIndex, context, width, height, bgImageObj]);

  // Get coordinates from mouse or touch event
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Start drawing
  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    currentStrokeRef.current = {
      points: [coords],
      color: currentTool === 'draw' ? '#000000' : '#FFFFFF',
      width: currentTool === 'draw' ? 3 : 20,
      mode: currentTool
    };
  };

  // Draw
  const draw = (e) => {
    if (!isDrawing || !context || !currentStrokeRef.current) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    const currentStroke = currentStrokeRef.current;
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    currentStroke.points.push(coords);

    // Draw the current segment
    context.strokeStyle = currentStroke.color;
    context.lineWidth = currentStroke.width;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.globalCompositeOperation = currentStroke.mode === 'erase' ? 'destination-out' : 'source-over';

    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(coords.x, coords.y);
    context.stroke();
  };

  // Stop drawing
  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    setIsDrawing(false);

    // Commit the stroke from ref to state
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      const base = strokes.slice(0, currentStrokeIndex + 1);
      const newStrokes = [...base, currentStrokeRef.current];
      
      setStrokes(newStrokes);
      setCurrentStrokeIndex(newStrokes.length - 1);
    }

    currentStrokeRef.current = null;
  };

  // Undo last stroke
  const handleUndo = () => {
    if (currentStrokeIndex >= 0) {
      setCurrentStrokeIndex(currentStrokeIndex - 1);
    }
  };

  // Clear canvas
  const handleClear = () => {
    setStrokes([]);
    setCurrentStrokeIndex(-1);
    currentStrokeRef.current = null;
    if (context) {
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, width, height);
    }
    if (onChangeRef.current) {
      onChangeRef.current(null);
    }
  };

  return (
    <div className={`drawing-canvas-container ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded-lg cursor-crosshair bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ 
          touchAction: 'none',
          display: 'block',
          margin: '0 auto'
        }}
      />
      
      {/* Drawing Controls */}
      <div className="flex justify-center items-center space-x-3 mt-4">
        <button
          onClick={() => setCurrentTool('draw')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            currentTool === 'draw'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title="Pen Tool"
        >
          <Pen className="h-4 w-4" />
          <span className="text-sm font-medium">Pen</span>
        </button>
        
        <button
          onClick={() => setCurrentTool('erase')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            currentTool === 'erase'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title="Eraser Tool"
        >
          <Eraser className="h-4 w-4" />
          <span className="text-sm font-medium">Eraser</span>
        </button>
        
        <button
          onClick={handleUndo}
          disabled={currentStrokeIndex < 0}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Undo"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="text-sm font-medium">Undo</span>
        </button>
        
        <button
          onClick={handleClear}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
          title="Clear Canvas"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-sm font-medium">Clear</span>
        </button>
      </div>
    </div>
  );
};

export default DrawingCanvas;
