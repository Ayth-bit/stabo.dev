'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  backLink?: {
    href: string;
    text: string;
  };
}

export function AuthLayout({ children, title, subtitle, backLink }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
      <div className="card p-8 shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          {backLink && (
            <Link href={backLink.href} className="inline-block text-secondary text-sm mb-4 transition-colors hover:text-accent">
              ← {backLink.text}
            </Link>
          )}
          <h1 className="m-0 mb-2 text-2xl text-primary font-bold">{title}</h1>
          <p className="m-0 text-secondary text-sm">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

interface AuthFormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
}

export function AuthForm({ onSubmit, children }: AuthFormProps) {
  return (
    <form onSubmit={onSubmit} className="mb-8">
      {children}
    </form>
  );
}

interface FormGroupProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
}

export function FormGroup({ label, htmlFor, children }: FormGroupProps) {
  return (
    <div className="mb-6">
      <label htmlFor={htmlFor} className="block mb-2 font-semibold text-primary">{label}</label>
      {children}
    </div>
  );
}

interface FormInputProps {
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
}

export function FormInput({
  id,
  type,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  minLength,
  maxLength,
}: FormInputProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      minLength={minLength}
      maxLength={maxLength}
      className="input-field"
    />
  );
}

interface ErrorMessageProps {
  children: ReactNode;
}

export function ErrorMessage({ children }: ErrorMessageProps) {
  return (
    <div className="message-error mb-4 text-sm">{children}</div>
  );
}

interface AuthButtonProps {
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function AuthButton({
  type = 'button',
  disabled,
  loading,
  children,
  onClick,
  variant = 'primary',
}: AuthButtonProps) {
  const baseClasses = "w-full text-base cursor-pointer no-underline inline-block text-center";
  const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClass}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface AuthLinksProps {
  children: ReactNode;
}

export function AuthLinks({ children }: AuthLinksProps) {
  return (
    <div className="text-center text-secondary text-sm">{children}</div>
  );
}

interface SuccessMessageProps {
  title: string;
  children: ReactNode;
}

export function SuccessMessage({ title, children }: SuccessMessageProps) {
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
      <div className="card p-8 shadow-lg w-full max-w-md text-center">
        <div>
          <h2 className="text-green-600 mb-4 text-2xl font-bold">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
