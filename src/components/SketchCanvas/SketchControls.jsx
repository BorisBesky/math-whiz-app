import React, { useState, useEffect } from 'react';
import { Pencil, Eraser, Undo, Redo, X, Trash2, Circle } from 'lucide-react';

const SketchControls = ({ 
  currentTool, 
  onToolChange, 
  onUndo, 
  onRedo, 
  onClose,
  canUndo,
  canRedo,
  onClearAll,
  eraserSize,
  onEraserSizeChange,
  penSize,
  onPenSizeChange,
  penColor,
  onPenColorChange
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(true);
  }, [currentTool]);

  const handleToolClick = (tool) => {
    if (currentTool === tool) {
      setIsMenuOpen(!isMenuOpen);
    } else {
      onToolChange(tool);
    }
  };

  const handleSizeClick = (changeHandler, size) => {
    changeHandler(size);
    setIsMenuOpen(false);
  };

  const handleColorClick = (color) => {
    onPenColorChange(color);
    setIsMenuOpen(false);
  };

  return (
    <div className="sketch-controls">
      {/* Pen Tool Container */}
      <div className="tool-container">
        <button
            onClick={() => handleToolClick('draw')}
            className={`sketch-control-btn ${currentTool === 'draw' ? 'active' : ''}`}
            title="Draw"
        >
            <Pencil size={20} />
        </button>
        
        {/* Slide-out options for Pen */}
        <div className={`tool-options ${currentTool === 'draw' && isMenuOpen ? 'open' : ''}`}>
             <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' }}></div>
            <button
                onClick={() => handleColorClick('#3B82F6')}
                className={`sketch-control-btn option-btn ${penColor === '#3B82F6' ? 'active' : ''}`}
                title="Blue"
            >
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#3B82F6' }} />
            </button>
            <button
                onClick={() => handleColorClick('#EF4444')}
                className={`sketch-control-btn option-btn ${penColor === '#EF4444' ? 'active' : ''}`}
                title="Red"
            >
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#EF4444' }} />
            </button>
            <button
                onClick={() => handleColorClick('#000000')}
                className={`sketch-control-btn option-btn ${penColor === '#000000' ? 'active' : ''}`}
                title="Black"
            >
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#000000' }} />
            </button>
             <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' }}></div>
            <button
                onClick={() => handleSizeClick(onPenSizeChange, 10)}
                className={`sketch-control-btn option-btn ${penSize === 10 ? 'active' : ''}`}
                title="Large Pen"
            >
                <Circle size={12} fill={penSize === 10 ? "currentColor" : "none"} />
            </button>
            <button
                onClick={() => handleSizeClick(onPenSizeChange, 6)}
                className={`sketch-control-btn option-btn ${penSize === 6 ? 'active' : ''}`}
                title="Medium Pen"
            >
                <Circle size={8} fill={penSize === 6 ? "currentColor" : "none"} />
            </button>
            <button
                onClick={() => handleSizeClick(onPenSizeChange, 3)}
                className={`sketch-control-btn option-btn ${penSize === 3 ? 'active' : ''}`}
                title="Small Pen"
            >
                <Circle size={4} fill={penSize === 3 ? "currentColor" : "none"} />
            </button>
        </div>
      </div>
      
      {/* Eraser Tool Container */}
      <div className="tool-container">
        <button
            onClick={() => handleToolClick('erase')}
            className={`sketch-control-btn ${currentTool === 'erase' ? 'active' : ''}`}
            title="Erase"
        >
            <Eraser size={20} />
        </button>

        {/* Slide-out options for Eraser */}
         <div className={`tool-options ${currentTool === 'erase' && isMenuOpen ? 'open' : ''}`}>
             <button
                onClick={() => handleSizeClick(onEraserSizeChange, 40)}
                className={`sketch-control-btn option-btn ${eraserSize === 40 ? 'active' : ''}`}
                title="Large Eraser"
            >
                <Circle size={20} fill={eraserSize === 40 ? "currentColor" : "none"} />
            </button>
             <button
                onClick={() => handleSizeClick(onEraserSizeChange, 20)}
                className={`sketch-control-btn option-btn ${eraserSize === 20 ? 'active' : ''}`}
                title="Medium Eraser"
            >
                <Circle size={14} fill={eraserSize === 20 ? "currentColor" : "none"} />
            </button>
             <button
                onClick={() => handleSizeClick(onEraserSizeChange, 10)}
                className={`sketch-control-btn option-btn ${eraserSize === 10 ? 'active' : ''}`}
                title="Small Eraser"
            >
                <Circle size={8} fill={eraserSize === 10 ? "currentColor" : "none"} />
            </button>
        </div>
      </div>

      <div className="sketch-control-divider"></div>
      
      <button
        onClick={onUndo}
        className="sketch-control-btn"
        disabled={!canUndo}
        title="Undo"
      >
        <Undo size={20} />
      </button>
      
      <button
        onClick={onRedo}
        className="sketch-control-btn"
        disabled={!canRedo}
        title="Redo"
      >
        <Redo size={20} />
      </button>

      <button
        onClick={onClearAll}
        className="sketch-control-btn"
        title="Clear All"
      >
        <Trash2 size={20} />
      </button>

      <div className="sketch-control-divider"></div>
      
      <button
        onClick={onClose}
        className="sketch-control-btn close-btn"
        title="Close"
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default SketchControls;
