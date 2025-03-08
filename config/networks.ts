interface ChainInfo {
  name: string;
  explorer: string;
  rpcUrl: string;
  contractAddress: `0x${string}`;
}

export const supportedNetworks: { [key: string]: ChainInfo } = {
  42: {
    name: 'LUKSO',
    explorer: 'https://explorer.execution.mainet.lukso.network',
    rpcUrl: 'https://42.rpc.thirdweb.com',
    contractAddress: "0xfcEd91879dFCda2709f3Be287d4F29eeeA0f29b6"
  },
  4201: {
    name: 'LUKSO Testnet',
    explorer: 'https://explorer.execution.testnet.lukso.network',
    rpcUrl: 'https://4201.rpc.thirdweb.com',
    contractAddress: "0x60f18AC1787ec4E79C6739F4BEd3Fd2420740245"
  },
};
