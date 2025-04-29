

export interface Env {
	// If you set another name in the Wrangler config file as the value for 'binding',
	// replace "AI" with the variable name you defined.
	AI: Ai;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}
		const url = new URL(request.url);
		if(url.pathname == "/generate-prompts") {
			const requestData = await request.json();
			const { storyHistory } = requestData;
			const storySoFar = storyHistory.join("\n");
			return generatePrompts(env, storySoFar);
		} else if (url.pathname == "/generate-image") {
			const requestData = await request.json();
			const { storyHistory } = requestData;
			const storySoFar = storyHistory.join("\n");
			return generateImage(env, storySoFar);
		} else {
			return new Response("Not found", { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;


const generatePrompts = async (env: Env, storySoFar: string[]) => {
	const chat = {
		messages: [
			{
				role: "system",
				content:`You are a creative storytelling assistant. Your task is to generate three distinct,
            engaging continuations for an interactive story. Each option MUST be no longer than 100 characters and
            offer a unique direction for the story.
            IMPORTANT: Each option must be 100 characters or less.`
			},
			{
				role: "user",
				content: `Here's the story so far:\n\n${storySoFar}\n\nGenerate three unique and creative
            continuations for this story. Make them interesting and different from each other.
            IMPORTANT: Each continuation must be 100 characters or less.`
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
	const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', chat);

	// Return the options as JSON
	return Response.json(response);
}

const generateImage = async (env: Env, storySoFar: string[]) => {
	const inputs = {
		prompt: `Generate an image for this story history so far, in cyberpunk style: ${storySoFar}`,
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
