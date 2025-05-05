
export interface Env {
	// If you set another name in the Wrangler config file as the value for 'binding',
	// replace "AI" with the variable name you defined.
	AI: Ai;
}

interface StoryRequest {
	storyHistory: string[];
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}
		const url = new URL(request.url);
		if(url.pathname == "/generate-prompts") {

			const requestData = (await request.json() as StoryRequest);
			const { storyHistory } = requestData;
			const storySoFar = storyHistory.join("\n");
			return generatePrompts(env, storySoFar);
		} else if (url.pathname == "/generate-image") {
			const requestData = (await request.json() as StoryRequest);
			const { storyHistory } = requestData;
			const storySoFar = storyHistory.join("\n");
			return generateImage(env, storySoFar);
		} else {
			return new Response("Not found", { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;


const generatePrompts = async (env: Env, storySoFar: string) => {
	const chat = {
		messages: [
			{
			 role: "system",
			 content: `You are a hilarious comic book narrator. Craft three distinct, comedic story continuations in a punchy comic book style—think dynamic panels, bold captions, and cheeky humor.
		 IMPORTANT: Each option must be 75 characters or less. IMPORTANT BE FUNNY AND WITY`
			},
			{
			 role: "user",
			 content: `Story so far:\n\n${storySoFar}\n\nGenerate three funny, comic book–style continuations. Make each like a splash page: short, snappy, and sometimes of sound effects.
		 IMPORTANT: Each continuation must be 75 characters or less.`
			}
		],
		response_format: {
			type: "json_schema",
			json_schema: {
				type: "object",
				properties: {
					prompts: {
						type: "array",
						items: {
							type: "object",
							properties: {
								prompt: {
									type: "string"
								},
							}
						}
					}
				},
				required: [
					"prompts"
				]
			}
		}
	};
	// Call Llama 3 to generate continuations
	// @ts-ignore
	const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', chat);

	// Return the options as JSON
	return Response.json(response);
}

const generateImage = async (env: Env, prompt: string) => {
	const inputs = {
		prompt: `Generate an image for t ${prompt}`,
	};

	const response = await env.AI.run(
		"@cf/bytedance/stable-diffusion-xl-lightning",
		inputs,
	);

	return new Response(response, {
		headers: {
			"content-type": "image/png",
		},
	});
}
