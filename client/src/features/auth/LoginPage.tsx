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
import { loginSchema, type LoginValues } from './schemas';

export function LoginPage() {
  const { login } = useAuth();
  // React Router types location.state as any; treat it as unknown
  const redirectState: unknown = useLocation().state;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // After a successful login, GuestRoute sends the user on to the page they wanted
  async function onSubmit(values: LoginValues) {
    try {
      await login(values);
    } catch (error) {
      setError('root', { message: getErrorMessage(error) });
    }
  }

  return (
    <AuthLayout
      title="Log in"
      footer={
        <>
          Don&apos;t have an account?{' '}
          {/* Pass the state along so the post-login redirect survives switching pages */}
          <Link to="/register" state={redirectState} className={linkClassName}>
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormError message={errors.root?.message} />
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" isLoading={isSubmitting}>
          Log in
        </Button>
        <p className="text-center text-xs text-slate-600">
          Demo account: demo@example.com / Demo@1234
        </p>
      </form>
    </AuthLayout>
  );
}
