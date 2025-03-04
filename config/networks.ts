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
    contractAddress: "0x576Ad4c43abA88cF52B299D1D572E5096082Fc6D"
  },
};
