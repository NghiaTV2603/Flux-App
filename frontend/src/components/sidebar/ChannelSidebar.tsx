import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Hash,
  Volume2,
  Plus,
  Settings,
  Users,
  ChevronDown,
  Crown,
} from 'lucide-react';
import {
  useGetServerQuery,
  useGetServerChannelsQuery,
  useGetServerMembersQuery,
} from '@/store/api/serverApi';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { CreateChannelModal } from '@/components/channel/CreateChannelModal';
import { cn } from '@/lib/utils';

export const ChannelSidebar: React.FC = () => {
  const { serverId, channelId } = useParams();
  const { user } = useAppSelector(state => state.auth);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembers, setShowMembers] = useState(true);

  const { data: server } = useGetServerQuery(serverId!, {
    skip: !serverId,
  });

  const { data: channels } = useGetServerChannelsQuery(serverId!, {
    skip: !serverId,
  });

  const { data: members } = useGetServerMembersQuery(serverId!, {
    skip: !serverId,
  });

  if (!serverId || !server) return null;

  const textChannels = channels?.filter(ch => ch.type === 'text') || [];
  const voiceChannels = channels?.filter(ch => ch.type === 'voice') || [];
  const onlineMembers = members?.filter(m => m.status === 'online') || [];
  const offlineMembers = members?.filter(m => m.status === 'offline') || [];

  return (
    <>
      <div className="flex h-full bg-gray-800">
        {/* Channel List */}
        <div className="flex flex-col w-60 bg-gray-800">
          {/* Server Header */}
          <div className="h-12 px-4 flex items-center border-b border-gray-700 shadow-sm">
            <h1 className="font-semibold text-white truncate">{server.name}</h1>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-gray-400 hover:text-white"
            >
              <ChevronDown size={16} />
            </Button>
          </div>

          {/* Channels */}
          <div className="flex-1 overflow-y-auto py-3">
            {/* Text Channels */}
            <div className="px-2 mb-4">
              <div className="flex items-center justify-between px-2 py-1">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Text Channels
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="w-4 h-4 text-gray-400 hover:text-white p-0"
                >
                  <Plus size={12} />
                </Button>
              </div>

              <div className="space-y-0.5 mt-1">
                {textChannels.map(channel => (
                  <Link
                    key={channel.id}
                    to={`/app/servers/${serverId}/channels/${channel.id}`}
                  >
                    <div
                      className={cn(
                        'flex items-center px-2 py-1.5 rounded text-gray-300 hover:bg-gray-700 hover:text-gray-200 transition-colors',
                        channelId === channel.id && 'bg-gray-700 text-white'
                      )}
                    >
                      <Hash size={16} className="mr-2 text-gray-400" />
                      <span className="text-sm truncate">{channel.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Voice Channels */}
            <div className="px-2 mb-4">
              <div className="flex items-center justify-between px-2 py-1">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Voice Channels
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="w-4 h-4 text-gray-400 hover:text-white p-0"
                >
                  <Plus size={12} />
                </Button>
              </div>

              <div className="space-y-0.5 mt-1">
                {voiceChannels.map(channel => (
                  <Link
                    key={channel.id}
                    to={`/app/servers/${serverId}/channels/${channel.id}`}
                  >
                    <div className="flex items-center px-2 py-1.5 rounded text-gray-300 hover:bg-gray-700 hover:text-gray-200 transition-colors">
                      <Volume2 size={16} className="mr-2 text-gray-400" />
                      <span className="text-sm truncate">{channel.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* User Panel */}
          <div className="h-14 bg-gray-900 px-2 flex items-center">
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
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>

        {/* Member List */}
        {showMembers && (
          <div className="w-60 bg-gray-800 border-l border-gray-700">
            <div className="h-12 px-4 flex items-center border-b border-gray-700">
              <Users size={16} className="mr-2 text-gray-400" />
              <span className="text-sm font-semibold text-gray-300">
                Members — {members?.length || 0}
              </span>
            </div>

            <div className="overflow-y-auto py-3">
              {/* Online Members */}
              {onlineMembers.length > 0 && (
                <div className="px-4 mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Online — {onlineMembers.length}
                  </h3>
                  <div className="space-y-1">
                    {onlineMembers.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center py-1 hover:bg-gray-700 rounded px-2 -mx-2 transition-colors"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                            {member.displayName?.[0] || member.username[0]}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex items-center">
                            {server.ownerId === member.userId && (
                              <Crown
                                size={12}
                                className="text-yellow-500 mr-1"
                              />
                            )}
                            <p className="text-sm text-gray-300 truncate">
                              {member.nickname ||
                                member.displayName ||
                                member.username}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {member.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Offline Members */}
              {offlineMembers.length > 0 && (
                <div className="px-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Offline — {offlineMembers.length}
                  </h3>
                  <div className="space-y-1">
                    {offlineMembers.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center py-1 hover:bg-gray-700 rounded px-2 -mx-2 transition-colors opacity-50"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-semibold">
                            {member.displayName?.[0] || member.username[0]}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-500 rounded-full border-2 border-gray-800"></div>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex items-center">
                            {server.ownerId === member.userId && (
                              <Crown
                                size={12}
                                className="text-yellow-500 mr-1"
                              />
                            )}
                            <p className="text-sm text-gray-400 truncate">
                              {member.nickname ||
                                member.displayName ||
                                member.username}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      <CreateChannelModal
        serverId={serverId}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
};
