import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 lg:py-0">
        <div className="mx-auto grid w-[350px] gap-6">
            {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center flex-col p-8 text-center">
        <Link
            href="/"
            className="group flex items-center justify-center gap-4 mb-8"
        >
            <svg
            className="h-10 w-10 text-primary transition-all group-hover:scale-110"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            >
            <path
                d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M12 12L22 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M12 12V22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M12 12L2 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M17 4.5L7 9.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            </svg>
            <span className="text-4xl font-headline font-bold text-foreground">ProspectIQ</span>
        </Link>
        <Image 
          src="https://placehold.co/600x400.png"
          alt="Futuristic abstract graphic"
          width={600}
          height={400}
          className="rounded-lg shadow-2xl shadow-primary/20"
          data-ai-hint="futuristic abstract"
        />
        <p className="mt-8 text-lg text-muted-foreground">
          The next generation of AI-powered lead generation.
        </p>
      </div>
    </div>
  );
}
