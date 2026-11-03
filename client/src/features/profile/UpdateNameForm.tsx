import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../../components/Button';
import { FormError } from '../../components/FormError';
import { TextField } from '../../components/TextField';
import { getErrorMessage } from '../../lib/api-client';
import { useCurrentUser } from '../auth/auth-context';
import { useUpdateProfile } from './queries';
import { nameFormSchema, type NameFormValues } from './schemas';

export function UpdateNameForm() {
  const user = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(nameFormSchema),
    defaultValues: { name: user.name },
  });

  async function onSubmit({ name }: NameFormValues) {
    try {
      const updatedUser = await updateProfile.mutateAsync({ name });
      // Make the saved name the new starting point, so "Save" disables again
      reset({ name: updatedUser.name });
      toast.success('Name updated');
    } catch (error) {
      setError('root', { message: getErrorMessage(error) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormError message={errors.root?.message} />
      <TextField
        label="Name"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <Button type="submit" className="self-start" isLoading={isSubmitting} disabled={!isDirty}>
        Save name
      </Button>
    </form>
  );
}
