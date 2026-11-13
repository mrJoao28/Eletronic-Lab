const codes = new Set([
  'graphics-render',
  'graphics-context',
  'runtime-error',
  'unhandled-rejection',
]);
export async function POST(request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return new Response(null, { status: 415 });
  // Bound streamed input too; Content-Length is not trusted.
  let size = 0,
    body = '';
  if (!request.body) return new Response(null, { status: 400 });
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 256) {
      await reader.cancel();
      return new Response(null, { status: 413 });
    }
    body += decoder.decode(value, { stream: true });
  }
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!data || Object.keys(data).length !== 1 || !codes.has(data.code))
    return new Response(null, { status: 400 });
  console.error(
    JSON.stringify({
      event: 'lab-client-failure',
      code: data.code,
      release: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    }),
  );
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
