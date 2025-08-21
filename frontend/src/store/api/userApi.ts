import { baseApi } from './baseApi';
import type { User } from '../slices/authSlice';

export interface UpdateProfileRequest {
  username?: string;
  displayName?: string;
  avatar?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  customStatus?: string;
}

export interface UserActivity {
  type: 'playing' | 'listening' | 'watching' | 'streaming';
  name: string;
  details?: string;
  state?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    mentions: boolean;
    directMessages: boolean;
    serverMessages: boolean;
    friendRequests: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowDirectMessages: 'everyone' | 'friends' | 'none';
    allowFriendRequests: boolean;
  };
}

export const userApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // Get user profile
    getUserProfile: builder.query<User, string>({
      query: userId => `/user-social/${userId}`,
      providesTags: ['User'],
    }),

    // Update user profile
    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: data => ({
        url: '/user-social/profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User', 'Auth'],
    }),

    // Update user status
    updateStatus: builder.mutation<
      void,
      { status: User['status']; customStatus?: string }
    >({
      query: data => ({
        url: '/user-social/status',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // Update user activity
    updateActivity: builder.mutation<void, UserActivity>({
      query: data => ({
        url: '/user-social/activity',
        method: 'PATCH',
        body: data,
      }),
    }),

    // Get user settings
    getUserSettings: builder.query<UserSettings, void>({
      query: () => '/users/settings',
      providesTags: ['User'],
    }),

    // Update user settings
    updateSettings: builder.mutation<UserSettings, Partial<UserSettings>>({
      query: data => ({
        url: '/users/settings',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // Search users
    searchUsers: builder.query<User[], string>({
      query: query => `/users/search?q=${encodeURIComponent(query)}`,
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useUpdateStatusMutation,
  useUpdateActivityMutation,
  useGetUserSettingsQuery,
  useUpdateSettingsMutation,
  useSearchUsersQuery,
} = userApi;
