import { AuthModal } from '@/components/auth/AuthModal';
import { ResetPasswordClient } from './ResetPasswordClient';

// Generate static params for static export
export async function generateStaticParams() {
  // Return empty array since we can't pre-generate all possible tokens
  return [];
}

interface ResetPasswordPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Password Reset</h1>
        <p className="text-muted-foreground mb-4">
          Use the form below to reset your password.
        </p>
        <ResetPasswordClient token={token} />
      </div>
    </div>
  );
}
