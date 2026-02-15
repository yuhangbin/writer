/**
 * Convert HTML to Markdown
 * Simple HTML to markdown converter for preview mode
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  let markdown = html;

  // Headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

  // Bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

  // Italic
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Code blocks
  markdown = markdown.replace(
    /<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis,
    '\n```\n$1\n```\n'
  );

  // Inline code
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Unordered lists
  markdown = markdown.replace(/<ul[^>]*>/gi, '');
  markdown = markdown.replace(/<\/ul>/gi, '\n');
  markdown = markdown.replace(/<li[^>]*>/gi, '- ');
  markdown = markdown.replace(/<\/li>/gi, '\n');

  // Ordered lists
  let listIndex = 1;
  markdown = markdown.replace(/<ol[^>]*>/gi, () => {
    listIndex = 1;
    return '';
  });
  markdown = markdown.replace(/<\/ol>/gi, '\n');
  markdown = markdown.replace(/<li[^>]*>/gi, () => {
    return `${listIndex++}. `;
  });

  // Paragraphs
  markdown = markdown.replace(/<p[^>]*>/gi, '');
  markdown = markdown.replace(/<\/p>/gi, '\n\n');

  // Line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&quot;/g, '"');
  markdown = markdown.replace(/&#39;/g, "'");

  // Clean up excessive whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  return markdown.trim();
}
