import { baseApi } from './baseApi';

export interface Server {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  ownerId: string;
  inviteCode: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: string;
  serverId: string;
  name: string;
  description?: string;
  type: 'text' | 'voice';
  isPrivate: boolean;
  position: number;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServerMember {
  id: string;
  serverId: string;
  userId: string;
  username: string;
  displayName?: string;
  avatar?: string;
  nickname?: string;
  roles: string[];
  joinedAt: string;
  status: 'online' | 'away' | 'busy' | 'offline';
}

export interface CreateServerRequest {
  name: string;
  description?: string;
  icon?: string;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
  type: 'text' | 'voice';
  isPrivate?: boolean;
  categoryId?: string;
}

export interface UpdateServerRequest {
  name?: string;
  description?: string;
  icon?: string;
}

export interface UpdateChannelRequest {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  position?: number;
}

export const serverApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // Get user's servers
    getUserServers: builder.query<Server[], void>({
      query: () => '/servers',
      providesTags: ['Server'],
    }),

    // Get server details
    getServer: builder.query<Server, string>({
      query: serverId => `/servers/${serverId}`,
      providesTags: ['Server'],
    }),

    // Create server
    createServer: builder.mutation<Server, CreateServerRequest>({
      query: data => ({
        url: '/servers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Server'],
    }),

    // Update server
    updateServer: builder.mutation<
      Server,
      { id: string } & UpdateServerRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/servers/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Server'],
    }),

    // Delete server
    deleteServer: builder.mutation<void, string>({
      query: serverId => ({
        url: `/servers/${serverId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Server'],
    }),

    // Join server
    joinServer: builder.mutation<void, { inviteCode: string }>({
      query: data => ({
        url: '/servers/join',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Server'],
    }),

    // Get server channels
    getServerChannels: builder.query<Channel[], string>({
      query: serverId => `/servers/${serverId}/channels`,
      providesTags: ['Channel'],
    }),

    // Create channel
    createChannel: builder.mutation<
      Channel,
      { serverId: string } & CreateChannelRequest
    >({
      query: ({ serverId, ...data }) => ({
        url: `/servers/${serverId}/channels`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Channel'],
    }),

    // Update channel
    updateChannel: builder.mutation<
      Channel,
      { id: string } & UpdateChannelRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/channels/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Channel'],
    }),

    // Delete channel
    deleteChannel: builder.mutation<void, string>({
      query: channelId => ({
        url: `/channels/${channelId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Channel'],
    }),

    // Get server members
    getServerMembers: builder.query<ServerMember[], string>({
      query: serverId => `/servers/${serverId}/members`,
      providesTags: ['User'],
    }),

    // Create invite
    createInvite: builder.mutation<
      { code: string; url: string },
      { serverId: string; maxUses?: number; expiresIn?: number }
    >({
      query: ({ serverId, ...data }) => ({
        url: `/servers/${serverId}/invites`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetUserServersQuery,
  useGetServerQuery,
  useCreateServerMutation,
  useUpdateServerMutation,
  useDeleteServerMutation,
  useJoinServerMutation,
  useGetServerChannelsQuery,
  useCreateChannelMutation,
  useUpdateChannelMutation,
  useDeleteChannelMutation,
  useGetServerMembersQuery,
  useCreateInviteMutation,
} = serverApi;
