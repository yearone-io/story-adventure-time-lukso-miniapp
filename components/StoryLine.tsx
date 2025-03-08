import React from "react";
import { StoryPrompt } from "@/types/story";
import { formatDistanceToNow } from "date-fns";
import { supportedNetworks } from "@/config/networks";

const StoryLine = ({
                     item,
                     index,
                     total,
                     chainId,
                   }: {
  item: StoryPrompt;
  index: number;
  total: number;
  chainId: number;
}) => {
  // Format the author address (0x123...456)
  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format the timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Full date for tooltip
  const fullDate = new Date(item.timestamp).toLocaleString();

  // Explorer URL
  const explorerUrl = `${supportedNetworks[chainId].explorer}/address/${item.author}`;
  return (
    <div
      key={index}
      className={`
        relative p-4 bg-white/10 rounded-lg shadow-md 
        transform transition-all duration-300 hover:scale-[1.02]
        ${index === total - 1 ? 'border-2 border-purple-500' : ''}
      `}
    >
      <p className="text-white/90 italic text-base mb-2">{item.prompt}</p>

      <div className="flex justify-between items-center text-xs text-white/70 mt-2 pt-2 border-t border-white/20">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-purple-400 transition-colors"
        >
          by {truncateAddress(item.author)}
        </a>

        <span title={fullDate} className="cursor-help">
          {formatTimestamp(item.timestamp)}
        </span>
      </div>

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
  );
};

export default StoryLine;