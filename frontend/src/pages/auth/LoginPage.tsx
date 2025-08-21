import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/FormField';
import { useLoginMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { loginSuccess } from '@/store/slices/authSlice';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();

  const from = location.state?.from?.pathname || '/app';

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login(data).unwrap();
      dispatch(loginSuccess(result));
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link
            to="/auth/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up here
          </Link>
        </p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {'data' in error
                ? (error.data as { message: string })?.message || 'Login failed'
                : 'An error occurred during login'}
            </div>
          )}

          <FormField
            name="email"
            label="Email address"
            type="email"
            placeholder="Enter your email"
            required
          />

          <FormField
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            required
          />

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/auth/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </FormProvider>
    </div>
  );
};
