
export async function POST(
  request: Request,
  { params }: { params: { profileAddress: string } },
) {
  try {
    try {
      const { storyHistory } =  await request.json();

      console.log(storyHistory);
      const response = await fetch(process.env.CLOUDFLARE_WORKER_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyHistory: storyHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();

      // Check if we have valid options
      if (data.options && Array.isArray(data.options) && data.options.length >= 3) {
        return new Response(
          JSON.stringify(data.options.slice(0, 3)),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      throw new Error('Invalid response format from story generator API');
    } catch (error) {
      console.error('Error generating story options:', error);
      return new Response(
        JSON.stringify( [
          "You encounter a mysterious stranger offering help.",
          "A sudden storm forces you to seek shelter in an abandoned structure.",
          "You discover an unusual artifact that seems to react to your touch."
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Error processing message:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process message" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

