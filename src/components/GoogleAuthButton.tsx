interface GoogleAuthButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  compact?: boolean;
}

export function GoogleAuthButton({
  onClick,
  loading = false,
  label = 'Continue with Google',
  compact = false,
}: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2.5 rounded-lg border border-[#DDD7CC] bg-white font-medium text-[#141414] whitespace-nowrap shrink-0 transition-colors hover:border-[#141414]/30 hover:bg-[#F5F2EC] disabled:opacity-60 ${
        compact ? 'px-3.5 py-2 text-xs' : 'px-4 py-2.5 text-sm'
      }`}
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.54-5.17 3.54-8.89Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3.02c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.95H1.28v3.11A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.27V6.62H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4-3.11Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.78c1.76 0 3.34.61 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4 3.11C6.23 6.89 8.88 4.78 12 4.78Z"
        />
      </svg>
      <span>{loading ? 'Signing in...' : label}</span>
    </button>
  );
}
