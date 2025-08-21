import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/FormField';
import { useRegisterMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { loginSuccess } from '@/store/slices/authSlice';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [register, { isLoading, error }] = useRegisterMutation();

  const methods = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      displayName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword: _confirmPassword, ...registerData } = data; // eslint-disable-line @typescript-eslint/no-unused-vars
      const result = await register(registerData).unwrap();
      dispatch(loginSuccess(result));
      navigate('/app', { replace: true });
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in here
          </Link>
        </p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {'data' in error
                ? (error.data as { message: string })?.message ||
                  'Registration failed'
                : 'An error occurred during registration'}
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
            name="username"
            label="Username"
            type="text"
            placeholder="Choose a username"
            required
          />

          <FormField
            name="displayName"
            label="Display Name (Optional)"
            type="text"
            placeholder="Your display name"
          />

          <FormField
            name="password"
            label="Password"
            type="password"
            placeholder="Create a password"
            required
          />

          <FormField
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            required
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </FormProvider>
    </div>
  );
};
