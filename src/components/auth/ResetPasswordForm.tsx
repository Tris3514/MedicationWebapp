"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResetPasswordFormProps {
  token: string;
  onSuccess?: () => void;
  onBackToLogin: () => void;
}

export function ResetPasswordForm({ token, onSuccess, onBackToLogin }: ResetPasswordFormProps) {
  const [inputToken, setInputToken] = useState(token || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isTokenValidated, setIsTokenValidated] = useState(!!token);

  useEffect(() => {
    // Verify token on mount if provided
    if (token) {
      const resetTokens = JSON.parse(localStorage.getItem('reset_tokens') || '[]');
      const validToken = resetTokens.find((t: any) => 
        t.token === token && t.expiresAt > Date.now()
      );

      if (validToken) {
        setIsTokenValidated(true);
      } else {
        setError('Invalid or expired reset token.');
      }
    }
  }, [token]);

  const validateToken = () => {
    if (!inputToken.trim()) {
      setError('Please enter a reset token.');
      return;
    }

    const resetTokens = JSON.parse(localStorage.getItem('reset_tokens') || '[]');
    const validToken = resetTokens.find((t: any) => 
      t.token === inputToken && t.expiresAt > Date.now()
    );

    if (validToken) {
      setIsTokenValidated(true);
      setError(null);
    } else {
      setError('Invalid or expired reset token.');
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Verify token again
      const resetTokens = JSON.parse(localStorage.getItem('reset_tokens') || '[]');
      const tokenToUse = token || inputToken;
      const validToken = resetTokens.find((t: any) => 
        t.token === tokenToUse && t.expiresAt > Date.now()
      );

      if (!validToken) {
        setError('Invalid or expired reset link. Please request a new one.');
        setIsLoading(false);
        return;
      }

      // Update user password
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = existingUsers.findIndex((u: any) => u.email === validToken.email);
      
      if (userIndex === -1) {
        setError('User not found. Please request a new reset link.');
        setIsLoading(false);
        return;
      }

      // Update password
      existingUsers[userIndex].password = password;
      existingUsers[userIndex].lastPasswordChange = new Date().toISOString();
      localStorage.setItem('users', JSON.stringify(existingUsers));

      // Remove used token
      const updatedTokens = resetTokens.filter((t: any) => t.token !== tokenToUse);
      localStorage.setItem('reset_tokens', JSON.stringify(updatedTokens));

      setIsSuccess(true);
      setIsLoading(false);

      // Auto-close modal after 3 seconds
      setTimeout(() => {
        onSuccess?.();
      }, 3000);

    } catch (error) {
      setError('Failed to reset password. Please try again.');
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
            Password Reset Successfully
          </CardTitle>
          <CardDescription>
            Your password has been updated. You can now sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onBackToLogin}
            className="w-full"
          >
            Continue to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error && !isLoading) {
    return (
      <Card className="glass-card w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-primary-enhanced">
            Reset Link Invalid
          </CardTitle>
          <CardDescription>
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onBackToLogin}
            className="w-full"
          >
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
          Set New Password
        </CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Token Field - only show if no token provided initially */}
          {!token && (
            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-medium">
                Reset Token
              </Label>
              <div className="flex gap-2">
                <Input
                  id="token"
                  type="text"
                  placeholder="Enter your reset token"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  className="flex-1"
                  disabled={isLoading || isTokenValidated}
                />
                {!isTokenValidated && (
                  <Button
                    type="button"
                    onClick={validateToken}
                    disabled={isLoading || !inputToken.trim()}
                    variant="outline"
                  >
                    Validate
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn("pl-10 pr-10", validationErrors.password && "border-red-500")}
                required
                disabled={isLoading || (!token && !isTokenValidated)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-sm text-red-500">{validationErrors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn("pl-10 pr-10", validationErrors.confirmPassword && "border-red-500")}
                required
                disabled={isLoading || (!token && !isTokenValidated)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-sm text-red-500">{validationErrors.confirmPassword}</p>
            )}
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
            disabled={isLoading || !password || !confirmPassword || (!token && !isTokenValidated)}
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </Button>

          {/* Back to Login */}
          <Button
            type="button"
            variant="ghost"
            onClick={onBackToLogin}
            className="w-full"
            disabled={isLoading}
          >
            Back to Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
