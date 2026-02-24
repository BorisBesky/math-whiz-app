import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Pen, RotateCcw, Trash2, Circle } from 'lucide-react';

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
  const bgCanvasRef = useRef(null);
  const currentStrokeRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const isDrawingRef = useRef(false);
  
  // Tool state
  const [currentTool, setCurrentTool] = useState('draw'); // 'draw' or 'erase'
  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(3);
  const [eraserSize, setEraserSize] = useState(20);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Refs for drawing performance (avoid closures capturing old state)
  const currentToolRef = useRef(currentTool);
  const penColorRef = useRef(penColor);
  const penSizeRef = useRef(penSize);
  const eraserSizeRef = useRef(eraserSize);

  const [strokes, setStrokes] = useState([]);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(-1);
  const [context, setContext] = useState(null);
  const contextRef = useRef(null);
  const strokesRef = useRef([]);
  const currentStrokeIndexRef = useRef(-1);
  const [bgImageObj, setBgImageObj] = useState(null);

  // Keep refs in sync with state
  useEffect(() => {
    currentToolRef.current = currentTool;
    // Auto-open menu when switching tools
    setIsMenuOpen(true);
  }, [currentTool]);

  useEffect(() => {
    penColorRef.current = penColor;
  }, [penColor]);

  useEffect(() => {
    penSizeRef.current = penSize;
  }, [penSize]);

  useEffect(() => {
    eraserSizeRef.current = eraserSize;
  }, [eraserSize]);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  useEffect(() => {
    currentStrokeIndexRef.current = currentStrokeIndex;
  }, [currentStrokeIndex]);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.tool-control-wrapper')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

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

  // Initialize canvases
  useEffect(() => {
    if (!canvasRef.current) return;

    const dpr = window.devicePixelRatio || 1;

    // Setup strokes canvas (transparent - no white fill)
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    // Setup background canvas
    const bgCanvas = bgCanvasRef.current;
    if (bgCanvas) {
      const bgCtx = bgCanvas.getContext('2d');
      bgCanvas.width = width * dpr;
      bgCanvas.height = height * dpr;
      bgCanvas.style.width = width + 'px';
      bgCanvas.style.height = height + 'px';
      bgCtx.scale(dpr, dpr);
      bgCtx.fillStyle = '#FFFFFF';
      bgCtx.fillRect(0, 0, width, height);
    }

    setContext(ctx);
  }, [width, height]);

  // Draw background image on the dedicated background canvas
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;

    const bgCtx = bgCanvas.getContext('2d');

    // Reset transform, clear, then re-apply
    bgCtx.save();
    bgCtx.setTransform(1, 0, 0, 1, 0, 0);
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.restore();

    bgCtx.fillStyle = '#FFFFFF';
    bgCtx.fillRect(0, 0, width, height);

    if (bgImageObj) {
      const scale = Math.min(width / bgImageObj.width, height / bgImageObj.height);
      const x = (width / 2) - (bgImageObj.width / 2) * scale;
      const y = (height / 2) - (bgImageObj.height / 2) * scale;
      bgCtx.drawImage(bgImageObj, x, y, bgImageObj.width * scale, bgImageObj.height * scale);
    }
  }, [bgImageObj, width, height]);

  // Redraw strokes whenever they change
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

    // Clear strokes canvas (transparent - background is on separate canvas)
    context.clearRect(0, 0, width, height);

    // Draw strokes from offscreen canvas
    context.globalCompositeOperation = 'source-over';
    context.drawImage(offscreenCanvas, 0, 0);

    // Notify parent with composite image (background + strokes)
    if (onChangeRef.current) {
      const dpr = window.devicePixelRatio || 1;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = width * dpr;
      exportCanvas.height = height * dpr;
      const exportCtx = exportCanvas.getContext('2d');

      // Draw background canvas
      if (bgCanvasRef.current) {
        exportCtx.drawImage(bgCanvasRef.current, 0, 0);
      } else {
        exportCtx.fillStyle = '#FFFFFF';
        exportCtx.fillRect(0, 0, width * dpr, height * dpr);
      }

      // Draw strokes canvas on top
      exportCtx.drawImage(canvasRef.current, 0, 0);

      const imageData = exportCanvas.toDataURL('image/png');
      onChangeRef.current(imageData);
    }
  }, [strokes, currentStrokeIndex, context, width, height, bgImageObj]);

  // Get coordinates from mouse or touch event
  const getCoordinates = useCallback((e) => {
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
  }, []);

  // Start drawing
  const startDrawing = useCallback((e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const coords = getCoordinates(e);
    currentStrokeRef.current = {
      points: [coords],
      color: currentToolRef.current === 'draw' ? penColorRef.current : '#FFFFFF',
      width: currentToolRef.current === 'draw' ? penSizeRef.current : eraserSizeRef.current,
      mode: currentToolRef.current
    };
  }, [getCoordinates]);

  // Draw
  const draw = useCallback((e) => {
    if (!isDrawingRef.current || !contextRef.current || !currentStrokeRef.current) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    const currentStroke = currentStrokeRef.current;
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    currentStroke.points.push(coords);

    // Draw the current segment
    const ctx = contextRef.current;
    ctx.strokeStyle = currentStroke.color;
    ctx.lineWidth = currentStroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = currentStroke.mode === 'erase' ? 'destination-out' : 'source-over';

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }, [getCoordinates]);

  // Stop drawing
  const stopDrawing = useCallback((e) => {
    if (!isDrawingRef.current) return;
    if (e) e.preventDefault();
    
    isDrawingRef.current = false;

    // Commit the stroke from ref to state
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      const base = strokesRef.current.slice(0, currentStrokeIndexRef.current + 1);
      const newStrokes = [...base, currentStrokeRef.current];
      
      setStrokes(newStrokes);
      setCurrentStrokeIndex(newStrokes.length - 1);
    }

    currentStrokeRef.current = null;
  }, []);

  // Attach non-passive touch event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use non-passive listeners for touch events to allow preventDefault
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [startDrawing, draw, stopDrawing]);

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
      context.clearRect(0, 0, width, height);
    }
    if (onChangeRef.current) {
      onChangeRef.current(null);
    }
  };

  return (
    <div className={`drawing-canvas-container ${className}`}>
      <div className="border border-gray-300 rounded-lg bg-white overflow-hidden" style={{ position: 'relative', width: width + 'px', height: height + 'px', margin: '0 auto' }}>
        <canvas
          ref={bgCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'block',
            pointerEvents: 'none'
          }}
        />
        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            position: 'relative',
            touchAction: 'none',
            display: 'block'
          }}
        />
      </div>
      
      {/* Drawing Controls */}
      <div className="flex justify-center items-center space-x-3 mt-4 relative z-10">
        
        {/* Pen Tool Wrapper */}
        <div className="tool-control-wrapper relative">
          {/* Pen Submenu */}
          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col-reverse items-center gap-2 transition-all duration-200 z-50 ${currentTool === 'draw' && isMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
             {/* Sizes */}
             <button onClick={() => setPenSize(3)} className={`p-1.5 rounded-full hover:bg-gray-100 ${penSize === 3 ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`} title="Small Pen"><Circle size={8} fill={penSize === 3 ? "currentColor" : "none"}/></button>
             <button onClick={() => setPenSize(6)} className={`p-1.5 rounded-full hover:bg-gray-100 ${penSize === 6 ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`} title="Medium Pen"><Circle size={12} fill={penSize === 6 ? "currentColor" : "none"}/></button>
             <button onClick={() => setPenSize(10)} className={`p-1.5 rounded-full hover:bg-gray-100 ${penSize === 10 ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`} title="Large Pen"><Circle size={16} fill={penSize === 10 ? "currentColor" : "none"}/></button>
             
             {/* Divider */}
             <div className="w-8 h-px bg-gray-200 my-1"></div>

             {/* Colors */}
             <button onClick={() => setPenColor('#000000')} className={`p-1 rounded-full border-2 ${penColor === '#000000' ? 'border-blue-600' : 'border-transparent'}`} title="Black"><div className="w-5 h-5 rounded-full bg-black"></div></button>
             <button onClick={() => setPenColor('#EF4444')} className={`p-1 rounded-full border-2 ${penColor === '#EF4444' ? 'border-blue-600' : 'border-transparent'}`} title="Red"><div className="w-5 h-5 rounded-full bg-red-500"></div></button>
             <button onClick={() => setPenColor('#3B82F6')} className={`p-1 rounded-full border-2 ${penColor === '#3B82F6' ? 'border-blue-600' : 'border-transparent'}`} title="Blue"><div className="w-5 h-5 rounded-full bg-blue-500"></div></button>
          </div>

          <button
            onClick={() => {
                if (currentTool === 'draw') {
                    setIsMenuOpen(!isMenuOpen);
                } else {
                    setCurrentTool('draw');
                }
            }}
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
        </div>
        
        {/* Eraser Tool Wrapper */}
        <div className="tool-control-wrapper relative">
           {/* Eraser Submenu */}
           <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col-reverse items-center gap-2 transition-all duration-200 z-50 ${currentTool === 'erase' && isMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
             <button onClick={() => setEraserSize(10)} className={`p-1.5 rounded-full hover:bg-gray-100 ${eraserSize === 10 ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`} title="Small Eraser"><Circle size={8} fill={eraserSize === 10 ? "currentColor" : "none"}/></button>
             <button onClick={() => setEraserSize(20)} className={`p-1.5 rounded-full hover:bg-gray-100 ${eraserSize === 20 ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`} title="Medium Eraser"><Circle size={14} fill={eraserSize === 20 ? "currentColor" : "none"}/></button>
             <button onClick={() => setEraserSize(40)} className={`p-1.5 rounded-full hover:bg-gray-100 ${eraserSize === 40 ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`} title="Large Eraser"><Circle size={20} fill={eraserSize === 40 ? "currentColor" : "none"}/></button>
           </div>

           <button
            onClick={() => {
                if (currentTool === 'erase') {
                    setIsMenuOpen(!isMenuOpen);
                } else {
                    setCurrentTool('erase');
                }
            }}
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
        </div>
        
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
