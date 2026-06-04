import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseProps = {
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
  children: ReactNode;
};

function FieldShell({ label, required, error, helper, children }: BaseProps) {
  return (
    <label className="flex min-w-0 flex-col gap-xs font-label-md text-on-surface">
      <span>
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </span>
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
  required?: boolean;
  error?: string;
  helper?: string;
}

export function TextField({ label, required, error, helper, className = "", ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} required={required} error={error} helper={helper}>
      <input className={`form-input ${className}`} {...props} />
    </FieldShell>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
}

export function TextAreaField({ label, required, error, helper, className = "", ...props }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} required={required} error={error} helper={helper}>
      <textarea className={`form-input min-h-28 ${className}`} {...props} />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
}

export function SelectField({ label, required, error, helper, className = "", children, ...props }: SelectFieldProps) {
  return (
    <FieldShell label={label} required={required} error={error} helper={helper}>
      <select className={`form-input ${className}`} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}
