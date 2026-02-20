import type { Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'InvoiceMaster - Smart Invoicing',
  description: 'Self-hosted invoicing application built for ZimaOS.',
}

const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

// Only enable Clerk if BOTH keys are present at RUNTIME
const IS_CLERK_ENABLED = !!(CLERK_PUBLISHABLE_KEY && CLERK_SECRET_KEY);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const layoutContent = (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {IS_CLERK_ENABLED && (
          <header className="flex justify-end items-center p-4 gap-4 h-16">
            <SignedOut>
              <SignInButton />
              <SignUpButton>
                <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );

  if (IS_CLERK_ENABLED) {
    return <ClerkProvider>{layoutContent}</ClerkProvider>;
  }

  return layoutContent;
}
