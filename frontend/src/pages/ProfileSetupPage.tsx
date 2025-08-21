import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, User, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/FormField';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useUpdateProfileMutation } from '@/store/api/userApi';
import { loginSuccess } from '@/store/slices/authSlice';

const profileSetupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  displayName: z
    .string()
    .max(50, 'Display name must be less than 50 characters')
    .optional(),
  bio: z.string().max(190, 'Bio must be less than 190 characters').optional(),
  status: z.enum(['online', 'away', 'busy', 'offline']),
  customStatus: z
    .string()
    .max(128, 'Custom status must be less than 128 characters')
    .optional(),
});

type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;

export const ProfileSetupPage: React.FC = () => {
  const { user, token } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const methods = useForm<ProfileSetupFormData>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      username: user?.username || '',
      displayName: user?.displayName || '',
      bio: '',
      status: user?.status || 'online',
      customStatus: '',
    },
  });

  const onSubmit = async (data: ProfileSetupFormData) => {
    try {
      const updatedUser = await updateProfile({
        ...data,
        avatar: avatarPreview || undefined,
      }).unwrap();

      // Update auth state with new user data
      if (token) {
        dispatch(loginSuccess({ user: updatedUser, token }));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const statusOptions = [
    { value: 'online', label: 'Online', color: 'bg-green-500' },
    { value: 'away', label: 'Away', color: 'bg-yellow-500' },
    { value: 'busy', label: 'Do Not Disturb', color: 'bg-red-500' },
    { value: 'offline', label: 'Invisible', color: 'bg-gray-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Setup Your Profile
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Tell us about yourself to personalize your experience
            </p>
          </div>

          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {avatarPreview || user?.avatar ? (
                      <img
                        src={avatarPreview || user?.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  Click the camera icon to upload an avatar
                </p>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  name="username"
                  label="Username"
                  placeholder="Enter your username"
                  required
                />

                <FormField
                  name="displayName"
                  label="Display Name"
                  placeholder="Enter your display name"
                />
              </div>

              <FormField
                name="bio"
                label="Bio"
                placeholder="Tell us about yourself..."
              />

              {/* Status Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {statusOptions.map(option => (
                    <label
                      key={option.value}
                      className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        value={option.value}
                        {...methods.register('status')}
                        className="sr-only"
                      />
                      <div
                        className={`w-3 h-3 rounded-full ${option.color} mr-3`}
                      ></div>
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <FormField
                name="customStatus"
                label="Custom Status"
                placeholder="What's on your mind?"
              />

              {/* Privacy Settings */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Privacy Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Show Online Status
                      </label>
                      <p className="text-sm text-gray-600">
                        Let others see when you're online
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Allow Friend Requests
                      </label>
                      <p className="text-sm text-gray-600">
                        Let others send you friend requests
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Skip for now
                </Button>
                <Button type="submit" disabled={isLoading}>
                  <Save size={16} className="mr-2" />
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};
