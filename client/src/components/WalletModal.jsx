import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  ArrowRightLeft, 
  ShieldCheck, 
  AlertTriangle,
  Coins,
  RefreshCw
} from 'lucide-react';

export const WalletModal = () => {
  const {
    walletConnected,
    walletAddress,
    fullWalletAddress,
    networkName,
    isSepolia,
    walletBalance,
    isConnecting,
    connectMetaMask,
    switchToSepolia,
    disconnectWallet,
    isWalletModalOpen,
    setIsWalletModalOpen,
    isMetaMaskInstalled,
    showToast
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);

  if (!isWalletModalOpen) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchNetwork = async () => {
    setSwitchingNetwork(true);
    try {
      await switchToSepolia();
    } finally {
      setSwitchingNetwork(false);
    }
  };

  const ESCROW_CONTRACT = '0x71C849203649E7c28dF29A44eB5B6E94191698B2';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {walletConnected ? 'Web3 Wallet Connected' : 'Connect Web3 Wallet'}
              </h3>
              <p className="text-xs text-slate-400">
                Sepolia Testnet • Autonomous Smart Contract Escrow
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWalletModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          
          {walletConnected ? (
            <>
              {/* Account Address Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  <span>Connected Account</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-900 font-semibold break-all bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <span className="truncate">{fullWalletAddress || walletAddress}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopy(fullWalletAddress || walletAddress)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                      title="Copy Address"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {fullWalletAddress && (
                      <a
                        href={`https://sepolia.etherscan.io/address/${fullWalletAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition"
                        title="View on Sepolia Etherscan"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Network Status Box */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${
                isSepolia 
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' 
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Network
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSepolia ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isSepolia ? 'Sepolia Testnet' : 'Network Mismatch'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between font-semibold">
                  <span>{networkName}</span>
                  {!isSepolia && (
                    <button
                      onClick={handleSwitchNetwork}
                      disabled={switchingNetwork}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>{switchingNetwork ? 'Switching...' : 'Switch to Sepolia'}</span>
                    </button>
                  )}
                </div>

                {!isSepolia && (
                  <p className="text-[11px] text-amber-800 flex items-start gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>Please switch to Sepolia Testnet to interact with AgriChain smart contracts.</span>
                  </p>
                )}
              </div>

              {/* Balance Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                    Wallet Balance
                  </span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 block">
                    {walletBalance}
                  </span>
                </div>
                <a
                  href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition shadow-sm text-[11px]"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>Get Free Sepolia ETH ↗</span>
                </a>
              </div>

              {/* Target Smart Contract */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Platform Escrow Contract
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                    Solidity 0.8.20
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-300 flex items-center justify-between">
                  <span className="truncate">{ESCROW_CONTRACT}</span>
                  <a
                    href={`https://sepolia.etherscan.io/address/${ESCROW_CONTRACT}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 hover:text-emerald-400 transition ml-2"
                    title="View Escrow on Etherscan"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={disconnectWallet}
                  className="flex-1 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 transition"
                >
                  Disconnect Wallet
                </button>
                <button
                  onClick={() => setIsWalletModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Not Connected State */}
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
                  <Wallet className="w-8 h-8" />
                </div>
                
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Connect MetaMask Wallet
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Connect your Web3 browser extension to sign international trade contracts and lock funds in autonomous blockchain escrow.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-1 text-emerald-950">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Sepolia Ethereum Testnet Ready
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    The platform operates on Sepolia Testnet. All transactions use free testnet ETH with zero real financial risk.
                  </p>
                </div>

                <button
                  onClick={connectMetaMask}
                  disabled={isConnecting}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isConnecting ? 'Waiting for MetaMask Approval...' : 'Connect with MetaMask'}</span>
                </button>

                {isConnecting && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    A MetaMask notification window is open. Please open your MetaMask extension to approve the connection.
                  </p>
                )}

                {!isMetaMaskInstalled && (
                  <p className="text-[11px] text-slate-400">
                    Don't have MetaMask?{' '}
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-600 font-bold hover:underline"
                    >
                      Install MetaMask Extension ↗
                    </a>
                  </p>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
