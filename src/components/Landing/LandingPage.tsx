import React, { useState } from 'react';
import { 
  CheckSquare, 
  ArrowRight, 
  Users, 
  MessageSquare, 
  Calendar,
  Zap,
  Shield,
  BarChart3,
  Star
} from 'lucide-react';
import LoginForm from '../Auth/LoginForm';
import SignupForm from '../Auth/SignupForm';

const LandingPage: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const features = [
    {
      icon: CheckSquare,
      title: 'Advanced Task Management',
      description: 'Kanban boards with drag-and-drop, custom workflows, and detailed task tracking.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Role-based permissions, team management, and seamless collaboration tools.'
    },
    {
      icon: MessageSquare,
      title: 'Integrated Chat',
      description: 'Discord-like chat system with channels, threads, and real-time messaging.'
    },
    {
      icon: Calendar,
      title: 'Meeting Scheduler',
      description: 'Schedule meetings, manage calendars, and integrate with video conferencing.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Comprehensive dashboards with real-time analytics and performance metrics.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Advanced security features with role-based access control and data protection.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Project Manager',
      company: 'TechCorp',
      avatar: 'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=400',
      content: 'TaskFlow has revolutionized how our team manages projects. The interface is intuitive and the features are exactly what we needed.'
    },
    {
      name: 'Michael Chen',
      role: 'Engineering Lead',
      company: 'StartupXYZ',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
      content: 'The Kanban boards and real-time collaboration features have improved our team productivity by 300%. Highly recommended!'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Product Owner',
      company: 'InnovateLab',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      content: 'TaskFlow\'s analytics dashboard gives us incredible insights into our team\'s performance and project progress.'
    }
  ];

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="#4c1d95" fill-opacity="0.1"><circle cx="7" cy="7" r="3"/><circle cx="53" cy="7" r="3"/><circle cx="7" cy="53" r="3"/><circle cx="53" cy="53" r="3"/></g></g></svg>')}")`
          }}></div>
        </div>
        
        <div className="w-full max-w-md relative">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Frooxi Workspace</h1>
            </div>
            <p className="text-gray-300">
              {isLogin ? 'Welcome back! Sign in to your account' : 'Create your admin account to get started'}
            </p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 shadow-2xl">
            {isLogin ? (
              <LoginForm onToggleForm={() => setIsLogin(false)} />
            ) : (
              <SignupForm onToggleForm={() => setIsLogin(true)} />
            )}
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => setShowAuth(false)}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              ← Back to landing page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Frooxi Workspace</h1>
              <p className="text-xs text-purple-300">Project Management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setShowAuth(true);
                setIsLogin(true);
              }}
              className="px-4 py-2 text-white hover:text-purple-300 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setShowAuth(true);
                setIsLogin(false);
              }}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="#4c1d95" fill-opacity="0.1"><circle cx="7" cy="7" r="3"/><circle cx="53" cy="7" r="3"/><circle cx="7" cy="53" r="3"/><circle cx="53" cy="53" r="3"/></g></g></svg>')}")`
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            The Future of
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block">
              Project Management
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Streamline your workflow with our advanced task management platform. 
            Built for modern teams who demand efficiency, collaboration, and results.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => setShowAuth(true)}
              className="group bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-3 shadow-2xl hover:shadow-purple-500/25"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="text-gray-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors border border-gray-600 hover:border-gray-500">
              Watch Demo
            </button>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-400">Optimized for speed and performance</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Enterprise Security</h3>
              <p className="text-gray-400">Bank-level security and compliance</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Advanced Analytics</h3>
              <p className="text-gray-400">Data-driven insights and reporting</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our comprehensive platform includes all the tools your team needs to manage projects, 
              collaborate effectively, and deliver exceptional results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600/30 transition-colors">
                    <Icon className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-300">
              See what our customers have to say about TaskFlow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center space-x-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-gray-400 text-sm">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-purple-900 to-blue-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-purple-200 mb-8">
            Join thousands of teams already using TaskFlow to achieve their goals faster.
          </p>
          
          <button
            onClick={() => setShowAuth(true)}
            className="group bg-white text-purple-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-3 mx-auto shadow-2xl hover:shadow-white/25 hover:transform hover:scale-105"
          >
            <span>Start Your Free Trial</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="text-purple-200 mt-4">
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 border-t border-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold">Frooxi Workspace</span>
            </div>
            <p className="text-gray-400">
              © 2024 Frooxi Workspace. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;