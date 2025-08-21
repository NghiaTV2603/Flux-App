import React from 'react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Flux Chat
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Select a server from the sidebar to start chatting, or create a new
          one.
        </p>
        <div className="space-y-4 text-left max-w-md">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">1</span>
            </div>
            <span className="text-gray-700">Create or join a server</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">2</span>
            </div>
            <span className="text-gray-700">
              Create channels for different topics
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">3</span>
            </div>
            <span className="text-gray-700">Start chatting with your team</span>
          </div>
        </div>
      </div>
    </div>
  );
};
