
// 1. call a new /api/generate-image with the first story prompt and return a hardcoded url of an image

import { pinFileToIPFS } from "@/services/ipfs";

// 2. upload it to IPFS
const axios = require('axios');


/**
 * Generates an image from a story and returns it as a File object
 */
export const generateImageFile = async (storyHistory: string[]): Promise<File> => {
  const response = await axios.post(
    'https://universal-stories.hello-e4c.workers.dev/generate-image',
    {
      storyHistory: storyHistory,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'blob',
    }
  );

  const blob = new Blob([response.data], { type: 'image/png' });
  return new File([blob], 'generate-image.png', { type: 'image/png' });
};
  

// 3. pass the ipfs url to the smart contract
export async function POST(
    request: Request,
  ) {
    try {
        const { storyHistory } =  await request.json();

        console.log(storyHistory);
        let imageFile = await generateImageFile(storyHistory)

        console.log('BOOOO')
        console.log(imageFile)

        // upload to ipfs
        const ipfs = await pinFileToIPFS('universal-story', imageFile);
        console.log('sent to ipfs')

        // return image and ipfs url


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
