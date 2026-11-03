import { type ReactNode, useEffect, useId, useRef } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * A modal built on the native <dialog> element. showModal() gives focus trapping, closing
 * with Esc, and an inert page behind it, without a UI library.
 */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Keep the browser's modal state in sync with the `open` prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Fires when the user presses Esc, so the parent's state stays in sync
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/50"
    >
      {/* Content only renders while open, so forms start fresh each time */}
      {open && (
        <>
          <h2 id={titleId} className="mb-4 text-lg font-semibold">
            {title}
          </h2>
          {children}
        </>
      )}
    </dialog>
  );
}
