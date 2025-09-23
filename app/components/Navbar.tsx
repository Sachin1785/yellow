"use client";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav
      className="fixed top-0 left-1/2 z-50 -translate-x-1/2 w-[95vw] max-w-3xl bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-float rounded-2xl flex items-center justify-between px-8 py-3 mx-auto"
      style={{
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.12)',
      }}
    >
      <Link
        href="/"
        className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 select-none"
        style={{ letterSpacing: '-0.04em' }}
      >
        CryptoBazaar
      </Link>
      <div className="flex items-center gap-2">
        <SignedOut>
          <SignInButton mode="modal">
            <button
              className="px-5 py-2 rounded-xl bg-zinc-900/90 dark:bg-zinc-100/90 text-zinc-100 dark:text-zinc-900 font-semibold shadow hover:bg-zinc-800/90 dark:hover:bg-zinc-200/90 transition-colors border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400/40"
            >
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="px-4 py-2 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors font-medium"
            >
              Profile
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors font-medium"
            >
              Settings
            </Link>
            <div className="ml-2">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </SignedIn>
      </div>
    </nav>
  );
}
