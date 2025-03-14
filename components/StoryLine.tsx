import React, { useEffect, useState } from "react";
import { StoryPrompt } from "@/types/story";
import { formatDistanceToNow } from "date-fns";
import { supportedNetworks } from "@/config/networks";
import { ERC725 } from '@erc725/erc725.js';
import erc725schema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import { profileImageCache, fetchInProgress } from "@/services/profile-cache";

// Constants for IPFS gateway and RPC endpoints
const IPFS_GATEWAY = 'https://api.universalprofile.cloud/ipfs/';

// Function to get a random delay between min and max seconds
const getRandomDelay = (min = 1, max = 5) => {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
};

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Format the author address (0x123...456)
  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format the timestamp - converting from Ethereum block timestamp (seconds) to JS Date (milliseconds)
  const formatTimestamp = (timestamp: number) => {
    // Multiply by 1000 to convert from seconds to milliseconds
    const date = new Date(timestamp * 1000);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Full date for tooltip - also need to convert from seconds to milliseconds
  const fullDate = new Date(item.timestamp * 1000).toLocaleString();

  // Explorer URL
  const explorerUrl = `${supportedNetworks[chainId].universalEverything(item.author)}`;

  // Generate avatar color as fallback
  const generateAvatarColor = (address: string) => {
    // Simple hash function to generate a color from address
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 60%)`;
  };

  useEffect(() => {
    async function fetchLuksoProfileImage() {
      if (!item.author) return;

      // Create a cache key using author address and chainId
      const cacheKey = `${item.author}_${chainId}`;

      // Check if we already have this profile image cached
      if (profileImageCache.has(cacheKey)) {
        const cachedUrl = profileImageCache.get(cacheKey);
        setAvatarUrl(cachedUrl);
        setIsLoading(false);
        return;
      }

      // Check if a fetch is already in progress for this author
      if (fetchInProgress.has(cacheKey)) {
        // Wait for it to complete by checking every 500ms
        const checkCache = setInterval(() => {
          if (profileImageCache.has(cacheKey)) {
            setAvatarUrl(profileImageCache.get(cacheKey));
            setIsLoading(false);
            clearInterval(checkCache);
          }
        }, 500);

        // Set a timeout to stop checking after 10 seconds to prevent infinite loops
        setTimeout(() => {
          clearInterval(checkCache);
          setIsLoading(false);
        }, 10000);

        return;
      }

      // Mark this fetch as in progress
      fetchInProgress.add(cacheKey);
      setIsLoading(true);

      try {
        // Add a random delay between 1-5 seconds before fetching
        const delay = getRandomDelay(1, 5);

        // Wait for the random delay
        await new Promise(resolve => setTimeout(resolve, delay));

        const config = { ipfsGateway: IPFS_GATEWAY };
        const rpcEndpoint = supportedNetworks[chainId].rpcUrl;

        const profile = new ERC725(erc725schema, item.author, rpcEndpoint, config);
        const fetchedData = await profile.fetchData('LSP3Profile');

        let url = null;
        if (
          fetchedData?.value &&
          typeof fetchedData.value === 'object' &&
          'LSP3Profile' in fetchedData.value
        ) {
          const profileImagesIPFS = fetchedData.value.LSP3Profile.profileImage;

          if (profileImagesIPFS?.[0]?.url) {
            url = profileImagesIPFS[0].url.replace('ipfs://', IPFS_GATEWAY);
            setAvatarUrl(url);
          }
        }

        // Cache the result (even if it's null, to avoid repeat fetches for users without profile images)
        profileImageCache.set(cacheKey, url);

      } catch (error) {
        console.error('Error fetching LUKSO profile image:', error);
        // Cache null to avoid repeated failed requests
        profileImageCache.set(cacheKey, null);
      } finally {
        setIsLoading(false);
        // Remove from in-progress tracking
        fetchInProgress.delete(cacheKey);
      }
    }

    fetchLuksoProfileImage();
  }, [item.author, chainId]);

  return (
    <div
      key={index}
      className={`
        relative p-4 bg-white/10 rounded-lg shadow-md 
        transform transition-all duration-300 hover:scale-[1.02]
        ${index === total - 1 ? 'border-2 border-purple-500' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={item.author}
          className="flex-shrink-0 mt-1"
        >
          {!isLoading && avatarUrl ? (
            <img
              src={avatarUrl}
              alt={truncateAddress(item.author)}
              className="w-8 h-8 rounded-full object-cover"
              onError={() => setAvatarUrl(null)} // Reset on error to show fallback
            />
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${isLoading ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: generateAvatarColor(item.author) }}
            >
              {item.author.substring(2, 4)}
            </div>
          )}
        </a>

        {/* Content */}
        <div className="flex-1">
          <p className="text-white/90 italic text-base">{item.prompt}</p>

          <div className="text-xs text-white/70 mt-1">
              <span title={fullDate} className="cursor-help">
                {formatTimestamp(item.timestamp)}
              </span>
          </div>
        </div>
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