import { useCurrentUser } from '../auth/auth-context';
import { ChangePasswordForm } from './ChangePasswordForm';
import { DeleteAccountSection } from './DeleteAccountSection';
import { ProfileSection } from './ProfileSection';
import { UpdateNameForm } from './UpdateNameForm';

export function ProfilePage() {
  const user = useCurrentUser();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <title>Profile · Task Manager</title>
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-slate-700">Signed in as {user.email}</p>
      </div>
      <ProfileSection title="Name">
        <UpdateNameForm />
      </ProfileSection>
      <ProfileSection title="Change password">
        <ChangePasswordForm />
      </ProfileSection>
      <DeleteAccountSection />
    </div>
  );
}
