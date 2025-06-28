import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import TwoFactorVerification from './TwoFactorVerification';

interface LoginFormProps {
  onToggleForm: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const { login, complete2FALogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        if (result.redirectTo) {
          navigate(result.redirectTo, { replace: true });
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err: any) {
      if (err.requires2FA) {
        setRequires2FA(true);
        setTwoFactorEmail(err.email);
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = async (token: string, user: any, organization?: any) => {
    try {
      const result = await complete2FALogin(token, user, organization);
      if (result.success) {
        // Determine redirect based on user role and organization
        if (user.role === 'super_admin') {
          navigate('/super-admin', { replace: true });
        } else if (organization && organization.slug) {
          navigate(`/${organization.slug}`, { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError('Failed to complete login');
      }
    } catch (err) {
      setError('Failed to complete login');
    }
  };

  const handle2FABack = () => {
    setRequires2FA(false);
    setTwoFactorEmail('');
  };

  if (requires2FA) {
    return (
      <TwoFactorVerification
        email={twoFactorEmail}
        onBack={handle2FABack}
        onSuccess={handle2FASuccess}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded-lg p-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            <span>Sign In</span>
          </>
        )}
      </button>

      <div className="text-center">
        <p className="text-gray-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onToggleForm}
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            Create organization
          </button>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;