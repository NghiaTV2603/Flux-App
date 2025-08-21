import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Hash, Volume2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/FormField';
import { useCreateChannelMutation } from '@/store/api/serverApi';
import { cn } from '@/lib/utils';

const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name is required')
    .min(2, 'Channel name must be at least 2 characters')
    .max(100, 'Channel name must be less than 100 characters')
    .regex(
      /^[a-z0-9-_]+$/,
      'Channel name can only contain lowercase letters, numbers, hyphens, and underscores'
    ),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  type: z.enum(['text', 'voice']),
  isPrivate: z.boolean().optional(),
});

type CreateChannelFormData = z.infer<typeof createChannelSchema>;

interface CreateChannelModalProps {
  serverId: string;
  open: boolean;
  onClose: () => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  serverId,
  open,
  onClose,
}) => {
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [createChannel, { isLoading }] = useCreateChannelMutation();

  const methods = useForm<CreateChannelFormData>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'text',
      isPrivate: false,
    },
  });

  const onSubmit = async (data: CreateChannelFormData) => {
    try {
      await createChannel({
        serverId,
        ...data,
        type: channelType,
      }).unwrap();
      methods.reset();
      onClose();
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  const handleClose = () => {
    methods.reset();
    setChannelType('text');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Channels are where your community comes together to chat. They're
            best when organized around a topic.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Channel Type Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Channel Type
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setChannelType('text')}
                className={cn(
                  'w-full p-3 rounded-lg border text-left flex items-center space-x-3 transition-colors',
                  channelType === 'text'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <Hash size={20} className="text-gray-600" />
                <div>
                  <div className="font-medium">Text</div>
                  <div className="text-sm text-gray-600">
                    Send messages, images, GIFs, emoji, opinions, and puns
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setChannelType('voice')}
                className={cn(
                  'w-full p-3 rounded-lg border text-left flex items-center space-x-3 transition-colors',
                  channelType === 'voice'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <Volume2 size={20} className="text-gray-600" />
                <div>
                  <div className="font-medium">Voice</div>
                  <div className="text-sm text-gray-600">
                    Hang out together with voice, video, and screen share
                  </div>
                </div>
              </button>
            </div>
          </div>

          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                name="name"
                label="Channel Name"
                placeholder={`new-${channelType}-channel`}
                required
              />

              <FormField
                name="description"
                label="Description (Optional)"
                placeholder="What's this channel about?"
              />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  {...methods.register('isPrivate')}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isPrivate" className="text-sm text-gray-700">
                  Private Channel
                </label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Channel'}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};
