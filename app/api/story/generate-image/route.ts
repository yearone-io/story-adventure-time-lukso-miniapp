

import { pinFileToIPFS } from "@/services/ipfs";

const axios = require('axios');


const generateImageFile = async (storyHistory: string[]): Promise<File> => {
    try {
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
    } catch (error) {
      console.warn('Image generation failed, using fallback image.');
  
      // Fallback: fetch from static URL
      const fallbackResponse = await fetch('/universal-story.png');
      const fallbackBlob = await fallbackResponse.blob();
      return new File([fallbackBlob], 'fallback-image.png', {
        type: fallbackBlob.type,
      });
    }
  };
  

export async function POST(
    request: Request,
  ) {
    // 1. call a new /api/generate-image with the first story prompt and return a hardcoded url of an image
    try {
        const { storyHistory } =  await request.json();

        console.log(storyHistory);
        let imageFile = await generateImageFile(storyHistory)
     
        console.log('BOOOO')
        console.log(imageFile)

        // 2. upload it to IPFS
        const ipfs = await pinFileToIPFS('universal-story', imageFile);
        console.log('sent to ipfs')

        // 3. pass the ipfs url to the smart contract
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
