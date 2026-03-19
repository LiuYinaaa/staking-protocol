import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

const localAnvil = defineChain({
  id: 31_337,
  name: "Anvil",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_CHAIN_RPC_URL ?? "http://127.0.0.1:8545"] }
  }
});

export const wagmiConfig = createConfig({
  chains: [localAnvil],
  connectors: [injected()],
  transports: {
    [localAnvil.id]: http(import.meta.env.VITE_CHAIN_RPC_URL ?? "http://127.0.0.1:8545")
  }
});
