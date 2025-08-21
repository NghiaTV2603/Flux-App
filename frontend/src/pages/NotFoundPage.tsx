import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Page not found
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link to="/">Go back home</Link>
        </Button>
      </div>
    </div>
  );
};
