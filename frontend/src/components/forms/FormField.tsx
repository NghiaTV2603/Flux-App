import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  error,
  className,
  type = 'text',
  ...props
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const fieldError = error || (errors[name]?.message as string);

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <Input
        {...register(name)}
        id={name}
        type={type}
        className={cn(
          'w-full',
          fieldError &&
            'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {fieldError && (
        <p className="text-sm text-red-600" role="alert">
          {fieldError}
        </p>
      )}
    </div>
  );
};
