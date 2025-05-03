interface ChainInfo {
  name: string;
  explorer: string;
  rpcUrl: string;
  universalEverything: (address: string) => string;
  contractAddress: `0x${string}`;
  ipfsGateway: string;
}

export const supportedNetworks: { [key: string]: ChainInfo } = {
  42: {
    name: 'LUKSO',
    explorer: 'https://explorer.execution.mainet.lukso.network',
    universalEverything: (address: string) => `https://universaleverything.io/${address}?network=mainnet`,
    rpcUrl: 'https://42.rpc.thirdweb.com',
    contractAddress: "0x0ca97784e61cA28feB0AEB51f14e42f33cEd0E9d",
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
  },
  4201: {
    name: 'LUKSO Testnet',
    explorer: 'https://explorer.execution.testnet.lukso.network',
    universalEverything: (address: string) => `https://universaleverything.io/${address}?network=testnet`,
    rpcUrl: 'https://4201.rpc.thirdweb.com',
    contractAddress: "0x8c7C764310232903dA87063d8214b43476b12F49",
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs/',
  },
};
