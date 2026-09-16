type Option = { value: string | number; label: string };

type FormFieldProps = {
  as?: 'input' | 'textarea' | 'select';
  type?: string;
  value: string | number;
  placeholder?: string;
  options?: Option[];
  className?: string;
  onChange: (value: string) => void;
};

export function FormField({
  as = 'input',
  type = 'text',
  value,
  placeholder,
  options = [],
  className,
  onChange,
}: FormFieldProps) {
  const base = `border rounded-xl px-3 py-2 text-xs w-full ${className ?? ''}`;
  if (as === 'textarea') {
    return (
      <textarea
        className={`${base} min-h-16`}
        value={String(value)}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (as === 'select') {
    return (
      <select className={base} value={String(value)} onChange={(e) => onChange(e.target.value)}>
        {options.map((x) => (
          <option key={`${x.value}`} value={`${x.value}`}>
            {x.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      className={base}
      type={type}
      value={String(value)}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

