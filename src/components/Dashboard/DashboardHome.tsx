import React from 'react';
import { 
  CheckSquare, 
  Clock, 
  Users, 
  TrendingUp,
  Activity,
  Calendar,
  MessageSquare,
  Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const DashboardHome: React.FC = () => {
  const { tasks } = useApp();
  const { user } = useAuth();

  // Only allow admin or super_admin
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-gray-900 text-white p-8 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">You do not have permission to view the dashboard.</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
  };

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  const recentTasks = tasks.slice(0, 5);

  const quickStats = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: CheckSquare,
      color: 'bg-purple-600',
      trend: '+12%',
    },
    {
      title: 'In Progress',
      value: stats.inProgressTasks,
      icon: Clock,
      color: 'bg-blue-600',
      trend: '+8%',
    },
    {
      title: 'Completed',
      value: stats.completedTasks,
      icon: Target,
      color: 'bg-green-600',
      trend: '+23%',
    },
    {
      title: 'Team Members',
      value: 12,
      icon: Users,
      color: 'bg-yellow-600',
      trend: '+2',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-purple-200">
              Here's what's happening with your projects today.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-purple-600/20 rounded-2xl flex items-center justify-center">
              <Activity className="w-10 h-10 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-400 text-sm font-medium">
                  {stat.trend}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-gray-400 text-sm">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Task Completion Rate</h3>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Overall Progress</span>
              <span className="text-white font-semibold">{completionRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <div className="text-xl font-bold text-green-400">{stats.completedTasks}</div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <div className="text-xl font-bold text-blue-400">{stats.inProgressTasks}</div>
                <div className="text-xs text-gray-400">In Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Tasks</h3>
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          
          <div className="space-y-3">
            {recentTasks.map((task) => {
              const statusColors = {
                todo: 'bg-gray-500',
                in_progress: 'bg-blue-500',
                review: 'bg-yellow-500',
                completed: 'bg-green-500',
              };

              return (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full ${statusColors[task.status]}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {task.title}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                    task.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-green-900/30 text-green-400'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <MessageSquare className="w-5 h-5 text-purple-400" />
        </div>
        
        <div className="space-y-4">
          {[
            { action: 'Task completed', task: 'Design Landing Page', time: '2 hours ago', user: 'Sarah Wilson' },
            { action: 'Task assigned', task: 'API Integration', time: '4 hours ago', user: 'John Doe' },
            { action: 'Comment added', task: 'User Authentication', time: '6 hours ago', user: 'Alice Johnson' },
            { action: 'Task created', task: 'Database Migration', time: '1 day ago', user: 'John Doe' },
          ].map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-white text-sm">
                  <span className="font-medium">{activity.user}</span>{' '}
                  <span className="text-gray-400">{activity.action.toLowerCase()}</span>{' '}
                  <span className="font-medium text-purple-400">"{activity.task}"</span>
                </p>
                <p className="text-gray-500 text-xs">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;