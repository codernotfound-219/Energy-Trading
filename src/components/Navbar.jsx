import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

const Navbar = () => {
  const { account, connectWallet, disconnectWallet, loading } = useWeb3();
  const location = useLocation();

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getLinkClass = (path) => {
    const baseClass = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
    if (isActive(path)) {
      return `${baseClass} bg-energy-blue text-white`;
    }
    return `${baseClass} text-gray-700 hover:text-energy-blue hover:bg-gray-100`;
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-energy-blue">
              ⚡ P2P Energy Trading
            </Link>
            
            {account && (
              <div className="hidden md:flex space-x-2">
                <Link
                  to="/"
                  className={getLinkClass('/')}
                >
                  Marketplace
                </Link>
                <Link
                  to="/create-bus"
                  className={getLinkClass('/create-bus')}
                >
                  Create Bus
                </Link>
                <Link
                  to="/list-energy"
                  className={getLinkClass('/list-energy')}
                >
                  List Energy
                </Link>
                <Link
                  to="/my-listings"
                  className={getLinkClass('/my-listings')}
                >
                  My Listings
                </Link>
                <Link
                  to="/portfolio"
                  className={getLinkClass('/portfolio')}
                >
                  Portfolio
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {account ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Connected: <span className="font-mono">{formatAddress(account)}</span>
                </span>
                <button
                  onClick={disconnectWallet}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
