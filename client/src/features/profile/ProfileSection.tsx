import { type ReactNode, useId } from 'react';

interface ProfileSectionProps {
  title: string;
  description?: string;
  danger?: boolean;
  children: ReactNode;
}

export function ProfileSection({
  title,
  description,
  danger = false,
  children,
}: ProfileSectionProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={`flex flex-col gap-4 rounded-lg border bg-white p-6 shadow-xs ${
        danger ? 'border-red-200' : 'border-slate-200'
      }`}
    >
      <div>
        <h2 id={headingId} className={`text-lg font-semibold ${danger ? 'text-red-800' : ''}`}>
          {title}
        </h2>
        {description && <p className="text-sm text-slate-700">{description}</p>}
      </div>
      {children}
    </section>
  );
}
