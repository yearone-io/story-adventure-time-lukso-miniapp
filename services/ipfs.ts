const axios = require('axios');
const FormData = require('form-data');

export const pinFileToIPFS = async (
    fileName: string,
    blob: Blob
  ) => {

    try {
      const tokenResponse = await axios.post('/api/story/generate-pinata-token');

      if (tokenResponse.data.error) {
        throw new Error(tokenResponse.data.error);
      }

      const file = new File([blob], fileName)
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenResponse.data.jwt}`,
        },
        body: data,
      });
      const resData = (await res.json()) as { IpfsHash: string} ;
      console.log(resData);

      return resData.IpfsHash;
    } catch (error) {
      console.error('Failed to pin file:', error);
      throw error;
    }
  };

// export async function getImageFromIPFS(
//   ipfsUrl: string,
//   chainId: number
// ): Promise<string> {
//   // Replace the 'ipfs://' prefix with the IPFS gateway URL
//   const currentNetwork = supportedNetworks[chainId];
//   const gatewayUrl = ipfsUrl.replace(
//     'ipfs://',
//     currentNetwork ? `${currentNetwork.ipfsGateway}/` : 'https://ipfs.io/ipfs/'
//   );

//   try {
//     const response = await fetch(gatewayUrl);
//     if (!response.ok) {
//       throw new Error(`Failed to fetch image: ${response.statusText}`);
//     }

//     const blob = await response.blob();
//     const imageUrl = URL.createObjectURL(blob);

//     return imageUrl;
//   } catch (error) {
//     console.error('Error fetching image from IPFS:', error);
//     return '';
//   }
// }