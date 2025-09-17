"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ onBackToLogin, onSuccess }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Check if user exists
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const user = existingUsers.find((u: any) => u.email === email);

      if (!user) {
        setError('No account found with this email address');
        setIsLoading(false);
        return;
      }

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate verification token
      const token = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes

      // Store reset token
      const resetTokens = JSON.parse(localStorage.getItem('reset_tokens') || '[]');
      resetTokens.push({
        email,
        token,
        expiresAt,
        createdAt: Date.now()
      });
      localStorage.setItem('reset_tokens', JSON.stringify(resetTokens));

      setResetToken(token);
      setIsSuccess(true);
      setIsLoading(false);

      // Auto-close modal after 3 seconds
      setTimeout(() => {
        onSuccess?.();
      }, 3000);

    } catch (error) {
      setError('Failed to send reset email. Please try again.');
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="glass-card w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-primary-enhanced">
            Check Your Email
          </CardTitle>
          <CardDescription>
            We&apos;ve sent password reset instructions to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center space-y-2">
            <p>Click the link in the email to reset your password.</p>
            <p className="text-xs">
              <strong>Note:</strong> In a real app, you would receive an actual email. 
              For development purposes, you can use this reset link:
            </p>
            <div className="mt-3 p-2 bg-muted rounded text-xs break-all">
              <p className="text-primary-enhanced">
                Reset Token: {resetToken}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy this token and use it in the reset form below.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onBackToLogin}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-semibold text-primary-enhanced">
          Reset Password
        </CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-md">
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          {/* Back to Login */}
          <Button
            type="button"
            variant="ghost"
            onClick={onBackToLogin}
            className="w-full"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
