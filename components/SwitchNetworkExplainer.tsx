import { supportedNetworks } from "@/config/networks";

const ConnectWalletExplainer = (
  {
    onClose,
    profileNetwork,
    connectedNetwork
  }: {
    profileNetwork: number;
    connectedNetwork: number;
    onClose: () => void
  }
) => {
  const profileNetworkName = supportedNetworks[connectedNetwork]!.name;
  const connectedNetworkName = supportedNetworks[profileNetwork]!.name;

  return (
      <div className="
            absolute bottom-12 right-0
            w-72 md:w-80
            bg-gray-800/95 backdrop-blur-sm
            rounded-lg shadow-xl
            p-4
            border border-purple-500/50
            text-white/90
            z-20
          ">
        <h3 className="text-lg font-semibold text-purple-300 mb-2">Switch networks</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <span className="text-purple-400 mr-2">•</span>
            <span>Your extension is connected to {connectedNetworkName}, but you're viewing a {profileNetworkName}. Please connect to the correct network and reload the page to proceed.</span>
          </li>
        </ul>
        <button
          onClick={function() {
            onClose();
          }}
          className="
            mt-2
            w-20 h-10
            bg-purple-600 text-white
            rounded-full
            flex items-center justify-center
          "
          aria-label="Close"
        >
          (x) Close
        </button>
      </div>
  );
};

export default ConnectWalletExplainer;