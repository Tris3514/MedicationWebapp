"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMode?: 'login' | 'signup' | 'forgot-password' | 'reset-password';
  resetToken?: string;
}

export function AuthModal({ isOpen, onClose, onSuccess, defaultMode = 'login', resetToken }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password'>(
    resetToken ? 'reset-password' : defaultMode
  );

  const handleClose = () => {
    setMode(resetToken ? 'reset-password' : defaultMode);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
        <DialogTitle className="sr-only">
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </DialogTitle>
        <div className="relative">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute -top-2 -right-2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Auth Form */}
          {mode === 'login' ? (
            <LoginForm 
              onSwitchToSignUp={() => setMode('signup')} 
              onForgotPassword={() => setMode('forgot-password')}
              onSuccess={onSuccess}
            />
          ) : mode === 'signup' ? (
            <SignUpForm 
              onSwitchToLogin={() => setMode('login')} 
              onSuccess={onSuccess}
            />
          ) : mode === 'forgot-password' ? (
            <ForgotPasswordForm 
              onBackToLogin={() => setMode('login')}
              onSuccess={onSuccess}
            />
          ) : (
            <ResetPasswordForm 
              token={resetToken || ''}
              onBackToLogin={() => setMode('login')}
              onSuccess={onSuccess}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
