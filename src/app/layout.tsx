import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { UserDataProvider } from '@/contexts/UserDataContext'

export const metadata: Metadata = {
  title: 'Medication Tracker',
  description: 'Track your daily medications and pill counts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-helvetica">
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <UserDataProvider>
              {children}
            </UserDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
