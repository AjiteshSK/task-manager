import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router';
import { Button } from '../../components/Button';
import { FormError } from '../../components/FormError';
import { linkClassName } from '../../components/styles';
import { TextField } from '../../components/TextField';
import { getErrorMessage } from '../../lib/api-client';
import { useAuth } from './auth-context';
import { AuthLayout } from './AuthLayout';
import { registerSchema, type RegisterValues } from './schemas';

export function RegisterPage() {
  // Renamed so it doesn't clash with React Hook Form's register()
  const { register: createAccount } = useAuth();
  // React Router types location.state as any; treat it as unknown
  const redirectState: unknown = useLocation().state;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit({ name, email, password }: RegisterValues) {
    try {
      await createAccount({ name, email, password });
    } catch (error) {
      setError('root', { message: getErrorMessage(error) });
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={redirectState} className={linkClassName}>
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormError message={errors.root?.message} />
        <TextField
          label="Name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
