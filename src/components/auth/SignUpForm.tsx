"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SignUpCredentials } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

export function SignUpForm({ onSwitchToLogin, onSuccess }: SignUpFormProps) {
  const { signUp, isLoading, error, clearError } = useAuth();
  const [credentials, setCredentials] = useState<SignUpCredentials>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<SignUpCredentials>>({});

  const validateForm = (): boolean => {
    const errors: Partial<SignUpCredentials> = {};

    if (!credentials.name.trim()) {
      errors.name = 'Name is required';
    } else if (credentials.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!credentials.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!credentials.password) {
      errors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!credentials.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (credentials.password !== credentials.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    const result = await signUp(credentials);
    if (result.success) {
      // Sign up successful, the context will handle the state update
      onSuccess?.();
    }
  };

  const handleInputChange = (field: keyof SignUpCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto glass-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary-enhanced">
          Create Account
        </CardTitle>
        <CardDescription className="text-secondary-enhanced">
          Sign up to sync your data across devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={credentials.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={cn(
                  "pl-10",
                  validationErrors.name && "border-red-500 focus:border-red-500"
                )}
                disabled={isLoading}
              />
            </div>
            {validationErrors.name && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.name}
              </p>
            )}
          </div>

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
                value={credentials.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={cn(
                  "pl-10",
                  validationErrors.email && "border-red-500 focus:border-red-500"
                )}
                disabled={isLoading}
              />
            </div>
            {validationErrors.email && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={cn(
                  "pl-10 pr-10",
                  validationErrors.password && "border-red-500 focus:border-red-500"
                )}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={credentials.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={cn(
                  "pl-10 pr-10",
                  validationErrors.confirmPassword && "border-red-500 focus:border-red-500"
                )}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          {/* Switch to Login */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary-enhanced hover:text-primary-enhanced/80 font-medium"
                disabled={isLoading}
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
