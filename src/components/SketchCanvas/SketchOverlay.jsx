import React, { useRef, useState, useEffect } from 'react';
import SketchControls from './SketchControls';
import './SketchCanvas.css';

const SketchOverlay = ({ isVisible, onClose }) => {
  const canvasRef = useRef(null);
  const currentStrokeRef = useRef(null); // Use ref to store mutable stroke data during drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('draw'); // 'draw' or 'erase'
  const [eraserSize, setEraserSize] = useState(20);
  const [penSize, setPenSize] = useState(3);
  const [penColor, setPenColor] = useState('#000000');
  const [strokes, setStrokes] = useState([]); // Array of stroke objects
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(-1);
  const [context, setContext] = useState(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !isVisible) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match window
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
      ctx.scale(dpr, dpr);
      setContext(ctx);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setContext(ctx);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isVisible]);

  // Redraw canvas whenever strokes, index, or context changes
  useEffect(() => {
    if (!context || !isVisible) return;
    
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    
    // Only draw strokes up to currentStrokeIndex
    const strokesToDraw = currentStrokeIndex >= 0 
      ? strokes.slice(0, currentStrokeIndex + 1)
      : [];

    strokesToDraw.forEach(stroke => {
      context.strokeStyle = stroke.color;
      context.lineWidth = stroke.width;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.globalCompositeOperation = stroke.mode === 'erase' ? 'destination-out' : 'source-over';

      context.beginPath();
      stroke.points.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.stroke();
    });

    // Reset composite operation
    context.globalCompositeOperation = 'source-over';
  }, [strokes, currentStrokeIndex, context, isVisible]);

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
    // Store stroke in ref to avoid re-renders during drawing
    currentStrokeRef.current = {
      points: [coords],
      color: currentTool === 'draw' ? penColor : '#FFFFFF',
      width: currentTool === 'draw' ? penSize : eraserSize,
      mode: currentTool
    };
  };

  // Draw
  const draw = (e) => {
    if (!isDrawing || !context || !currentStrokeRef.current) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    
    // Mutate the ref directly - no re-render!
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

    // Now commit the stroke from ref to state (only one re-render per stroke!)
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      // Remove any strokes after current index (for redo functionality)
      const base = strokes.slice(0, currentStrokeIndex + 1);
      const newStrokes = [...base, currentStrokeRef.current];
      
      setStrokes(newStrokes);
      setCurrentStrokeIndex(newStrokes.length - 1);
    }

    // Clear the ref
    currentStrokeRef.current = null;
  };

  // Undo last stroke
  const handleUndo = () => {
    if (currentStrokeIndex >= 0) {
      setCurrentStrokeIndex(currentStrokeIndex - 1);
      // Redraw will happen automatically via useEffect
    }
  };

  // Redo last undone stroke
  const handleRedo = () => {
    if (currentStrokeIndex < strokes.length - 1) {
      setCurrentStrokeIndex(currentStrokeIndex + 1);
      // Redraw will happen automatically via useEffect
    }
  };

  // Clear all strokes
  const handleClearAll = () => {
    if (context) {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }
    setStrokes([]);
    setCurrentStrokeIndex(-1);
  };

  // Clear canvas and close
  const handleClose = () => {
    if (context) {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }
    setStrokes([]);
    setCurrentStrokeIndex(-1);
    currentStrokeRef.current = null;
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
        onClearAll={handleClearAll}
        eraserSize={eraserSize}
        onEraserSizeChange={setEraserSize}
        penSize={penSize}
        onPenSizeChange={setPenSize}
        penColor={penColor}
        onPenColorChange={setPenColor}
      />
    </div>
  );
};

export default SketchOverlay;
