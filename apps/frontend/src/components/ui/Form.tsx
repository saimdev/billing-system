// apps/frontend/src/components/ui/Form.tsx
import React from 'react';
import { clsx } from 'clsx';

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  children: React.ReactNode;
}

export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={clsx('space-y-1', className)}>
      {children}
    </div>
  );
}

export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <label
      className={clsx(
        'block text-sm font-medium text-gray-700 dark:text-gray-300',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <div>
        <input
          ref={ref}
          className={clsx(
            'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-700',
            error
              ? 'ring-red-300 focus:ring-red-500'
              : 'ring-gray-300 dark:ring-gray-600 focus:ring-indigo-600',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <div>
        <textarea
          ref={ref}
          className={clsx(
            'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-700',
            error
              ? 'ring-red-300 focus:ring-red-500'
              : 'ring-gray-300 dark:ring-gray-600 focus:ring-indigo-600',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className, children, ...props }, ref) => {
    return (
      <div>
        <select
          ref={ref}
          className={clsx(
            'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-700',
            error
              ? 'ring-red-300 focus:ring-red-500'
              : 'ring-gray-300 dark:ring-gray-600 focus:ring-indigo-600',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';