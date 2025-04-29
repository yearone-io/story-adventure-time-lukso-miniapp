
## Cloudflare Workers Starter Kit with typescript and a JSON response

- Install dependencies: `npm install`
- Run `npm run dev` in your terminal to start a development server
- Open a browser tab at http://localhost:8787/ to see your worker in action
- Run `npm run deploy` to publish your worker

Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
`Env` object can be regenerated with `npm run cf-typegen`.

Learn more at https://developers.cloudflare.com/workers/


## Example curl calls

### Generate prompts

```shell
curl -X POST http://localhost:8787/generate-prompts \
  -H "Content-Type: application/json" \
  -d '{
    "storyHistory": ["Footsteps echoed behind me in the empty alley, but when I turned, no one was there."]
}' | jq
```

### Generate image

```shell
curl -X POST http://localhost:8787/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "storyHistory": ["Footsteps echoed behind me in the empty alley, but when I turned, no one was there."]
}' > generate-image.png
```
