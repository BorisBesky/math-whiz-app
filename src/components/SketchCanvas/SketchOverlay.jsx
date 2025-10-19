import React, { useRef, useState, useEffect, useCallback } from 'react';
import SketchControls from './SketchControls';
import './SketchCanvas.css';

const SketchOverlay = ({ isVisible, onClose }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('draw'); // 'draw' or 'erase'
  const [strokes, setStrokes] = useState([]); // Array of stroke objects
  const [currentStroke, setCurrentStroke] = useState(null);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(-1);
  const [context, setContext] = useState(null);

  // Redraw all strokes on canvas - wrapped in useCallback to avoid dependency issues
  const redrawCanvas = useCallback((ctx) => {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Only draw strokes up to currentStrokeIndex
    const strokesToDraw = currentStrokeIndex >= 0 
      ? strokes.slice(0, currentStrokeIndex + 1)
      : strokes;

    strokesToDraw.forEach(stroke => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = stroke.mode === 'erase' ? 'destination-out' : 'source-over';

      ctx.beginPath();
      stroke.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }, [strokes, currentStrokeIndex]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !isVisible) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Redraw all strokes after resize
      redrawCanvas(ctx);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setContext(ctx);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isVisible, redrawCanvas]);

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
    setCurrentStroke({
      points: [coords],
      color: currentTool === 'draw' ? '#000000' : '#FFFFFF',
      width: currentTool === 'draw' ? 3 : 20,
      mode: currentTool
    });
  };

  // Draw
  const draw = (e) => {
    if (!isDrawing || !context || !currentStroke) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    const newStroke = {
      ...currentStroke,
      points: [...currentStroke.points, coords]
    };
    setCurrentStroke(newStroke);

    // Draw the current segment
    context.strokeStyle = newStroke.color;
    context.lineWidth = newStroke.width;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.globalCompositeOperation = currentTool === 'erase' ? 'destination-out' : 'source-over';

    const points = newStroke.points;
    const lastPoint = points[points.length - 2];
    const currentPoint = points[points.length - 1];

    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(currentPoint.x, currentPoint.y);
    context.stroke();
  };

  // Stop drawing
  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    setIsDrawing(false);

    if (currentStroke && currentStroke.points.length > 0) {
      // Remove any strokes after current index (for redo functionality)
      const newStrokes = currentStrokeIndex >= 0 
        ? [...strokes.slice(0, currentStrokeIndex + 1), currentStroke]
        : [...strokes, currentStroke];
      
      setStrokes(newStrokes);
      setCurrentStrokeIndex(newStrokes.length - 1);
    }

    setCurrentStroke(null);
  };

  // Undo last stroke
  const handleUndo = () => {
    if (currentStrokeIndex >= 0) {
      setCurrentStrokeIndex(currentStrokeIndex - 1);
      redrawCanvas(context);
    }
  };

  // Redo last undone stroke
  const handleRedo = () => {
    if (currentStrokeIndex < strokes.length - 1) {
      setCurrentStrokeIndex(currentStrokeIndex + 1);
      redrawCanvas(context);
    }
  };

  // Clear canvas and close
  const handleClose = () => {
    if (context) {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }
    setStrokes([]);
    setCurrentStrokeIndex(-1);
    setCurrentStroke(null);
    onClose();
  };

  // Change tool
  const handleToolChange = (tool) => {
    setCurrentTool(tool);
  };

  if (!isVisible) return null;

  return (
    <div className="sketch-overlay">
      <canvas
        ref={canvasRef}
        className="sketch-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <SketchControls
        currentTool={currentTool}
        onToolChange={handleToolChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClose={handleClose}
        canUndo={currentStrokeIndex >= 0}
        canRedo={currentStrokeIndex < strokes.length - 1}
      />
    </div>
  );
};

export default SketchOverlay;
