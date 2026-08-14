import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
        <header className="flex h-20 items-center justify-between">
          <div className="text-xl font-bold tracking-tight">
            HostelHub
          </div>

          <Link
            href="/login"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            Sign in
          </Link>
        </header>

        <section className="flex flex-1 items-center py-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-medium text-zinc-400">
              HOSTEL MANAGEMENT PLATFORM
            </p>

            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
              Hostel problems,
              <br />
              <span className="text-zinc-400">
                handled smarter.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              Report complaints, track progress, receive announcements,
              and keep your hostel running smoothly.
            </p>

            <div className="mt-10 flex gap-4">
              <Link
                href="/login"
                className="rounded-lg bg-white px-6 py-3 font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                Get started
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-zinc-800 py-6 text-sm text-zinc-500">
          HostelHub
        </footer>
      </div>
    </main>
  );
}