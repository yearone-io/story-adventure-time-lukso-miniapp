import { AxiosResponse } from 'axios';

const axios = require('axios');
const FormData = require('form-data');

export const pinFileToIPFS = async (fileName: string, file: File) => {
  const data = new FormData();
  data.append('title', file.name);
  data.append('file', file);

  try {
    const tokenResponse = (await axios.post(
      '/api/generate-pinata-token'
    )) as AxiosResponse;

    if (tokenResponse.data.error) {
      throw new Error(tokenResponse.data.error);
    }
    const res = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      data,
      {
        maxContentLength: 'Infinity',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
          Authorization: `Bearer ${tokenResponse.data.jwt}`,
          path: fileName,
        },
      }
    );
    return res.data.IpfsHash;
  } catch (error) {
    console.log(error);
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