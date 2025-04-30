
export const generateStoryOptions = async (storyHistory: string[]): Promise<string[]> => {
  try {
    const response = await fetch("/api/story/generate-options", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storyHistory: storyHistory,
      })
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error generating story options:', error);

    // Return fallback options in case of API failure
    return [
      "You encounter a mysterious stranger offering help.",
      "A sudden storm forces you to seek shelter in an abandoned structure.",
      "You discover an unusual artifact that seems to react to your touch."
    ];
  }
};

export const generatePromptImage = async(
  storyHistory: string[]
): Promise<Blob> => {
    const response = await fetch("/api/story/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",   // you’re sending JSON
        "Accept":        "image/png",          // you expect an image back
      },
      body: JSON.stringify({ storyHistory }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    // read the raw bytes as a Blob
    return await response.blob();
};
