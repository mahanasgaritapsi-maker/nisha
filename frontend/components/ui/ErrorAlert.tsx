type ErrorAlertProps = {
  message: string;
  className?: string;
};

export function ErrorAlert({ message, className = "" }: ErrorAlertProps) {
  if (!message) return null;
  return (
    <p
      className={`rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ${className}`}
      role="alert"
    >
      {message}
    </p>
  );
}
