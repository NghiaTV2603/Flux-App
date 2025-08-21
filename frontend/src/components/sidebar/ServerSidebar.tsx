import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Home, Settings } from 'lucide-react';
import { useGetUserServersQuery } from '@/store/api/serverApi';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { CreateServerModal } from '@/components/server/CreateServerModal';
import { cn } from '@/lib/utils';

export const ServerSidebar: React.FC = () => {
  const { serverId } = useParams();
  const { user } = useAppSelector(state => state.auth);
  const { data: servers, isLoading } = useGetUserServersQuery();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!user) return null;

  return (
    <>
      <div className="flex flex-col w-18 bg-gray-900 py-3 space-y-2 overflow-y-auto">
        {/* Home Button */}
        <div className="px-3">
          <Link to="/app">
            <div
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200',
                !serverId
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white hover:rounded-xl'
              )}
            >
              <Home size={20} />
            </div>
          </Link>
        </div>

        {/* Separator */}
        <div className="px-3">
          <div className="h-0.5 bg-gray-700 rounded-full"></div>
        </div>

        {/* Server List */}
        {isLoading ? (
          <div className="px-3 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-12 h-12 bg-gray-700 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="px-3 space-y-2">
            {servers?.map(server => (
              <Link key={server.id} to={`/app/servers/${server.id}`}>
                <div
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 group relative',
                    serverId === server.id
                      ? 'bg-indigo-600 text-white rounded-xl'
                      : 'bg-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white hover:rounded-xl'
                  )}
                >
                  {server.icon ? (
                    <img
                      src={server.icon}
                      alt={server.name}
                      className="w-12 h-12 rounded-2xl group-hover:rounded-xl object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold">
                      {server.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}

                  {/* Server name tooltip */}
                  <div className="absolute left-16 bg-black text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                    {server.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Add Server Button */}
        <div className="px-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCreateModal(true)}
            className="w-12 h-12 rounded-2xl bg-gray-700 text-green-400 hover:bg-green-600 hover:text-white hover:rounded-xl transition-all duration-200"
          >
            <Plus size={20} />
          </Button>
        </div>

        {/* Settings */}
        <div className="px-3 mt-auto">
          <Link to="/app/settings">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-200">
              <Settings size={20} />
            </div>
          </Link>
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
