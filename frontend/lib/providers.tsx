"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

const evmNetworks = [
  {
    blockExplorerUrls: ["https://etherscan.io/"],
    chainId: 1,
    chainName: "Ethereum Mainnet",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
    name: "Ethereum",
    nativeCurrency: {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
      iconUrl: "https://app.dynamic.xyz/assets/networks/eth.svg",
    },
    networkId: 1,

    rpcUrls: ["https://mainnet.infura.io/v3/"],
    vanityName: "ETH Mainnet",
  },
  {
    blockExplorerUrls: ["https://etherscan.io/"],
    chainId: 11155111,
    chainName: "Ethereum Sepolia",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
    name: "Ethereum",
    nativeCurrency: {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
      iconUrl: "https://app.dynamic.xyz/assets/networks/eth.svg",
    },
    networkId: 5,
    rpcUrls: ["wss://sepolia.drpc.org	"],
    vanityName: "Sepolia",
  }
];

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      theme="auto"
      settings={{
        environmentId: "03678269-874d-4eee-a385-80bf7decd36b",
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
