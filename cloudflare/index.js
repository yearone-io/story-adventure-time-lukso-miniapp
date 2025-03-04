export default {
  async fetch(request, env) {
    // Only process POST requests for our story generator
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      // Parse the request body to get the story history
      const requestData = await request.json();
      const { storyHistory } = requestData;

      // Format the story so far as a single text
      const storySoFar = storyHistory.join("\n");

      // Create the chat message format that Llama expects
      const chat = {
        messages: [
          {
            role: 'system',
            content: `You are a creative storytelling assistant. Your task is to generate three distinct, 
            engaging continuations for an interactive story. Each option MUST be no longer than 100 characters and 
            offer a unique direction for the story. 
            Label each option with "OPTION 1:", "OPTION 2:", and "OPTION 3:" at the beginning.`
          },
          {
            role: 'user',
            content: `Here's the story so far:\n\n${storySoFar}\n\nGenerate three unique and creative 
            continuations for this story. Make them interesting and different from each other. 
            IMPORTANT: Each continuation must be 100 characters or less.`
          }
        ]
      };

      // Call Llama 3 to generate continuations
      const response = await env.AI.run('@cf/meta/llama-3-8b-instant', chat);

      // Parse the response to extract the three options
      const options = parseOptionsFromResponse(response);

      // Ensure each option is within the character limit
      const trimmedOptions = options.map(option =>
        option.length > 100 ? option.substring(0, 97) + '...' : option
      );

      // Return the options as JSON
      return Response.json({ options: trimmedOptions });

    } catch (error) {
      console.error('Error generating story options:', error);
      return Response.json(
        {
          error: 'Failed to generate story options',
          options: [
            "You encounter a mysterious stranger who offers to guide you.",
            "A sudden change in weather forces you to seek shelter.",
            "You discover an unusual object that seems important."
          ]
        },
        { status: 500 }
      );
    }
  }
};

// Helper function to parse the Llama response and extract distinct options
function parseOptionsFromResponse(response) {
  const text = response.response;

  // Try to extract options based on OPTION labels
  const optionRegex = /OPTION\s+(\d+):\s+(.*?)(?=OPTION\s+\d+:|$)/gis;
  const matches = [...text.matchAll(optionRegex)];

  if (matches.length >= 3) {
    return matches.slice(0, 3).map(match => match[2].trim());
  }

  // Fallback: split by numbered options (1., 2., 3.)
  const numberRegex = /(\d+\.)\s+(.*?)(?=\d+\.|$)/gis;
  const numberMatches = [...text.matchAll(numberRegex)];

  if (numberMatches.length >= 3) {
    return numberMatches.slice(0, 3).map(match => match[2].trim());
  }

  // Last resort: just split the text into roughly three parts
  const parts = text.split(/\n\n|\.\s+/).filter(part => part.trim().length > 20);
  if (parts.length >= 3) {
    return parts.slice(0, 3);
  }

  // If all parsing fails, return default options (now shortened to 100 chars or less)
  return [
    "A hidden path leads deeper into the unknown.",
    "A strange character approaches with an intriguing proposition.",
    "The atmosphere shifts, revealing something previously concealed."
  ];
}
