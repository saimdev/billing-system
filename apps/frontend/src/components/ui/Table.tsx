import React from 'react';
import { clsx } from 'clsx';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  header?: boolean;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-hidden ring-1 ring-gray-300 dark:ring-gray-600 rounded-lg">
      <table className={clsx('min-w-full divide-y divide-gray-300 dark:divide-gray-600', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={clsx('bg-gray-50 dark:bg-gray-700', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={clsx('divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800', className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, clickable, onClick }: TableRowProps) {
  return (
    <tr
      className={clsx(
        clickable && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className, header }: TableCellProps) {
  const Component = header ? 'th' : 'td';
  
  return (
    <Component
      className={clsx(
        'px-6 py-4 text-sm',
        header
          ? 'font-semibold text-gray-900 dark:text-white text-left'
          : 'text-gray-900 dark:text-gray-300',
        className
      )}
    >
      {children}
    </Component>
  );
}