
// Helper function to fetch and convert image to Uint8Array
export async function fetchImageBytes(
  ipfsGateway: string,
  ipfsUrl: string
): Promise<Uint8Array> {
  const imageUrl = `${ipfsGateway}${ipfsUrl.replace('ipfs://', '')}`;
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${imageUrl}`);
  }
  const imageBlob = await response.blob();
  return new Uint8Array(await imageBlob.arrayBuffer());
}
