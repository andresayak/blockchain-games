import { Provider } from "react-redux";
import store from "./redux/store";
import Routes from "./routes/Routes";
import { ToastContainer } from "react-toastify";
import { BSC, BSCTestnet, Config, DAppProvider, Hardhat } from "@usedapp/core";
import { MetamaskConnector, CoinbaseWalletConnector } from "@usedapp/core";

export const allowNetworks: { [k: number]: string } = {
  [BSC.chainId]: process.env.BSCMAINNET_PROVIDER_URL ?? "https://bsc-dataseed.binance.org/",
  [BSCTestnet.chainId]: process.env.BSCTESTNET_PROVIDER_URL ?? "https://data-seed-prebsc-1-s1.binance.org:8545/",
  [Hardhat.chainId]: "http://localhost:8545/",
};
console.log('allowNetworks', allowNetworks);
export const tokenLists: { [k: number]: string } = {
  [BSC.chainId]: "https://tokens.coingecko.com/binance-smart-chain/all.json",
  [BSCTestnet.chainId]: "",
  [Hardhat.chainId]: "",
};
export const dappConfig: Config = {
  readOnlyChainId: Hardhat.chainId,
  readOnlyUrls: allowNetworks,
  connectors: {
    metamask: new MetamaskConnector(),
    coinbase: new CoinbaseWalletConnector(),
  },
  networks: [Hardhat, BSC, BSCTestnet],
};

export function App() {
  return (
    <Provider store={store}>
      <DAppProvider config={dappConfig}>
        <Routes />
        <ToastContainer />
      </DAppProvider>
    </Provider>
  );
}

export default App;
