"use client";

import { useParams } from 'next/navigation';
import { AuthModal } from '@/components/auth/AuthModal';
import { useState } from 'react';

// Generate static params for static export
export async function generateStaticParams() {
  // Return empty array since we can't pre-generate all possible tokens
  return [];
}

export default function ResetPasswordPage() {
  const params = useParams();
  const token = params.token as string;
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Password Reset</h1>
        <p className="text-muted-foreground mb-4">
          Use the form below to reset your password.
        </p>
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
      </div>
    </div>
  );
}
