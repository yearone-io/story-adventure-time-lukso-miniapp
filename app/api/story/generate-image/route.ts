
// 1. call a new /api/generate-image with the first story prompt and return a hardcoded url of an image
// 2. upload it to IPFS
const axios = require('axios');
import { pinFileToIPFS } from "@/services/ipfs";

// 3. pass the ipfs url to the smart contract
export async function POST(
    request: Request,
  ) {
    try {
        const { storyHistory } =  await request.json();

        console.log(storyHistory);
        let imageFile = null; // todo get image

        try {
            const imagePayload = {
                "storyHistory": storyHistory
            }
            imageFile = await axios.post(`${process.env.CLOUDFLARE_WORKER_URL}/generate-image`, imagePayload)
        } catch (error) {
            // todo 
            // default image?
        }

        // upload to ipfs
        const ipfs = await pinFileToIPFS('universal-story', imageFile);

        // return image and ipfs url

    
        // const response = await fetch(process.env.CLOUDFLARE_WORKER_URL!, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     storyHistory: storyHistory,
        //   }),
        // });

        // if (!getImage.ok) {
        // throw new Error(`API responded with status: ${getImage.status}`);
        // }

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
