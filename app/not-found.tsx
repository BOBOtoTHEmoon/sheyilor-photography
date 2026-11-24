import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="m-0 text-[clamp(64px,12vw,160px)] font-medium leading-none tracking-[-0.055em]">404</h1>
      <p className="mt-4 text-lg text-ink-2">This page doesn&apos;t exist.</p>
      <Link className="btn mt-8" href="/">
        Back to the site
      </Link>
    </main>
  );
}
