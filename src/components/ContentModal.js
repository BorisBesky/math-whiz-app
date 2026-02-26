import React from "react";
import { X } from "lucide-react";

const ContentModal = ({
  modalTitle,
  modalReactComponent,
  generatedContent,
  storyData,
  isGenerating,
  showStoryHint,
  setShowStoryHint,
  showStoryAnswer,
  setShowStoryAnswer,
  setModalReactComponent,
  setGeneratedContent,
  navigate,
}) => {
  if (!modalTitle && !modalReactComponent && !generatedContent && !storyData && !isGenerating) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl max-w-4xl w-full p-6 relative flex flex-col max-h-[85vh]">
        <div className="flex-shrink-0">
          <button
            onClick={() => {
              navigate(-1);
              // Reset story state when modal is closed
              if (modalTitle === "✨ A Fun Story Problem!") {
                setShowStoryHint(false);
                setShowStoryAnswer(false);
              }
              // Reset React component state
              setModalReactComponent(null);
              setGeneratedContent("");
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          >
            <X size={24} />
          </button>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            {modalTitle}
          </h3>
        </div>
        <div className="flex-grow overflow-hidden">
          {isGenerating &&
          (!storyData || modalTitle !== "✨ A Fun Story Problem!") ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : storyData ? (
            <div className="space-y-6">
              {/* Story Section */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-blue-800 mb-2">📖 The Story</h4>
                <p className="text-gray-700">{storyData.story}</p>
              </div>

              {/* Question Section */}
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-green-800 mb-2">
                  ❓ The Question
                </h4>
                <p className="text-gray-700">{storyData.question}</p>
              </div>

              {/* Hint Section */}
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-yellow-800">💡 Hint</h4>
                  <button
                    onClick={() => setShowStoryHint(!showStoryHint)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition"
                  >
                    {showStoryHint ? "Hide Hint" : "Show Hint"}
                  </button>
                </div>
                {showStoryHint && (
                  <p className="text-gray-700">{storyData.hint}</p>
                )}
              </div>

              {/* Answer Section */}
              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-purple-800">✅ Answer</h4>
                  <button
                    onClick={() => setShowStoryAnswer(!showStoryAnswer)}
                    className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 transition"
                  >
                    {showStoryAnswer ? "Hide Answer" : "Check Answer"}
                  </button>
                </div>
                {showStoryAnswer && (
                  <p className="text-gray-700 font-semibold">
                    {storyData.answer}
                  </p>
                )}
              </div>
            </div>
          ) : modalReactComponent ? (
            <div className="text-gray-700 leading-relaxed overflow-auto" style={{ maxHeight: '60vh' }}>
              {React.createElement(modalReactComponent)}
            </div>
          ) : generatedContent ? (
            // Note: generatedContent contains trusted HTML from our own API/iframe system, not user input
            <div
              className="text-gray-700 whitespace-pre-wrap leading-relaxed h-full"
              dangerouslySetInnerHTML={{ __html: generatedContent }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ContentModal;
