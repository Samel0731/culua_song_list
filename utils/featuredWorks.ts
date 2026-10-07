export function videoId(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1).split('/')[0];
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(parsed.hostname)) {
      return parsed.searchParams.get('v') || parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/]+)/)?.[1] || '';
    }
  } catch { /* An invalid URL has no playable video. */ }
  return '';
}
