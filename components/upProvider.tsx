/**
 * @component UpProvider
 * @description Context provider that manages Universal Profile (UP) wallet connections and state
 * for LUKSO blockchain interactions on Grid. It handles wallet connection status, account management, and chain
 * information while providing real-time updates through event listeners.
 *
 * @provides {UpProviderContext} Context containing:
 * - provider: UP-specific wallet provider instance
 * - client: Viem wallet client for blockchain interactions
 * - chainId: Current blockchain network ID
 * - accounts: Array of connected wallet addresses
 * - contextAccounts: Array of Universal Profile accounts
 * - walletConnected: Boolean indicating active wallet connection
 * - selectedAddress: Currently selected address for transactions
 */
"use client";

import {
  createClientUPProvider,
  type UPClientProvider,
} from "@lukso/up-provider";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { lukso, luksoTestnet } from "viem/chains";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useMemo,
} from "react";

interface UpProviderContext {
  provider: UPClientProvider | null;
  client: ReturnType<typeof createWalletClient> | null;
  publicClient: ReturnType<typeof createPublicClient>;
  chainId: number;
  profileChainId: number;
  accounts: Array<`0x${string}`>;
  contextAccounts: Array<`0x${string}`>;
  walletConnected: boolean;
  selectedAddress: `0x${string}` | null;
  setSelectedAddress: (address: `0x${string}` | null) => void;
}

const UpContext = createContext<UpProviderContext | undefined>(undefined);

const provider =
  typeof window !== "undefined" ? createClientUPProvider() : null;

export function useUpProvider() {
  const context = useContext(UpContext);
  if (!context) {
    throw new Error("useUpProvider must be used within a UpProvider");
  }
  return context;
}

interface UpProviderProps {
  children: ReactNode;
}

export function UpProvider({ children }: UpProviderProps) {
  const [chainId, setChainId] = useState<number>(4201);
  const [profileChainId, setProfileChainId] = useState<number>(4201);
  const [accounts, setAccounts] = useState<Array<`0x${string}`>>([]);
  const [contextAccounts, setContextAccounts] = useState<Array<`0x${string}`>>(
    []
  );
  const [walletConnected, setWalletConnected] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<`0x${string}` | null>(
    null
  );
  const [account] = accounts ?? [];
  const [contextAccount] = contextAccounts ?? [];
  const publicTestnetClient = createPublicClient({
    chain: luksoTestnet,
    transport: http(),
  });

  useEffect(() => {
    if(contextAccounts.length) {
      const profileAddress = contextAccounts[0];
      publicTestnetClient.getCode({
        address: profileAddress,
      }).then((code ) => {
        setProfileChainId(code === undefined ? 42 : 4201);
      })
    }
  }, [contextAccounts]);

  const client = useMemo(() => {
    if (provider && chainId) {
      return createWalletClient({
        chain: chainId === 42 ? lukso : luksoTestnet,
        transport: custom(provider),
      });
    }
    return null;
  }, [provider, chainId]);

  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: profileChainId === 42 ? lukso : luksoTestnet,
      transport: http(),
    });
  }, [profileChainId]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        if (!client || !provider) return;

        const _accounts = (await provider.request(
          "eth_accounts",
          []
        )) as Array<`0x${string}`>;
        if (!mounted) return;
        setAccounts(_accounts);

        const _chainId = parseInt((await provider.request("eth_chainId")));
        if (!mounted || _chainId === 0) return;
        setChainId(_chainId);

        const _contextAccounts = provider.contextAccounts;
        if (!mounted) return;
        setContextAccounts(_contextAccounts);
        setWalletConnected(_accounts[0] != null && _contextAccounts[0] != null);
      } catch (error) {
        console.error(error);
      }
    }

    init();

    if (provider) {
      const accountsChanged = (_accounts: Array<`0x${string}`>) => {
        setAccounts(_accounts);
        setWalletConnected(_accounts[0] != null && contextAccount != null);
      };

      const contextAccountsChanged = (_accounts: Array<`0x${string}`>) => {
        setContextAccounts(_accounts);
        setWalletConnected(account != null && _accounts[0] != null);
      };

      const chainChanged = (_chainId: number) => {
        console.log(`Chain changed from ${chainId} to ${_chainId}`);
        setChainId(_chainId);
      };

      provider.on("accountsChanged", accountsChanged);
      provider.on("chainChanged", chainChanged);
      provider.on("contextAccountsChanged", contextAccountsChanged);

      return () => {
        mounted = false;
        provider.removeListener("accountsChanged", accountsChanged);
        provider.removeListener(
          "contextAccountsChanged",
          contextAccountsChanged
        );
        provider.removeListener("chainChanged", chainChanged);
      };
    }
    // If you want to be responsive to account changes
    // you also need to look at the first account rather
    // then the length or the whole array. Unfortunately react doesn't properly
    // look at array values like vue or knockout.
  }, [client, account, contextAccount]);

  // There has to be a useMemo to make sure the context object doesn't change on every
  // render.
  const data = useMemo(() => {
    return {
      provider,
      client,
      publicClient,
      chainId,
      profileChainId,
      accounts,
      contextAccounts,
      walletConnected,
      selectedAddress,
      setSelectedAddress,
    };
  }, [
    client,
    publicClient,
    chainId,
    profileChainId,
    accounts,
    contextAccounts,
    walletConnected,
    selectedAddress,
  ]);
  return (
    <UpContext.Provider value={data}>
      <div className="min-h-screen flex items-center justify-center">
        {children}
      </div>
    </UpContext.Provider>
  );
}
