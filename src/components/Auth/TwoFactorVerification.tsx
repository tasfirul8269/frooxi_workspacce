import React, { useState } from 'react';
import { Shield, ArrowLeft, AlertCircle } from 'lucide-react';

interface TwoFactorVerificationProps {
  email: string;
  onBack: () => void;
  onSuccess: (token: string, user: any, organization?: any) => void;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({ 
  email, 
  onBack, 
  onSuccess 
}) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);

  const API_URL = '/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Please enter a code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/users/2fa/verify-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, token })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('frooxi_token', data.token);
        onSuccess(data.token, data.user, data.organization);
      } else {
        setError(data.message || 'Invalid code');
      }
    } catch (err) {
      setError('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="mx-auto h-12 w-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Two-Factor Authentication
        </h2>
        <p className="text-sm text-gray-400">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="token" className="block text-sm font-medium text-gray-300 mb-2">
          {isBackupCode ? 'Backup Code' : 'Authentication Code'}
        </label>
        <input
          id="token"
          name="token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, isBackupCode ? 8 : 6))}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg tracking-widest"
          placeholder={isBackupCode ? "BACKUP" : "000000"}
          maxLength={isBackupCode ? 8 : 6}
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsBackupCode(!isBackupCode)}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          {isBackupCode ? 'Use authenticator code' : 'Use backup code'}
        </button>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          type="submit"
          disabled={loading || !token}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          {isBackupCode 
            ? 'Enter one of your 8-character backup codes'
            : 'Enter the 6-digit code from your authenticator app'
          }
        </p>
      </div>
    </form>
  );
};

export default TwoFactorVerification; 