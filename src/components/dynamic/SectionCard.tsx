import type { ReactNode } from 'react';

type SectionCardProps = {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, right, children, className }: SectionCardProps) {
  return (
    <div className={`bg-white border rounded-3xl p-4 space-y-3 ${className ?? ''}`}>
      {title ? (
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">{title}</h2>
          {right}
        </div>
      ) : null}
      {children}
    </div>
  );
}

