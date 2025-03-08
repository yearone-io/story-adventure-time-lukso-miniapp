import React from "react";
import { StoryPrompt } from "@/types/story";

const StoryLine = ({
  item,
  index,
  total,
}: {
  item: StoryPrompt;
  index: number;
  total: number;
}) => {
  return <div
    key={index}
    className={`
          relative p-4 bg-white/10 rounded-lg shadow-md 
          transform transition-all duration-300 hover:scale-[1.02]
          ${index === total - 1 ? 'border-2 border-purple-500' : ''}
        `}
  >
    <p className="text-white/90 italic text-base">{item.prompt}</p>
    {index < total - 1 && (
      <div className="absolute top-1/2 right-[-30px] transform -translate-y-1/2 rotate-90">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-purple-400 animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    )}
  </div>
}

export default StoryLine;