"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M8.111 8.111A3 3 0 005 12m3.111-3.889A6 6 0 0118 12m-9 0a3 3 0 106 0m-3-9v.01M12 21v.01" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-zinc-900 mb-2">You're offline</h1>
        <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">
          Check your connection and try again. Your data will sync when you're back online.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
