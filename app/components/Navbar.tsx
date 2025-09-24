"use client";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-40 w-full border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="h-10 w-10 rounded-full bg-lime-400 flex items-center justify-center"
          >
            <DollarSign className="h-6 w-6 text-black" />
          </motion.div>
          <Link href="/" className="font-bold text-xl text-lime-400 select-none">
            CryptoBazaar
          </Link>
        </div>        <nav className="hidden md:flex gap-8">
          <a href="#features" className="text-sm font-medium transition-colors hover:text-lime-400">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium transition-colors hover:text-lime-400">
            How It Works
          </a>
          <Link href="/exchange" className="text-sm font-medium transition-colors hover:text-lime-400">
            P2P Trading
          </Link>
          <a href="#testimonials" className="text-sm font-medium transition-colors hover:text-lime-400">
            Reviews
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className="px-5 py-2 rounded-xl bg-lime-400 text-black font-semibold shadow hover:bg-lime-300 transition-colors border border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/40"
              >
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="px-4 py-2 rounded-lg text-lime-400 hover:bg-lime-400/10 transition-colors font-medium"
              >
                Profile
              </Link>
              <Link
                href="/settings"
                className="px-4 py-2 rounded-lg text-lime-400 hover:bg-lime-400/10 transition-colors font-medium"
              >
                Settings
              </Link>
              <div className="ml-2">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </SignedIn>
        </div>
      </div>
    </motion.header>
  );
}
