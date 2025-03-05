interface ChainInfo {
  name: string;
  contractAddress: `0x${string}`;
}

export const supportedNetworks: { [key: string]: ChainInfo } = {
  42: {
    name: 'LUKSO',
    contractAddress: "0x"
  },
  4201: {
    name: 'LUKSO Testnet',
    contractAddress: "0xB2110C80c4958a2AD74137De379bD62Caec9ABe4"
  },
};
