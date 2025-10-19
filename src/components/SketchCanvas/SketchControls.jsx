import React from 'react';
import { Pencil, Eraser, Undo, Redo, X } from 'lucide-react';

const SketchControls = ({ 
  currentTool, 
  onToolChange, 
  onUndo, 
  onRedo, 
  onClose,
  canUndo,
  canRedo
}) => {
  return (
    <div className="sketch-controls">
      <button
        onClick={() => onToolChange('draw')}
        className={`sketch-control-btn ${currentTool === 'draw' ? 'active' : ''}`}
        title="Draw"
      >
        <Pencil size={20} />
      </button>
      
      <button
        onClick={() => onToolChange('erase')}
        className={`sketch-control-btn ${currentTool === 'erase' ? 'active' : ''}`}
        title="Erase"
      >
        <Eraser size={20} />
      </button>

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
