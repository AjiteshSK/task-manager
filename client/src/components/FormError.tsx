/** A form-level error, such as a message from the server. role="alert" makes screen readers announce it. */
export function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
    >
      {message}
    </p>
  );
}
