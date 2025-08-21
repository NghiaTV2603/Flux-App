import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">Flux Chat</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect, communicate, and collaborate with your team in real-time.
            Experience seamless messaging with powerful features.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link to="/auth/register">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-blue-600 text-xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-time Messaging</h3>
            <p className="text-gray-600">
              Send and receive messages instantly with your team members.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-green-600 text-xl">🏢</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Server Organization</h3>
            <p className="text-gray-600">
              Create and manage servers with multiple channels for different
              topics.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-purple-600 text-xl">🔒</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
            <p className="text-gray-600">
              Your conversations are protected with end-to-end security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
