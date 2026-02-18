import { extractResumeTextFromBuffer } from "@/lib/extract/resumeText";

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function download(url: string) {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Referer: "https://employers.indeed.com/",
        Origin: "https://employers.indeed.com",
      },
    });

    if ([500, 502, 503, 504].includes(res.status) && attempt < MAX_RETRIES) {
      await sleep(400 * attempt);
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Download failed: ${res.status} ${res.statusText} | ${text.slice(0, 400)}`
      );
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") || "";
    return { buf, mime, finalUrl: res.url };
  }

  throw new Error("Download failed: max retries exceeded");
}

function htmlDecode(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&#x3D;/g, "=").replace(/&#61;/g, "=");
}

function extractIndeedResumeIdFromHtml(html: string): string | null {
  const clean = htmlDecode(html);

  const meta = clean.match(
    /http-equiv=["']refresh["'][^>]*content=["'][^;]*;\s*url=([^"'>\s]+)/i
  );
  if (meta?.[1]) {
    try {
      const u = new URL(meta[1]);
      const id = u.searchParams.get("id");
      if (id) return id;
    } catch {}
  }

  const dl = clean.match(/\/api\/catws\/public\/resume\/download\?[^"']*id=([^"&]+)/i);
  if (dl?.[1]) return decodeURIComponent(dl[1]);

  const any = clean.match(/[?&]id=([^"&]+)/i);
  if (any?.[1]) return decodeURIComponent(any[1]);

  return null;
}

export async function downloadResumeFromIndeedResumeUrl(resumeUrl: string) {
  const first = await download(resumeUrl);
  const mime = (first.mime || "").toLowerCase();

  if (mime.includes("pdf") || mime.includes("wordprocessingml.document")) return first;

  if (mime.includes("text/html")) {
    const html = first.buf.toString("utf8");
    const id = extractIndeedResumeIdFromHtml(html);
    if (!id) throw new Error("Resume ID not found in Indeed HTML wrapper");

    const downloadUrl = `https://employers.indeed.com/api/catws/public/resume/download?id=${encodeURIComponent(
      id
    )}`;
    return await download(downloadUrl);
  }

  throw new Error(`Unsupported resume mime type: ${first.mime}`);
}

export async function downloadAndExtractResumeText(resumeUrl: string) {
  const { buf, mime, finalUrl } = await downloadResumeFromIndeedResumeUrl(resumeUrl);
  const resumeMime = mime || "";

  const guessedFilename = resumeMime.includes("pdf")
    ? "resume.pdf"
    : resumeMime.includes("wordprocessingml.document")
    ? "resume.docx"
    : resumeMime.includes("text/plain")
    ? "resume.txt"
    : "resume.html";

  const resumeText = await extractResumeTextFromBuffer(buf, resumeMime, guessedFilename);
  return { resumeText, resumeMime, finalUrl };
}
