import React from 'react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="h-full p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            User Settings
          </h2>
          <p className="text-gray-600">
            Settings functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
};
