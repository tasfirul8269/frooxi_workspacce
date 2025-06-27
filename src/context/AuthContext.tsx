import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization } from '../types';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  login: (email: string, password: string) => Promise<{ success: boolean; redirectTo?: string }>;
  signup: (userData: { name: string; email: string; password: string; organizationName: string }) => Promise<{ success: boolean; redirectTo?: string }>;
  logout: () => void;
  updateProfile: (profile: { name?: string; email?: string; avatar?: string }) => Promise<{ success: boolean }>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('frooxi_user');
    const savedOrg = localStorage.getItem('frooxi_organization');
    const token = localStorage.getItem('frooxi_token');
    if (savedUser && token) {
      const userDataRaw = JSON.parse(savedUser);
      const userData = { ...userDataRaw, id: userDataRaw.id || userDataRaw._id };
      setUser(userData);
      if (savedOrg && userData.role !== 'super_admin') {
        const orgDataRaw = JSON.parse(savedOrg);
        const orgData = { ...orgDataRaw, id: orgDataRaw.id || orgDataRaw._id };
        setOrganization(orgData);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return null;
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; redirectTo?: string }> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false };
      const userData = { ...data.user, id: data.user._id };
      setUser(userData);
      localStorage.setItem('frooxi_user', JSON.stringify(userData));
      if (data.organization) {
        const orgData = { ...data.organization, id: data.organization._id };
        setOrganization(orgData);
        localStorage.setItem('frooxi_organization', JSON.stringify(orgData));
      }
      localStorage.setItem('frooxi_token', data.token);
      if (data.user.role === 'super_admin') {
        return { success: true, redirectTo: '/super-admin' };
      } else if (data.organization) {
        return { success: true, redirectTo: `/${data.organization.slug}` };
      }
      return { success: true };
    } catch (err) {
    return { success: false };
    }
  };

  const signup = async (userData: { name: string; email: string; password: string; organizationName: string }): Promise<{ success: boolean; redirectTo?: string }> => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false };
      const userObj = { ...data.user, id: data.user._id };
      setUser(userObj);
      const orgObj = { ...data.organization, id: data.organization._id };
      setOrganization(orgObj);
      localStorage.setItem('frooxi_user', JSON.stringify(userObj));
      localStorage.setItem('frooxi_organization', JSON.stringify(orgObj));
      localStorage.setItem('frooxi_token', data.token);
      return { success: true, redirectTo: `/${data.organization.slug}` };
    } catch (err) {
      return { success: false };
    }
  };

  const logout = () => {
    setUser(null);
    setOrganization(null);
    localStorage.removeItem('frooxi_user');
    localStorage.removeItem('frooxi_organization');
    localStorage.removeItem('frooxi_token');
  };

  const updateProfile = async (profile: { name?: string; email?: string; avatar?: string }): Promise<{ success: boolean }> => {
    const token = localStorage.getItem('frooxi_token');
    if (!token) return { success: false };
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) return { success: false };
      setUser(data.user);
      localStorage.setItem('frooxi_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      organization,
      login,
      signup,
      logout,
      updateProfile,
      isAuthenticated: !!user,
      isSuperAdmin: user?.role === 'super_admin',
      isOrgAdmin: user?.role === 'admin',
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};