import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, AlertCircle } from 'lucide-react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TwoFactorStatus {
  enabled: boolean;
  hasSecret: boolean;
  hasBackupCodes: boolean;
}

const TwoFactorModal: React.FC<TwoFactorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'success' | 'disable'>('status');
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<string>('');

  const API_URL = '/api';

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('frooxi_token');
      console.log('API_URL:', API_URL);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_URL}/users/2fa/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('2FA status data:', data);
        setStatus(data);
        if (data.enabled) {
          setStep('status');
        } else {
          setStep('setup');
        }
      } else {
        const errorText = await response.text();
        console.error('2FA status error response:', errorText);
        console.error('Response status:', response.status);
      }
    } catch (err: any) {
      console.error('Failed to fetch 2FA status:', err);
      console.error('Full error details:', {
        message: err.message,
        stack: err.stack,
        API_URL,
        token: localStorage.getItem('frooxi_token') ? 'Present' : 'Missing'
      });
    }
  };

  const setup2FA = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('frooxi_token');
      const response = await fetch(`${API_URL}/users/2fa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setBackupCodes(data.backupCodes);
        setStep('verify');
      } else {
        const error = await response.json();
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    if (!token) {
      setError('Please enter a token');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const authToken = localStorage.getItem('frooxi_token');
      const response = await fetch(`${API_URL}/users/2fa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.backupCodes);
        setStep('success');
        onSuccess();
      } else {
        const error = await response.json();
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to verify token');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!token) {
      setError('Please enter a token');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const authToken = localStorage.getItem('frooxi_token');
      const response = await fetch(`${API_URL}/users/2fa/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      
      if (response.ok) {
        setStep('status');
        fetchStatus();
        onSuccess();
      } else {
        const error = await response.json();
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'frooxi-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Two-Factor Authentication</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {step === 'status' && status && (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                status.enabled ? 'bg-green-500/20' : 'bg-gray-500/20'
              }`}>
                <Check className={`w-8 h-8 ${status.enabled ? 'text-green-400' : 'text-gray-400'}`} />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {status.enabled ? '2FA is Enabled' : '2FA is Disabled'}
              </h3>
              <p className="text-gray-400 text-sm">
                {status.enabled 
                  ? 'Your account is protected with two-factor authentication.'
                  : 'Add an extra layer of security to your account.'
                }
              </p>
            </div>
            
            <div className="flex space-x-3">
              {status.enabled ? (
                <button
                  onClick={() => setStep('disable')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Disable 2FA
                </button>
              ) : (
                <button
                  onClick={setup2FA}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : 'Enable 2FA'}
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-white mb-2">Setup 2FA</h3>
              <p className="text-gray-400 text-sm">
                Scan the QR code with your authenticator app to get started.
              </p>
            </div>
            
            <button
              onClick={setup2FA}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Generate QR Code'}
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-white mb-2">Scan QR Code</h3>
              <p className="text-gray-400 text-sm mb-4">
                Use an authenticator app like Google Authenticator or Authy to scan this QR code.
              </p>
              
              {qrCode && (
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              )}
              
              <div className="bg-gray-700 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-400 mb-1">Manual Entry Code:</p>
                <div className="flex items-center space-x-2">
                  <code className="text-white text-sm font-mono bg-gray-800 px-2 py-1 rounded">
                    {secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(secret, 'secret')}
                    className="text-gray-400 hover:text-white"
                  >
                    {copied === 'secret' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter 6-digit code from your app
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg tracking-widest"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            
            <button
              onClick={verify2FA}
              disabled={loading || token.length !== 6}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">2FA Enabled Successfully!</h3>
              <p className="text-gray-400 text-sm mb-4">
                Your account is now protected with two-factor authentication.
              </p>
            </div>
            
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="text-yellow-400 font-medium mb-2">Backup Codes</h4>
              <p className="text-yellow-300 text-sm mb-3">
                Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                {backupCodes.map((code, index) => (
                  <code key={index} className="text-yellow-300 text-sm font-mono bg-gray-800 px-2 py-1 rounded text-center">
                    {code}
                  </code>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={downloadBackupCodes}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                >
                  {copied === 'backup' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {step === 'disable' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Disable 2FA</h3>
              <p className="text-gray-400 text-sm mb-4">
                Enter a code from your authenticator app to disable two-factor authentication.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter 6-digit code
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg tracking-widest"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setStep('status')}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={disable2FA}
                disabled={loading || token.length !== 6}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorModal; 