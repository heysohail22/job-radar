"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone-state" id="main-content">
      <h1>Something interrupted your radar.</h1>
      <p>Please try loading the workspace again.</p>
      <button className="jr-btn jr-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
