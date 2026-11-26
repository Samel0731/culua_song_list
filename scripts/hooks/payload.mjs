// Hook payloads differ between agents: Claude Code sends tool_input.file_path,
// Codex sends an apply_patch body in tool_input.command.
const patchHeader = /^\*\*\* (?:Add File|Update File|Move to): (.+?)\s*$/gm;

export function editedPaths(payload) {
  const input = payload?.tool_input ?? {};
  if (typeof input.file_path === 'string') return [input.file_path];
  const patch = typeof input.command === 'string' ? input.command : Array.isArray(input.command) ? input.command.join('\n') : '';
  return [...new Set([...patch.matchAll(patchHeader)].map(match => match[1]))];
}
