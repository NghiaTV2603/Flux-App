import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { ServerSidebar } from '@/components/sidebar/ServerSidebar';
import { ChannelSidebar } from '@/components/sidebar/ChannelSidebar';

export const DashboardLayout: React.FC = () => {
  const { serverId } = useParams();

  return (
    <div className="h-screen flex bg-gray-700">
      {/* Server List Sidebar */}
      <ServerSidebar />

      {/* Channel Sidebar (only show when in a server) */}
      {serverId && <ChannelSidebar />}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
