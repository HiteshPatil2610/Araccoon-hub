/** Eagerly loaded so a failed route chunk still has a usable recovery screen. */
export function PageLoadError() {
  return (
    <main className="min-h-screen bg-bg text-fg flex items-center justify-center p-6">
      <div className="max-w-lg w-full panel p-6 sm:p-8">
        <p className="eyebrow text-red mb-3">Raccoon Hub</p>
        <h1 className="text-4xl sm:text-5xl">This page couldn’t load</h1>
        <p role="alert" className="text-muted-fg mt-4">
          Check your connection and reload the page. If you’re running locally, make sure the development server is still running.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reload page</button>
          <a href="/" className="btn">Back to the finds</a>
        </div>
      </div>
    </main>
  );
}
