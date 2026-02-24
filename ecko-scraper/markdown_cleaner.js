import { remark } from "remark";
import { visit } from "unist-util-visit";

/**
 * Clean markdown content for LLM ingestion.
 * Removes:
 * - Code blocks
 * - Images
 * - HTML
 * - Excess whitespace
 * Keeps:
 * - Headings
 * - Paragraphs
 * - Lists
 */
export async function cleanMarkdown(markdown) {
  const tree = remark().parse(markdown);

  let cleanedContent = [];

  visit(tree, (node) => {
    switch (node.type) {
      case "heading":
        cleanedContent.push(
          "\n## " + node.children.map(c => c.value || "").join("")
        );
        break;

      case "paragraph":
        cleanedContent.push(
          node.children.map(c => c.value || "").join("")
        );
        break;

      case "listItem":
        cleanedContent.push(
          "- " + node.children
            .map(child => {
              if (child.type === "paragraph") {
                return child.children.map(c => c.value || "").join("");
              }
              return "";
            })
            .join("")
        );
        break;

      case "code":
        // Ignore code blocks completely
        break;

      case "image":
        // Ignore images
        break;

      default:
        break;
    }
  });

  return cleanedContent
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+/g, " ")
    .trim();
}