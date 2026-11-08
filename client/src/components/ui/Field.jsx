import { useId } from 'react';

const control =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60';

/** Label + control + hint/error, wired up for screen readers. */
export function Field({ label, hint, error, children, className = '' }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-bad">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function Input({ label, hint, error, className, prefix, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(a11y) =>
        prefix ? (
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-muted">
              {prefix}
            </span>
            <input {...a11y} {...props} className={`${control} pl-9`} />
          </div>
        ) : (
          <input {...a11y} {...props} className={control} />
        )
      }
    </Field>
  );
}

export function Select({ label, hint, error, className, children, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(a11y) => (
        <select {...a11y} {...props} className={control}>
          {children}
        </select>
      )}
    </Field>
  );
}

export function Textarea({ label, hint, error, className, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(a11y) => <textarea {...a11y} {...props} className={`${control} min-h-20`} />}
    </Field>
  );
}
