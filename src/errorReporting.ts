export type FailureCode =
  'graphics-render' | 'graphics-context' | 'runtime-error' | 'unhandled-rejection';
const allowed = new Set<FailureCode>([
  'graphics-render',
  'graphics-context',
  'runtime-error',
  'unhandled-rejection',
]);
/** Only fixed categories leave the browser: no messages, stack traces or project data. */
export function createErrorReporter(send: (code: FailureCode) => void) {
  const sent = new Set<FailureCode>();
  return (code: FailureCode) => {
    if (!allowed.has(code) || sent.has(code)) return;
    sent.add(code);
    try {
      send(code);
    } catch {
      /* Reporting must never break recovery. */
    }
  };
}
export const reportFailure = createErrorReporter((code) => {
  if (!__LAB_PRODUCTION__) return;
  void fetch('/api/client-errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
    keepalive: true,
  }).catch(() => {});
});
export function installErrorReporting() {
  const error = () => reportFailure('runtime-error');
  const rejection = () => reportFailure('unhandled-rejection');
  window.addEventListener('error', error);
  window.addEventListener('unhandledrejection', rejection);
  return () => {
    window.removeEventListener('error', error);
    window.removeEventListener('unhandledrejection', rejection);
  };
}
