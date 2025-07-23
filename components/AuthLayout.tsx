'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

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
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          {backLink && (
            <Link href={backLink.href} className="back-link">
              ← {backLink.text}
            </Link>
          )}
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgb(var(--background-rgb));
          padding: 1rem;
        }

        .auth-container {
          background: rgb(var(--card-bg-rgb));
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 420px;
          border: 1px solid var(--border-color);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .back-link {
          display: inline-block;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--text-primary);
        }

        .auth-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          color: var(--text-primary);
        }

        .auth-header p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        @media (max-width: 480px) {
          .auth-container {
            padding: 1.5rem;
          }
          
          .auth-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

interface AuthFormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
}

export function AuthForm({ onSubmit, children }: AuthFormProps) {
  return (
    <>
      <form onSubmit={onSubmit} className="auth-form">
        {children}
      </form>
      <style jsx>{`
        .auth-form {
          margin-bottom: 2rem;
        }
      `}</style>
    </>
  );
}

interface FormGroupProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
}

export function FormGroup({ label, htmlFor, children }: FormGroupProps) {
  return (
    <>
      <div className="form-group">
        <label htmlFor={htmlFor}>{label}</label>
        {children}
      </div>
      <style jsx>{`
        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }
      `}</style>
    </>
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

export function FormInput({ id, type, value, onChange, placeholder, required, disabled, minLength, maxLength }: FormInputProps) {
  return (
    <>
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
      />
      <style jsx>{`
        input {
          width: 100%;
          padding: 1rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 1rem;
          background: rgb(var(--background-rgb));
          color: var(--text-primary);
          transition: all 0.2s;
        }

        input:focus {
          outline: none;
          border-color: rgb(230, 168, 0);
          box-shadow: 0 0 0 2px rgba(230, 168, 0, 0.2);
        }

        input:disabled {
          background: var(--border-color);
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}

interface ErrorMessageProps {
  children: ReactNode;
}

export function ErrorMessage({ children }: ErrorMessageProps) {
  return (
    <>
      <div className="error-message">
        {children}
      </div>
      <style jsx>{`
        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          border: 1px solid #fecaca;
        }
      `}</style>
    </>
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

export function AuthButton({ type = 'button', disabled, loading, children, onClick, variant = 'primary' }: AuthButtonProps) {
  return (
    <>
      <button 
        type={type}
        className={`auth-button ${variant}`}
        disabled={disabled || loading}
        onClick={onClick}
      >
        {children}
      </button>
      <style jsx>{`
        .auth-button {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .auth-button.primary {
          background: rgb(230, 168, 0);
          color: white;
        }

        .auth-button.primary:hover:not(:disabled) {
          background: rgba(230, 168, 0, 0.9);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(230, 168, 0, 0.3);
        }

        .auth-button:disabled {
          background: var(--border-color);
          color: var(--text-tertiary);
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </>
  );
}

interface AuthLinksProps {
  children: ReactNode;
}

export function AuthLinks({ children }: AuthLinksProps) {
  return (
    <>
      <div className="auth-links">
        {children}
      </div>
      <style jsx>{`
        .auth-links {
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .auth-links :global(p) {
          margin: 0.5rem 0;
        }

        .auth-links :global(.link) {
          color: rgb(230, 168, 0);
          text-decoration: none;
          font-weight: 600;
          margin-left: 0.5rem;
          transition: color 0.2s;
        }

        .auth-links :global(.link:hover) {
          color: rgba(230, 168, 0, 0.8);
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}

interface SuccessMessageProps {
  title: string;
  children: ReactNode;
}

export function SuccessMessage({ title, children }: SuccessMessageProps) {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="success-message">
          <h2>{title}</h2>
          {children}
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgb(var(--background-rgb));
          padding: 1rem;
        }

        .auth-container {
          background: rgb(var(--card-bg-rgb));
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 420px;
          text-align: center;
          border: 1px solid var(--border-color);
        }

        .success-message h2 {
          color: #28a745;
          margin-bottom: 1rem;
          font-size: 2rem;
        }

        .success-message :global(p) {
          color: var(--text-primary);
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .success-message :global(.note) {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        .success-message :global(.success-actions) {
          margin-top: 2rem;
        }

        .success-message :global(.auth-button) {
          display: inline-block;
          width: 100%;
          padding: 1rem;
          background: rgb(230, 168, 0);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin-bottom: 1rem;
          transition: all 0.2s;
          font-size: 1rem;
        }

        .success-message :global(.auth-button:hover) {
          background: rgba(230, 168, 0, 0.9);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(230, 168, 0, 0.3);
        }

        .success-message :global(.link) {
          color: rgb(230, 168, 0);
          text-decoration: none;
          transition: color 0.2s;
        }

        .success-message :global(.link:hover) {
          color: rgba(230, 168, 0, 0.8);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}