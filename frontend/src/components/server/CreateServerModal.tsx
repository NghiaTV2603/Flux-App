import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useCreateServerMutation } from '@/store/api/serverApi';

const createServerSchema = z.object({
  name: z
    .string()
    .min(1, 'Server name is required')
    .min(2, 'Server name must be at least 2 characters')
    .max(100, 'Server name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
});

type CreateServerFormData = z.infer<typeof createServerSchema>;

interface CreateServerModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({
  open,
  onClose,
}) => {
  const [createServer, { isLoading }] = useCreateServerMutation();

  const methods = useForm<CreateServerFormData>({
    resolver: zodResolver(createServerSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateServerFormData) => {
    try {
      await createServer(data).unwrap();
      methods.reset();
      onClose();
    } catch (error) {
      console.error('Failed to create server:', error);
    }
  };

  const handleClose = () => {
    methods.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Server</DialogTitle>
          <DialogDescription>
            Your server is where you and your friends hang out. Make yours and
            start talking.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="name"
              label="Server Name"
              placeholder="Enter server name"
              required
            />

            <FormField
              name="description"
              label="Description (Optional)"
              placeholder="Tell people what your server is about"
            />

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
                {isLoading ? 'Creating...' : 'Create Server'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
