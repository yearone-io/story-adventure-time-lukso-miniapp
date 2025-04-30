import { pinFileToIPFS } from '@/services/ipfs';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';


export const generateImageBuffer = async (storyHistory: string[]): Promise<{ buffer: Buffer; name: string; type: string }> => {
    try {
      const url = process.env.CLOUDFLARE_WORKER_URL + `/generate-image`;
      const response = await axios.post(
        url,
        {
          storyHistory: storyHistory,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );
  
      return {
        buffer: Buffer.from(response.data),
        name: 'generate-image.png',
        type: 'image/png',
      };
    } catch (error) {
      console.warn('Image generation failed, using fallback image: ', error);
  
      const fallbackPath = path.join(process.cwd(), 'public', 'universal-story.png');
      const fallbackBuffer = await fs.readFile(fallbackPath);
  
      return {
        buffer: fallbackBuffer,
        name: 'fallback-image.png',
        type: 'image/png',
      };
    }
  };
  

export async function POST(
    request: Request,
  ) {
    // 1. call a new /api/generate-image with the first story prompt and return a hardcoded url of an image
    try {
        const { storyHistory } =  await request.json();

        console.log(storyHistory);
        const imageFile = await generateImageBuffer(storyHistory)

        // 2. upload it to IPFS
        const ipfsData = await pinFileToIPFS(imageFile.name, imageFile);
        console.log('sent to ipfs')

        // 3. pass the ipfs url to the smart contract
        return ipfsData.IpfsHash
    } catch (error) {
      console.error("Error processing image prompt:", error);
      return new Response(
        JSON.stringify({ error: "Failed to process message" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }
