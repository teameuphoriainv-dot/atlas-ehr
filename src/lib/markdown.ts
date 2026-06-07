/**
 * Tiny, safe markdown → HTML for agent replies. Handles bold, italic, inline code,
 * bullet lists, and headings. Escapes HTML first so model output can't inject markup.
 */
function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function mdToHtml(src: string): string {
  const lines = src.split(/\r?\n/);
  let html = "";
  let inList = false;
  const closeList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (/^[-*•]\s+/.test(line)) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += "<li>" + inline(line.replace(/^[-*•]\s+/, "")) + "</li>";
      continue;
    }
    closeList();
    if (!line) continue;
    if (/^#{1,4}\s+/.test(line)) {
      html += "<h4>" + inline(line.replace(/^#{1,4}\s+/, "")) + "</h4>";
      continue;
    }
    html += "<p>" + inline(line) + "</p>";
  }
  closeList();
  return html;
}
