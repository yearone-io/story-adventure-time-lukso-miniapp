import type { LSP4Response } from "@/types/lsp4";  // adjust path as needed

export async function fetchLSP4Metadata(url: string): Promise<LSP4Response> {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch metadata: ${res.status} ${res.statusText}`);
  }

  // assert the JSON shape matches our type
  const data = (await res.json()) as LSP4Response;
  return data;
}
