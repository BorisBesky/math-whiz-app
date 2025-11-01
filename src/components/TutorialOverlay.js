import React, { useEffect, useRef, useState } from 'react';
import { useTutorial } from '../contexts/TutorialContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  SkipForward,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const TutorialOverlay = () => {
  const {
    isVisible,
    getCurrentStep,
    getProgress,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    endTutorial
  } = useTutorial();

  const [highlightRect, setHighlightRect] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const overlayRef = useRef(null);
  const tooltipRef = useRef(null);

  const currentStep = getCurrentStep();
  const progress = getProgress();

  // Calculate highlight rectangle and tooltip position
  useEffect(() => {
    if (!isVisible || !currentStep || !currentStep.targetSelector) {
      setHighlightRect(null);
      return;
    }

    const targetElement = document.querySelector(currentStep.targetSelector);
    if (!targetElement) {
      console.warn(`Tutorial target not found: ${currentStep.targetSelector}`);
      setHighlightRect(null);
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const padding = 8; // Add some padding around the highlighted element
    
    setHighlightRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + (padding * 2),
      height: rect.height + (padding * 2)
    });

    // Calculate tooltip position
    const tooltipWidth = 320; // Approximate tooltip width
    const tooltipHeight = 280; // Increased height to account for buttons
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let tooltipTop = 0;
    let tooltipLeft = 0;

    // Position tooltip based on the position preference
    switch (currentStep.position) {
      case 'top':
        tooltipTop = rect.top - tooltipHeight - 20;
        tooltipLeft = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        tooltipTop = rect.bottom + 20;
        tooltipLeft = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        tooltipTop = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        tooltipLeft = rect.left - tooltipWidth - 20;
        break;
      case 'right':
        tooltipTop = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        tooltipLeft = rect.right + 20;
        break;
      default:
        // Auto-position based on available space
        if (rect.top > tooltipHeight + 40) {
          tooltipTop = rect.top - tooltipHeight - 20;
        } else {
          tooltipTop = rect.bottom + 20;
        }
        tooltipLeft = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    }

    // Ensure tooltip stays within viewport with better margins
    const margin = 20;
    tooltipLeft = Math.max(margin, Math.min(tooltipLeft, viewportWidth - tooltipWidth - margin));
    
    // If tooltip would be cut off at bottom, position it above the target
    if (tooltipTop + tooltipHeight > viewportHeight - margin) {
      tooltipTop = Math.max(margin, rect.top - tooltipHeight - 20);
    }
    
    // If tooltip would be cut off at top, position it below the target
    if (tooltipTop < margin) {
      tooltipTop = Math.min(viewportHeight - tooltipHeight - margin, rect.bottom + 20);
    }

    // Final fallback: center the tooltip in the viewport if it still doesn't fit
    if (tooltipTop + tooltipHeight > viewportHeight - margin || tooltipTop < margin) {
      tooltipTop = Math.max(margin, (viewportHeight - tooltipHeight) / 2);
      tooltipLeft = Math.max(margin, (viewportWidth - tooltipWidth) / 2);
    }

    setTooltipPosition({ top: tooltipTop, left: tooltipLeft });

    // Scroll the target element into view if needed
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [isVisible, currentStep]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          endTutorial();
          break;
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          if (progress.current < progress.total) {
            nextStep();
          } else {
            completeTutorial();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (progress.current > 1) {
            previousStep();
          }
          break;
        default:
          // Do nothing for other keys
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, progress, nextStep, previousStep, completeTutorial, endTutorial]);

  if (!isVisible || !currentStep) {
    return null;
  }

  const handleNext = () => {
    if (progress.current < progress.total) {
      nextStep();
    } else {
      completeTutorial();
    }
  };

  const handlePrevious = () => {
    if (progress.current > 1) {
      previousStep();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 pointer-events-auto overflow-auto"
      style={{ zIndex: 9999 }}
    >
      {/* Spotlight effect with cutout */}
      {highlightRect ? (
        <div
          className="absolute border-4 border-blue-400 rounded-lg transition-all duration-300"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.1), 0 0 30px rgba(59, 130, 246, 0.8)',
            pointerEvents: 'none',
            zIndex: 10001,
            backgroundColor: 'transparent'
          }}
        />
      ) : (
        /* Full backdrop when no element is highlighted */
        <div className="absolute inset-0 bg-black bg-opacity-30 transition-opacity duration-300" />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 max-w-sm transition-all duration-300"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          zIndex: 10000,
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
      >
        {/* Tooltip Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              {currentStep.title}
            </h3>
          </div>
          <button
            onClick={endTutorial}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tooltip Content */}
        <div className="p-4">
          <p className="text-gray-700 mb-4 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              Step {progress.current} of {progress.total}
            </span>
            <div className="flex space-x-1">
              {Array.from({ length: progress.total }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < progress.current ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={handlePrevious}
                disabled={progress.current === 1}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              
              <button
                onClick={skipTutorial}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                <SkipForward className="w-4 h-4 mr-1" />
                Skip
              </button>
            </div>

            <button
              onClick={handleNext}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {progress.current === progress.total ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Arrow pointing to target element */}
        {highlightRect && (
          <div
            className="absolute w-0 h-0"
            style={{
              top: currentStep.position === 'top' ? '100%' : '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: currentStep.position === 'top' ? '8px solid white' : '8px solid transparent',
              borderBottom: currentStep.position === 'top' ? '8px solid transparent' : '8px solid white',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TutorialOverlay;
