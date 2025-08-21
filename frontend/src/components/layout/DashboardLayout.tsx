import React from 'react';
import { Outlet } from 'react-router-dom';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar - sẽ implement sau */}
      <div className="w-64 bg-gray-800 text-white">
        <div className="p-4">
          <h2 className="text-xl font-bold">Flux Chat</h2>
        </div>
        {/* Navigation sẽ được thêm sau */}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
