import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../../components/Button';
import { FormError } from '../../components/FormError';
import { TextField } from '../../components/TextField';
import { getErrorMessage } from '../../lib/api-client';
import { useUpdateProfile } from './queries';
import { passwordFormSchema, type PasswordFormValues } from './schemas';

const emptyValues = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function ChangePasswordForm() {
  const updateProfile = useUpdateProfile();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit({ currentPassword, newPassword }: PasswordFormValues) {
    try {
      await updateProfile.mutateAsync({ currentPassword, newPassword });
      reset(emptyValues);
      toast.success('Password changed');
    } catch (error) {
      // e.g. "Current password is incorrect" (a 400, so it doesn't log the user out)
      setError('root', { message: getErrorMessage(error) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormError message={errors.root?.message} />
      <TextField
        label="Current password"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <TextField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" className="self-start" isLoading={isSubmitting}>
        Change password
      </Button>
    </form>
  );
}
