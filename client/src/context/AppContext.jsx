import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';
export const SEPOLIA_CONFIG = {
  chainId: SEPOLIA_CHAIN_ID_HEX,
  chainName: 'Sepolia Testnet',
  nativeCurrency: { name: 'Sepolia ETH', symbol: 'SEP', decimals: 18 },
  rpcUrls: ['https://rpc.sepolia.org', 'https://sepolia.gateway.tenderly.co'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
};

function formatAddress(addr) {
  if (!addr || addr.length < 10) return addr || '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function parseChainId(chainIdHex) {
  if (!chainIdHex) return { name: 'Unknown Network', isSepolia: false };
  const hex = String(chainIdHex).toLowerCase();
  if (hex === '0xaa36a7' || hex === '11155111') {
    return { name: 'Sepolia Testnet', isSepolia: true };
  }
  if (hex === '0x1') return { name: 'Ethereum Mainnet', isSepolia: false };
  if (hex === '0x7a69' || hex === '31337') return { name: 'Hardhat Localhost (31337)', isSepolia: false };
  if (hex === '0x89' || hex === '137') return { name: 'Polygon Mainnet', isSepolia: false };
  if (hex === '0x13882' || hex === '80002') return { name: 'Polygon Amoy Testnet', isSepolia: false };
  return { name: `EVM Chain (${chainIdHex})`, isSepolia: false };
}

export const AppProvider = ({ children }) => {
  // Current user and active role
  const [currentUser, setCurrentUser] = useState({
    id: 'u-farmer-1',
    name: 'Ramesh Patel',
    role: 'Farmer',
    location: 'Nashik, Maharashtra, India',
    email: 'farmer@agrichain.com',
    walletAddress: '0x4a18Bc2D73eF41B92E8C581a8bDb5213f0449e7a',
    crops: ['Onions', 'Grapes', 'Pomegranate']
  });

  const [activeTab, setActiveTab] = useState('marketplace'); // marketplace, group-selling, quotations, orders-blockchain, shipment, dashboards, ledger
  const [products, setProducts] = useState([]);
  const [groupPools, setGroupPools] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [blockchainLedger, setBlockchainLedger] = useState({ chain: [], totalBlocks: 0 });
  const [loading, setLoading] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isProjectDocsOpen, setIsProjectDocsOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Web3 & MetaMask State
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('0x4a18...9e7a');
  const [fullWalletAddress, setFullWalletAddress] = useState('');
  const [networkName, setNetworkName] = useState('Sepolia Testnet');
  const [chainId, setChainId] = useState(SEPOLIA_CHAIN_ID_HEX);
  const [isSepolia, setIsSepolia] = useState(true);
  const [walletBalance, setWalletBalance] = useState('0.0000 SEP');
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Helper to fetch live balance from MetaMask
  const updateWalletBalance = async (address) => {
    if (typeof window === 'undefined' || !window.ethereum || !address) return;
    try {
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      const balanceWei = BigInt(balanceHex);
      const ethVal = (Number(balanceWei) / 1e18).toFixed(4);
      setWalletBalance(`${ethVal} SEP`);
    } catch (e) {
      console.warn('Could not fetch wallet balance:', e);
    }
  };

  // Switch MetaMask to Sepolia Testnet
  const switchToSepolia = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      showToast('MetaMask not detected', 'error');
      return false;
    }
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
      });
      setIsSepolia(true);
      setNetworkName('Sepolia Testnet');
      showToast('Switched to Sepolia Testnet!');
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_CONFIG]
          });
          setIsSepolia(true);
          setNetworkName('Sepolia Testnet');
          showToast('Sepolia Testnet added and active!');
          return true;
        } catch (addError) {
          showToast('Failed to add Sepolia to MetaMask', 'error');
          return false;
        }
      }
      showToast('Network switch rejected in MetaMask', 'error');
      return false;
    }
  };

  // Connect MetaMask
  const connectMetaMask = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      showToast('MetaMask extension not found! Install it from metamask.io or use demo mode.', 'error');
      setIsWalletModalOpen(true);
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        const primary = accounts[0];
        setFullWalletAddress(primary);
        setWalletAddress(formatAddress(primary));
        setWalletConnected(true);

        const currentChain = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(currentChain);
        const { name, isSepolia: chainIsSepolia } = parseChainId(currentChain);
        setNetworkName(name);
        setIsSepolia(chainIsSepolia);

        await updateWalletBalance(primary);
        setCurrentUser(prev => ({ ...prev, walletAddress: primary }));

        if (!chainIsSepolia) {
          showToast(`Connected ${formatAddress(primary)}. Please switch to Sepolia Testnet!`, 'info');
          await switchToSepolia();
        } else {
          showToast(`Connected MetaMask: ${formatAddress(primary)} on Sepolia Testnet!`);
        }
      }
    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        showToast('MetaMask connection request rejected by user', 'error');
      } else {
        showToast('MetaMask error: ' + (err.message || 'Connection failed'), 'error');
      }
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletConnected(false);
    setFullWalletAddress('');
    setWalletAddress('0x4a18...9e7a');
    setWalletBalance('0.0000 SEP');
    showToast('MetaMask wallet disconnected', 'info');
  };

  // Sign trade agreement order with MetaMask private key (0 Gas)
  const signTradeAgreementOrder = async (tradeDetails) => {
    if (!window.ethereum || !fullWalletAddress) {
      throw new Error('MetaMask is not connected');
    }
    const message = [
      '🌾 AGRICHAIN GLOBAL - OFFICIAL TRADE AGREEMENT 🌾',
      `Order Reference: ${tradeDetails.orderId || 'PENDING'}`,
      `Commodity: ${tradeDetails.productName}`,
      `Quantity: ${tradeDetails.quantityTons} Metric Tons`,
      `Total Value: ₹${tradeDetails.totalAmount?.toLocaleString()} ($${tradeDetails.totalAmountUsd?.toLocaleString()} USD)`,
      `Terms: ${tradeDetails.paymentTerms || 'Smart Contract Escrow'}`,
      `Destination Port: ${tradeDetails.destinationPort || 'International Port'}`,
      `Signer Address: ${fullWalletAddress}`,
      `Escrow Contract: 0x71C849203649E7c28dF29A44eB5B6E94191698B2`,
      `Network: Sepolia Testnet (Chain ID 11155111)`,
      `Timestamp: ${new Date().toISOString()}`,
      '',
      'By signing, you authorize locking export funds into autonomous smart contract escrow.'
    ].join('\n');

    const msgHex = '0x' + Array.from(new TextEncoder().encode(message))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [msgHex, fullWalletAddress]
    });

    return { signature, message };
  };

  // Send real testnet transaction to Escrow address
  const depositEscrowWithMetaMask = async (amountInEth = '0.0005') => {
    if (!window.ethereum || !fullWalletAddress) {
      throw new Error('MetaMask is not connected');
    }
    const weiVal = BigInt(Math.floor(parseFloat(amountInEth) * 1e18)).toString(16);
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: fullWalletAddress,
        to: '0x71C849203649E7c28dF29A44eB5B6E94191698B2',
        value: '0x' + weiVal
      }]
    });
    return txHash;
  };

  // Auto-detect MetaMask on mount & register listeners
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setIsMetaMaskInstalled(true);

      // Check if user already authorized this dApp
      window.ethereum.request({ method: 'eth_accounts' })
        .then(async (accounts) => {
          if (accounts && accounts.length > 0) {
            const primary = accounts[0];
            setFullWalletAddress(primary);
            setWalletAddress(formatAddress(primary));
            setWalletConnected(true);

            const currentChain = await window.ethereum.request({ method: 'eth_chainId' });
            setChainId(currentChain);
            const { name, isSepolia: chainIsSepolia } = parseChainId(currentChain);
            setNetworkName(name);
            setIsSepolia(chainIsSepolia);

            updateWalletBalance(primary);
            setCurrentUser(prev => ({ ...prev, walletAddress: primary }));
          }
        })
        .catch(console.warn);

      const handleAccountsChanged = (accounts) => {
        if (!accounts || accounts.length === 0) {
          setWalletConnected(false);
          setFullWalletAddress('');
          setWalletAddress('0x4a18...9e7a');
          showToast('MetaMask account disconnected', 'info');
        } else {
          const primary = accounts[0];
          setFullWalletAddress(primary);
          setWalletAddress(formatAddress(primary));
          setWalletConnected(true);
          updateWalletBalance(primary);
          setCurrentUser(prev => ({ ...prev, walletAddress: primary }));
          showToast(`Active account: ${formatAddress(primary)}`);
        }
      };

      const handleChainChanged = (newChainId) => {
        setChainId(newChainId);
        const { name, isSepolia: chainIsSepolia } = parseChainId(newChainId);
        setNetworkName(name);
        setIsSepolia(chainIsSepolia);
        if (fullWalletAddress) updateWalletBalance(fullWalletAddress);
        showToast(`MetaMask switched to ${name}`);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [fullWalletAddress]);

  // Switch demo persona
  const switchDemoRole = (roleName) => {
    if (roleName === 'Farmer') {
      setCurrentUser({
        id: 'u-farmer-1',
        name: 'Ramesh Patel',
        role: 'Farmer',
        location: 'Nashik, Maharashtra, India',
        email: 'farmer@agrichain.com',
        walletAddress: fullWalletAddress || '0x4a18Bc2D73eF41B92E8C581a8bDb5213f0449e7a',
        crops: ['Onions', 'Grapes', 'Pomegranate']
      });
      if (!walletConnected) setWalletAddress('0x4a18...9e7a');
    } else if (roleName === 'Buyer') {
      setCurrentUser({
        id: 'u-buyer-1',
        name: 'Global Agro Traders LLC',
        role: 'Buyer',
        location: 'Dubai, UAE',
        email: 'buyer@agrichain.com',
        walletAddress: fullWalletAddress || '0x3aB9820cDeF8849c951042Ba7C69842F512803Ef',
        businessType: 'Wholesale Distributor'
      });
      if (!walletConnected) setWalletAddress('0x3aB9...03Ef');
    } else if (roleName === 'Exporter') {
      setCurrentUser({
        id: 'u-exporter-1',
        name: 'OceanGate Logistics & Cargo',
        role: 'Exporter',
        location: 'Mumbai, India (JNPT)',
        email: 'exporter@agrichain.com',
        walletAddress: fullWalletAddress || '0x7890B2b7F38a8eA52968B42b1029c78D51203AbC',
        iecCode: 'IEC0392817492'
      });
      if (!walletConnected) setWalletAddress('0x7890...3AbC');
    } else if (roleName === 'Importer') {
      setCurrentUser({
        id: 'u-importer-1',
        name: 'GulfFresh Importers & ColdChain',
        role: 'Importer',
        location: 'Doha, Qatar',
        email: 'importer@agrichain.com',
        walletAddress: fullWalletAddress || '0x9812A9cB48De827103819A21b02938Ac591B2e41',
        destinationPort: 'Hamad Port, Doha'
      });
      if (!walletConnected) setWalletAddress('0x9812...2e41');
    }
    showToast(`Switched active persona to ${roleName}`);
  };

  // Fetch all initial data
  const refreshData = async () => {
    try {
      setLoading(true);
      const [resProd, resPools, resQuots, resOrders, resShip, resLedger] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/group-pools').then(r => r.json()),
        fetch('/api/quotations').then(r => r.json()),
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/shipments').then(r => r.json()),
        fetch('/api/blockchain/ledger').then(r => r.json())
      ]);

      setProducts(resProd);
      setGroupPools(resPools);
      setQuotations(resQuots);
      setOrders(resOrders);
      setShipments(resShip);
      setBlockchainLedger(resLedger);
    } catch (err) {
      console.warn('API fetch error, using client fallback', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchDemoRole,
        activeTab,
        setActiveTab,
        products,
        setProducts,
        groupPools,
        setGroupPools,
        quotations,
        setQuotations,
        orders,
        setOrders,
        shipments,
        setShipments,
        blockchainLedger,
        refreshData,
        walletConnected,
        walletAddress,
        fullWalletAddress,
        networkName,
        chainId,
        isSepolia,
        walletBalance,
        isMetaMaskInstalled,
        isWalletModalOpen,
        setIsWalletModalOpen,
        connectMetaMask,
        switchToSepolia,
        disconnectWallet,
        signTradeAgreementOrder,
        depositEscrowWithMetaMask,
        isAuthOpen,
        setIsAuthOpen,
        isAddProductOpen,
        setIsAddProductOpen,
        isProjectDocsOpen,
        setIsProjectDocsOpen,
        toast,
        showToast,
        loading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
