/**
 * Strips ANSI escape sequences from terminal output.
 */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
}

/**
 * Heuristically identifies and removes common progress bar patterns
 * and terminal-intensive status lines to save tokens.
 *
 * Patterns handled:
 * - [====>    ]
 * - 45% [########      ]
 * - Downloaded: 1.2MB / 10MB
 */
export function filterProgressBars(text: string): string {
  const lines = text.split("\n");
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    // 1. Classic progress bar: [========>    ]
    if (/\[[=#>-]+\s*\]/.test(trimmed)) return false;
    
    // 2. Percent-based bar: 45% [#######    ]
    if (/\d+%\s*\[[#\s]+\]/.test(trimmed)) return false;
    
    // 3. Spinner/Activity lines: | / - \ (if occurring frequently)
    // 4. Download status lines: 1.2MB / 10MB (120KB/s)
    if (/\d+\.?\d*[KMG]B\s*\/\s*\d+\.?\d*[KMG]B/.test(trimmed)) return false;

    return true;
  });
  
  return filtered.join("\n");
}

/**
 * Combined sanitization for terminal output.
 */
export function sanitizeTerminalOutput(text: string): string {
  if (!text) return text;
  
  // 1. Strip ANSI escape codes
  let sanitized = stripAnsi(text);
  
  // 2. Filter progress bars
  sanitized = filterProgressBars(sanitized);
  
  // 3. Normalize repetitive whitespace/newlines (basic compaction)
  sanitized = sanitized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  return sanitized;
}
