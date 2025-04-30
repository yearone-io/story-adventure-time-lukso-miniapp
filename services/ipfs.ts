import { AxiosResponse } from 'axios';

const axios = require('axios');
const FormData = require('form-data');


export const pinFileToIPFS = async (
    fileName: string,
    file: { buffer: Buffer; name: string; type: string }
  ) => {
    const form = new FormData();
    form.append('title', file.name);
  
    // ✅ Use Buffer directly — works perfectly with axios and native FormData
    form.append('file', file.buffer, file.name);
  
    try {
        const tokenResponse = await axios.post('http://localhost:3000/api/story/generate-pinata-token');


      if (tokenResponse.data.error) {
        throw new Error(tokenResponse.data.error);
      }
  
      const res = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        form,
        {
          maxContentLength: Infinity,
          headers: {
            Authorization: `Bearer ${tokenResponse.data.jwt}`,
            path: fileName,
            ...form.getHeaders(), // 👈 Ensures multipart boundary is correct
          },
        }
      );
  
      console.log('ipfs data', res.data);
      return res.data.IpfsHash;
    } catch (error) {
      console.error('Failed to pin file:', error);
      throw error;
    }
  };

// export const pintJsonToIpfs = async (data: string) => {
//   const tokenResponse = (await axios.post(
//     '/api/generate-pinata-token'
//   )) as AxiosResponse<ResponseData>;

//   if (tokenResponse.data.error) {
//     throw new Error(tokenResponse.data.error);
//   }

//   try {
//     const res = await axios.post(
//       'https://api.pinata.cloud/pinning/pinJSONToIPFS',
//       data,
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${tokenResponse.data.jwt}`,
//         },
//       }
//     );
//     return res.data.IpfsHash;
//   } catch (error) {
//     console.log(error);
//   }
// };

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