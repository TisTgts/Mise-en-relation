import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const AuthError = ({ message }) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
      <span>{message}</span>
    </div>
  );
};

export default AuthError;
