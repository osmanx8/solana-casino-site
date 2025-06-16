import React from 'react';
// import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Header } from './Component/Header';
import { Body } from './Component/Coinflip/Body';
import { JackPot } from './Component/Coinflip/JackPot';
import { JackPotComingSoon, HistoryComingSoon } from './Component/coming/ComingSoon';
import { WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import "@solana/wallet-adapter-react-ui/styles.css";
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { clusterApiUrl } from '@solana/web3.js';
import { ToastContainer } from 'react-toastify';
import { WebSocketProvider } from './Context/WebSocketProvider';
import { ReactEffectPrivder } from './Context/ReactEffectProvider';
import { RPC } from "./config/constant";

function App() {
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ReactEffectPrivder>
            <WebSocketProvider>
              <ToastContainer />
              <BrowserRouter>
                <div className="App Inter h-full md:h-screen hide_scrollbar">
                  <Header />
                  <Routes>
                    <Route path='/' element={<Body />} />
                    <Route path='/jackpot' element={<JackPot />} />
                    <Route path='/jackpotcomingsoon' element={<JackPotComingSoon />} />
                    <Route path='/historycomingsoon' element={<HistoryComingSoon />} />
                  </Routes>
                </div>
              </BrowserRouter>
            </WebSocketProvider>
          </ReactEffectPrivder>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
