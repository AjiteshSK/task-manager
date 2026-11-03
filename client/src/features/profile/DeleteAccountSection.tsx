import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TextField } from '../../components/TextField';
import { getErrorMessage } from '../../lib/api-client';
import { ProfileSection } from './ProfileSection';
import { useDeleteAccount } from './queries';

// Typing a word makes deleting the account a deliberate act, not a stray click
const CONFIRMATION_WORD = 'DELETE';

export function DeleteAccountSection() {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const deleteAccount = useDeleteAccount();

  function closeDialog() {
    setIsConfirming(false);
    setConfirmation('');
  }

  async function handleDelete() {
    try {
      await deleteAccount.mutateAsync();
      toast.success('Your account has been deleted');
    } catch (error) {
      toast.error(`Couldn't delete your account. ${getErrorMessage(error)}`);
    }
  }

  return (
    <ProfileSection
      title="Delete account"
      description="Permanently delete your account and all of your tasks."
      danger
    >
      <Button variant="danger" className="self-start" onClick={() => setIsConfirming(true)}>
        Delete account
      </Button>
      <ConfirmDialog
        open={isConfirming}
        title="Delete your account?"
        description="This deletes your account and all of your tasks. It can't be undone."
        confirmLabel="Delete my account"
        confirmDisabled={confirmation !== CONFIRMATION_WORD}
        isPending={deleteAccount.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={closeDialog}
      >
        <TextField
          label={`Type ${CONFIRMATION_WORD} to confirm`}
          autoComplete="off"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </ConfirmDialog>
    </ProfileSection>
  );
}
