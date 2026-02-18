import * as mammoth from "mammoth";

let pdfParseFn: any = null;

async function getPdfParse() {
  if (!pdfParseFn) {
    const mod = require("pdf-parse/lib/pdf-parse");
    pdfParseFn = mod.default || mod;
  }
  return pdfParseFn;
}

export async function extractResumeTextFromBuffer(
  buf: Buffer,
  mime?: string,
  filename?: string
) {
  const name = (filename || "").toLowerCase();
  const type = (mime || "").toLowerCase();

  if (type.includes("pdf") || name.endsWith(".pdf")) {
    try {
      const pdfParse = await getPdfParse();
      const data = await pdfParse(buf);

      return (data.text || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200_000);
    } catch (e: any) {
      throw new Error(`PDF parse failed: ${e?.message || e}`);
    }
  }

  if (type.includes("wordprocessingml.document") || name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer: buf });
    return (result.value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200_000);
  }

  if (type.includes("text/plain") || name.endsWith(".txt")) {
    return buf.toString("utf8").slice(0, 200_000);
  }

  if (type.includes("text/html") || name.endsWith(".html")) {
    const html = buf.toString("utf8");
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200_000);
  }

  throw new Error(`Unsupported resume type: ${type || "unknown"}`);
}
