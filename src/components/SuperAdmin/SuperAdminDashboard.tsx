import React, { useState } from 'react';
import { 
  Building, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Search,
  Filter,
  Plus,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  Calendar,
  BarChart3,
  LogOut,
  Settings,
  User
} from 'lucide-react';
import { Organization, SuperAdminStats } from '../../types';
import { useAuth } from '../../context/AuthContext';

const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'users' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for super admin
  const stats: SuperAdminStats = {
    totalOrganizations: 156,
    activeOrganizations: 142,
    totalUsers: 2847,
    totalRevenue: 45670,
    monthlyGrowth: 12.5,
    planDistribution: {
      free: 89,
      pro: 52,
      enterprise: 15,
    },
  };

  const organizations: Organization[] = [
    {
      id: '1',
      name: 'TechCorp Solutions',
      slug: 'techcorp',
      plan: 'pro',
      status: 'active',
      adminId: '2',
      settings: {
        allowEmployeeRegistration: true,
        maxUsers: 50,
        features: ['tasks', 'chat', 'meetings', 'analytics'],
      },
      billing: {
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'StartupXYZ',
      slug: 'startupxyz',
      plan: 'free',
      status: 'trial',
      adminId: '4',
      settings: {
        allowEmployeeRegistration: false,
        maxUsers: 10,
        features: ['tasks', 'chat'],
      },
      billing: {
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'InnovateLab',
      slug: 'innovatelab',
      plan: 'enterprise',
      status: 'active',
      adminId: '5',
      settings: {
        allowEmployeeRegistration: true,
        maxUsers: 200,
        features: ['tasks', 'chat', 'meetings', 'analytics', 'api', 'sso'],
      },
      billing: {
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      createdAt: new Date('2023-12-10'),
      updatedAt: new Date(),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-400/10';
      case 'trial':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'suspended':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free':
        return 'text-gray-400 bg-gray-400/10';
      case 'pro':
        return 'text-blue-400 bg-blue-400/10';
      case 'enterprise':
        return 'text-purple-400 bg-purple-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-gray-400">Manage all organizations and platform analytics</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* User Profile Section */}
            <div className="flex items-center space-x-3 bg-gray-800 rounded-lg p-3">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-purple-400">Super Admin</p>
              </div>
            </div>

            {/* Action Buttons */}
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
            
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Create Organization</span>
            </button>
          </div>
        </div>

        {/* Platform Info Banner */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Frooxi Workspace Platform Control</h2>
              <p className="text-purple-200">
                Monitor and manage all organizations, users, and platform performance from this central dashboard.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center">
                <Activity className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'organizations', label: 'Organizations', icon: Building },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-green-400 text-sm font-medium">+{stats.monthlyGrowth}%</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{stats.totalOrganizations}</h3>
                  <p className="text-gray-400 text-sm">Total Organizations</p>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-green-400 text-sm font-medium">91%</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{stats.activeOrganizations}</h3>
                  <p className="text-gray-400 text-sm">Active Organizations</p>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-green-400 text-sm font-medium">+15%</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{stats.totalUsers.toLocaleString()}</h3>
                  <p className="text-gray-400 text-sm">Total Users</p>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-green-400 text-sm font-medium">+23%</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">${stats.totalRevenue.toLocaleString()}</h3>
                  <p className="text-gray-400 text-sm">Monthly Revenue</p>
                </div>
              </div>
            </div>

            {/* Plan Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Plan Distribution</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-gray-300">Free Plan</span>
                    </div>
                    <span className="text-white font-semibold">{stats.planDistribution.free}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-300">Pro Plan</span>
                    </div>
                    <span className="text-white font-semibold">{stats.planDistribution.pro}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-300">Enterprise Plan</span>
                    </div>
                    <span className="text-white font-semibold">{stats.planDistribution.enterprise}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { action: 'New organization created', org: 'TechStartup Inc.', time: '2 hours ago' },
                    { action: 'Plan upgraded', org: 'DesignCorp', time: '4 hours ago' },
                    { action: 'User limit reached', org: 'SmallBiz LLC', time: '6 hours ago' },
                    { action: 'Trial expired', org: 'TestCompany', time: '1 day ago' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-white text-sm">
                          <span className="font-medium">{activity.action}</span>{' '}
                          <span className="text-purple-400">"{activity.org}"</span>
                        </p>
                        <p className="text-gray-500 text-xs">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'organizations' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full"
                />
              </div>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>

            {/* Organizations Table */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredOrganizations.map((org) => (
                      <tr key={org.id} className="hover:bg-gray-700/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                              <Building className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{org.name}</div>
                              <div className="text-sm text-gray-400">/{org.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(org.plan)}`}>
                            {org.plan.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(org.status)}`}>
                            {org.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {org.createdAt.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-purple-400 hover:text-purple-300 p-1">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-yellow-400 hover:text-yellow-300 p-1">
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                            <button className="text-red-400 hover:text-red-300 p-1">
                              <Ban className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">User Management</h3>
            <p className="text-gray-400">User management features coming soon...</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Advanced Analytics</h3>
            <p className="text-gray-400">Advanced analytics dashboard coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;