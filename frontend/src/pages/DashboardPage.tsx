import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, MessageSquare, Compass } from 'lucide-react';
import { useGetUserServersQuery } from '@/store/api/serverApi';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { CreateServerModal } from '@/components/server/CreateServerModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const { data: servers, isLoading } = useGetUserServersQuery();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <div className="h-full bg-gray-700 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-gray-800 border-b border-gray-600 flex items-center px-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <MessageSquare size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white">Flux Chat</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Friends/DM Sidebar */}
          <div className="w-60 bg-gray-800 border-r border-gray-600">
            <div className="p-4">
              <div className="space-y-2">
                <Link
                  to="/app/friends"
                  className="flex items-center px-3 py-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <Users size={16} className="mr-3" />
                  Friends
                </Link>

                <Link
                  to="/app/discover"
                  className="flex items-center px-3 py-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <Compass size={16} className="mr-3" />
                  Discover
                </Link>
              </div>
            </div>

            {/* Direct Messages */}
            <div className="px-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Direct Messages
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-4 h-4 text-gray-400 hover:text-white p-0"
                >
                  <Plus size={12} />
                </Button>
              </div>

              <div className="text-sm text-gray-400 text-center py-4">
                No direct messages yet
              </div>
            </div>

            {/* User Panel */}
            <div className="absolute bottom-0 left-0 w-60 h-14 bg-gray-900 px-2 flex items-center">
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold mr-2">
                  {user?.displayName?.[0] || user?.username[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.displayName || user?.username}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    #{user?.username}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare size={32} className="text-gray-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-4">
                Welcome to Flux Chat!
              </h2>

              <p className="text-gray-400 mb-8">
                {servers && servers.length > 0
                  ? 'Select a server from the left sidebar to start chatting with your community.'
                  : 'Get started by creating your first server or joining an existing one.'}
              </p>

              {(!servers || servers.length === 0) && (
                <div className="space-y-4">
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full"
                  >
                    <Plus size={16} className="mr-2" />
                    Create My First Server
                  </Button>

                  <div className="text-gray-500 text-sm">
                    or join an existing server with an invite link
                  </div>
                </div>
              )}

              {servers && servers.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  {servers.slice(0, 3).map(server => (
                    <Link
                      key={server.id}
                      to={`/app/servers/${server.id}`}
                      className="flex items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold mr-3">
                        {server.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="text-white font-medium">
                          {server.name}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {server.memberCount} members
                        </div>
                      </div>
                    </Link>
                  ))}

                  {servers.length > 3 && (
                    <div className="text-gray-400 text-sm mt-2">
                      And {servers.length - 3} more servers...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Server Modal */}
      <CreateServerModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
};
