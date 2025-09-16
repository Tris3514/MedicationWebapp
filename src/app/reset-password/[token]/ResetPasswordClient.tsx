"use client";

import { AuthModal } from '@/components/auth/AuthModal';
import { useState } from 'react';

interface ResetPasswordClientProps {
  token: string;
}

export function ResetPasswordClient({ token }: ResetPasswordClientProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <AuthModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      defaultMode="reset-password"
      resetToken={token}
      onSuccess={() => {
        setIsOpen(false);
        // Redirect to login or home page
        window.location.href = '/';
      }}
    />
  );
}
