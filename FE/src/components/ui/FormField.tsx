import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseProps = {
  label: string;
  error?: string;
  helper?: string;
  children: ReactNode;
};

function FieldShell({ label, error, helper, children }: BaseProps) {
  return (
    <label className="flex min-w-0 flex-col gap-xs font-label-md text-on-surface">
      <span>{label}</span>
      {children}
      {error ? (
        <span className="font-body-sm text-error">{error}</span>
      ) : helper ? (
        <span className="font-body-sm text-on-surface-variant">{helper}</span>
      ) : null}
    </label>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "children"> {
  label: string;
  error?: string;
  helper?: string;
}

export function TextField({ label, error, helper, className = "", ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} error={error} helper={helper}>
      <input className={`form-input ${className}`} {...props} />
    </FieldShell>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helper?: string;
}

export function TextAreaField({ label, error, helper, className = "", ...props }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} error={error} helper={helper}>
      <textarea className={`form-input min-h-28 ${className}`} {...props} />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helper?: string;
}

export function SelectField({ label, error, helper, className = "", children, ...props }: SelectFieldProps) {
  return (
    <FieldShell label={label} error={error} helper={helper}>
      <select className={`form-input ${className}`} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}
