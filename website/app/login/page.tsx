import Link from "next/link";
import { login } from "./actions";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main
      id="main-content"
      style={{ maxWidth: 440, margin: "10vh auto", padding: 24 }}
    >
      <h1>Sign in to your workspace</h1>
      <p>Browse publicly, or sign in to save jobs and track applications.</p>
      <form action={login} style={{ display: "grid", gap: 16 }}>
        <label>
          Email
          <input
            className="text-field"
            name="email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
          />
        </label>
        <label>
          Password
          <input
            className="text-field"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={512}
          />
        </label>
        {error && (
          <p role="alert">
            Sign-in failed. Check your credentials and that the backend is
            running.
          </p>
        )}
        <button className="jr-btn jr-primary">Sign in</button>
      </form>
      <p>
        <Link href="/">Continue browsing jobs</Link>
      </p>
    </main>
  );
}
