const METHODS_PATTERNS = [
  "material",
  "method",
  "experimental procedure",
  "experimental design",
  "study design",
  "animals",
  "subjects",
  "patients",
  "protocol",
];

const RESULTS_PATTERNS = ["result", "finding", "outcome"];

function stripComments(xml: string): string {
  return xml.replace(/<!--[\s\S]*?-->/g, "");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
}

function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function cleanText(text: string): string {
  return normalizeWhitespace(stripTags(decodeEntities(text)));
}

function extractSectionByPatterns(xml: string, patterns: string[]): string {
  const cleaned = stripComments(xml);
  const sections: string[] = [];

  const secRegex = /<sec[^>]*>/gi;
  let match;

  while ((match = secRegex.exec(cleaned)) !== null) {
    const startPos = match.index;
    const afterOpenTag = startPos + match[0].length;

    const titleMatch = cleaned.slice(afterOpenTag, afterOpenTag + 500).match(/<title[^>]*>([\s\S]*?)<\/title>/i);

    if (!titleMatch) continue;

    const titleText = cleanText(titleMatch[1]).toLowerCase();
    const matchesPattern = patterns.some((p) => titleText.includes(p.toLowerCase()));

    if (!matchesPattern) continue;

    let depth = 1;
    let pos = afterOpenTag;
    let endPos = -1;

    while (pos < cleaned.length && depth > 0) {
      const openMatch = cleaned.slice(pos).match(/<sec[^>]*>/i);
      const closeMatch = cleaned.slice(pos).match(/<\/sec>/i);

      if (!closeMatch) break;

      const openIdx = openMatch ? pos + openMatch.index! : Infinity;
      const closeIdx = pos + closeMatch.index!;

      if (openIdx < closeIdx) {
        depth++;
        pos = openIdx + 1;
      } else {
        depth--;
        if (depth === 0) {
          endPos = closeIdx + 6;
        }
        pos = closeIdx + 1;
      }
    }

    if (endPos > startPos) {
      const sectionContent = cleaned.slice(startPos, endPos);
      sections.push(cleanText(sectionContent));
    }
  }

  return sections.join("\n\n");
}

export function extractMethodsSection(xml: string): string {
  return extractSectionByPatterns(xml, METHODS_PATTERNS);
}

export function extractResultsSection(xml: string): string {
  return extractSectionByPatterns(xml, RESULTS_PATTERNS);
}

export function extractFigureLegends(xml: string): string {
  const cleaned = stripComments(xml);
  const legends: string[] = [];

  const figRegex = /<fig[^>]*>[\s\S]*?<\/fig>/gi;
  let match;

  while ((match = figRegex.exec(cleaned)) !== null) {
    const figContent = match[0];

    const labelMatch = figContent.match(/<label[^>]*>([\s\S]*?)<\/label>/i);
    const captionMatch = figContent.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i);

    const label = labelMatch ? cleanText(labelMatch[1]) : "";
    const caption = captionMatch ? cleanText(captionMatch[1]) : "";

    if (label || caption) {
      legends.push(`${label} ${caption}`.trim());
    }
  }

  return legends.join("\n\n");
}
