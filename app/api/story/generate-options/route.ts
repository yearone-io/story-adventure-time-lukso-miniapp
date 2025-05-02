// 1. Define your request‐body shape:
interface StoryRequest {
  storyHistory: string[];
}


// 2. Define the shape of the API’s JSON response:
interface StoryOptionsResponse {
  response: {
    prompts: {
      prompt: string
    }[]
  }
}

export async function POST(request: Request) {
  try {
    // 3. Cast the incoming JSON to your request type:
    const { storyHistory } = (await request.json()) as StoryRequest;

    console.log(storyHistory);

    const response = await fetch(process.env.CLOUDFLARE_WORKER_URL! + '/generate-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyHistory }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    // 4. Cast the fetched JSON to your response type:
    const data = (await response.json()) as StoryOptionsResponse;
    const prompts = data.response.prompts.map((p) => {return p.prompt})
    return Response.json( prompts)

  } catch (error) {
    console.error('Error generating story options:', error);
    // fallback hard-coded options
    return new Response(
      JSON.stringify([
        "You encounter a mysterious stranger offering help.",
        "A sudden storm forces you to seek shelter in an abandoned structure.",
        "You discover an unusual artifact that seems to react to your touch."
      ]),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
