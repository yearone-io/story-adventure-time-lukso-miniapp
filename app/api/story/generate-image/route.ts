import axios from 'axios';

const url = `${process.env.CLOUDFLARE_WORKER_URL}/generate-image`;

interface StoryRequest {
  storyHistory: string[];
}

export async function POST(request: Request) {
  try {
    const { storyHistory } = (await request.json()) as StoryRequest;

    // tell axios to give us a binary buffer, not try to JSON‐parse it
    const imageResponse = await axios.post(url,
      { storyHistory },
      { responseType: 'arraybuffer' }
    );

    // wrap it in a Buffer so Next can stream it
    const imageBuffer = Buffer.from(imageResponse.data, 'binary');

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        // you can also set caching headers here if you like
      },
    });
  } catch (error) {
    console.error('Error processing image prompt:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch image' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
