export default function Loading() {
  return (
    <main
      className="standalone-state loading-state"
      id="main-content"
      role="status"
      aria-label="Loading your job radar"
    >
      <span className="jr-eyebrow">JOBRADAR</span>
      <h1>Finding your next move…</h1>
      <div className="loading-skeleton" />
      <div className="loading-skeleton" />
      <p>Loading your workspace.</p>
    </main>
  );
}
