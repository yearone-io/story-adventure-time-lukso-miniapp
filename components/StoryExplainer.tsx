"use client";
import React, { useState } from "react";


const StoryExplainer = () => {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <div className="tooltip-container relative z-10">
      <button
        onClick={() => setTooltipVisible(!tooltipVisible)}
        className="
            w-8 h-8
            bg-purple-600 text-white font-bold
            rounded-full
            flex items-center justify-center
            hover:bg-purple-700
            transition-all duration-300
            shadow-lg
          "
        aria-label="How it works"
      >
        ?
      </button>

      {tooltipVisible && (
        <div className="
            absolute top-12 right-0
            w-72 md:w-80
            bg-gray-800/95 backdrop-blur-sm
            rounded-lg shadow-xl
            p-4
            border border-purple-500/50
            text-white/90
            z-20
          ">
          <h3 className="text-lg font-semibold text-purple-300 mb-2">How Universal Story Works</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Once you install this on your grid, you can start a storyline from your imagination.</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Our AI generates new unique story options based on the history so far.</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Anyone visiting your profile can participate collectively in which direction the story evolves</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Each profile has a unique story.</span>
            </li>
          </ul>
          <button
            onClick={function() {
              setTooltipVisible(false);
            }}
            className="
            mt-2
            w-20 h-10
            bg-purple-600 text-white
            rounded-full
            flex items-center justify-center
          "
            aria-label="Close"
          >
            (x) Close
          </button>
        </div>
      )}
    </div>
  );
};

export default StoryExplainer;
