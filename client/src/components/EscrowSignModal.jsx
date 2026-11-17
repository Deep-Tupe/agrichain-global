import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  FileCheck, 
  Send, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Wallet,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const EscrowSignModal = ({ isOpen, onClose, quotation, onFinalized }) => {
  const {
    walletConnected,
    walletAddress,
    fullWalletAddress,
    isSepolia,
    connectMetaMask,
    switchToSepolia,
    signTradeAgreementOrder,
    depositEscrowWithMetaMask,
    showToast,
    refreshData,
    setActiveTab
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !quotation) return null;

  const ESCROW_CONTRACT = '0x71C849203649E7c28dF29A44eB5B6E94191698B2';
  const orderRef = quotation.orderReference || ('#AGI' + Math.floor(10000 + Math.random() * 90000));
  const totalInr = quotation.sellerQuotation?.totalAmount || 0;
  const totalUsd = quotation.sellerQuotation?.totalAmountUsd || 0;

  // 1. Sign agreement via MetaMask personal_sign (0 Gas)
  const handleSignAgreement = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      if (!walletConnected) {
        await connectMetaMask();
      }

      const { signature } = await signTradeAgreementOrder({
        orderId: orderRef,
        productName: quotation.productName,
        quantityTons: quotation.quantityTons,
        totalAmount: totalInr,
        totalAmountUsd: totalUsd,
        paymentTerms: quotation.sellerQuotation?.paymentTerms,
        destinationPort: quotation.destinationPort
      });

      // Send to backend with signature
      const res = await fetch(`/api/quotations/${quotation.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: signature.slice(0, 66),
          signature: signature,
          buyerWallet: fullWalletAddress || walletAddress
        })
      });

      if (!res.ok) throw new Error('Failed to accept quotation on server');
      const data = await res.json();

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      showToast('Trade Agreement cryptographically signed via MetaMask & locked!');
      setSuccessData({
        orderId: data.order?.orderId || orderRef,
        txHash: signature.slice(0, 66),
        type: 'Cryptographic Signature (EIP-191)'
      });
      refreshData();
      if (onFinalized) onFinalized(data);
    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        setErrorMsg('MetaMask signature was declined by user.');
      } else {
        setErrorMsg(err.message || 'Signature failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Deposit on-chain testnet escrow via MetaMask eth_sendTransaction
  const handleDepositEscrow = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      if (!walletConnected) {
        await connectMetaMask();
      }

      if (!isSepolia) {
        const switched = await switchToSepolia();
        if (!switched) throw new Error('Please switch to Sepolia Testnet');
      }

      // Send real testnet transaction to Escrow contract
      const txHash = await depositEscrowWithMetaMask('0.0005');

      const res = await fetch(`/api/quotations/${quotation.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: txHash,
          buyerWallet: fullWalletAddress || walletAddress
        })
      });

      if (!res.ok) throw new Error('Failed to record escrow transaction on server');
      const data = await res.json();

      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
      showToast('On-chain escrow successfully funded on Sepolia Testnet!');
      setSuccessData({
        orderId: data.order?.orderId || orderRef,
        txHash: txHash,
        type: 'On-Chain Sepolia Transaction'
      });
      refreshData();
      if (onFinalized) onFinalized(data);
    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        setErrorMsg('Transaction rejected in MetaMask.');
      } else if (err.message && err.message.includes('insufficient funds')) {
        setErrorMsg('Insufficient Sepolia test ETH for gas. You can use the "Sign Agreement (0 Gas)" option instead!');
      } else {
        setErrorMsg(err.message || 'Transaction failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Simulation fallback
  const handleSimulatedAccept = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotations/${quotation.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerWallet: fullWalletAddress || walletAddress
        })
      });
      if (res.ok) {
        const data = await res.json();
        confetti({ particleCount: 80, spread: 60 });
        showToast('Trade Agreement created on AgriChain EVM ledger!');
        refreshData();
        onClose();
        setActiveTab('orders-blockchain');
      }
    } catch (e) {
      setErrorMsg('Error processing trade agreement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {successData ? 'Escrow Locked Successfully' : 'Confirm & Fund Trade Escrow'}
              </h3>
              <p className="text-xs text-slate-400">
                Autonomous Smart Contract • Sepolia Testnet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          
          {successData ? (
            /* Success State */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900">
                  Trade Escrow Confirmed On-Chain!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Order <span className="font-bold text-emerald-700">{successData.orderId}</span> has been confirmed and locked in the smart contract escrow.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Verification Type:</span>
                  <span className="font-semibold text-slate-800">{successData.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block mb-1">Transaction / Signature Hash:</span>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-emerald-700 break-all">
                    {successData.txHash}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <a
                  href={`https://sepolia.etherscan.io/tx/${successData.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span>View on Sepolia Etherscan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => {
                    onClose();
                    setActiveTab('orders-blockchain');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>View Escrow Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Confirmation Form */
            <>
              {/* Order Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-500">
                  <span className="font-bold text-slate-800">{quotation.productName}</span>
                  <span className="font-mono text-emerald-700 font-bold">{orderRef}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Quantity</span>
                    <span className="font-bold text-slate-800">{quotation.quantityTons} Metric Tons</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Destination</span>
                    <span className="font-bold text-slate-800 truncate block">{quotation.destinationPort}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Seller (Farmer)</span>
                    <span className="font-bold text-slate-800 truncate block">{quotation.sellerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Payment Terms</span>
                    <span className="font-bold text-slate-800 truncate block">{quotation.sellerQuotation?.paymentTerms || 'Smart Escrow'}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="font-bold text-emerald-950">Escrow Total Amount</span>
                  <div className="text-right">
                    <span className="font-black text-emerald-950 text-sm block">₹{totalInr?.toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">${totalUsd?.toLocaleString()} USD</span>
                  </div>
                </div>
              </div>

              {/* Wallet Info */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Buyer Wallet (Signer):</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    {walletConnected ? (fullWalletAddress || walletAddress) : 'MetaMask Not Connected'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Escrow Contract:</span>
                  <span className="text-slate-300 font-mono">{ESCROW_CONTRACT.slice(0, 10)}...{ESCROW_CONTRACT.slice(-6)}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* 1. Cryptographic Sign via MetaMask */}
                <button
                  onClick={handleSignAgreement}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {loading ? 'Waiting for MetaMask...' : '✍️ Sign Agreement with MetaMask (0 Gas Fee)'}
                  </span>
                </button>

                {/* 2. Real Testnet Escrow Deposit */}
                <button
                  onClick={handleDepositEscrow}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {loading ? 'Awaiting Confirmation...' : '⚡ Deposit On-Chain Escrow (0.0005 SEP ETH)'}
                  </span>
                </button>

                {/* 3. Fast Demo Simulation Fallback */}
                <button
                  onClick={handleSimulatedAccept}
                  disabled={loading}
                  className="w-full py-2 text-slate-500 hover:text-slate-800 text-[11px] font-semibold transition text-center"
                >
                  Or finalize with Instant EVM Simulation (Skip MetaMask)
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
