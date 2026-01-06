import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const SOURCE_URL = "https://riftbound.leagueoflegends.com/en-us/card-gallery/";
const OUTPUT_DIR = "src/assets/card-art";
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, "..", OUTPUT_DIR);

const imageRegex = /(https?:\/\/[^"'\s]+\.(?:png|jpe?g|webp))(\?[^"'\s]*)?/gi;

const isCardLike = (url) =>
  url.includes("card") || url.includes("art") || url.includes("card-gallery");

const fetchHtml = async () => {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status} ${response.statusText}`);
  }

  return response.text();
};

const extractNextData = (html) => {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i
  );
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch (error) {
    console.warn("Unable to parse __NEXT_DATA__ JSON.", error);
    return null;
  }
};

const collectImageUrls = (node, urls = new Set()) => {
  if (!node) {
    return urls;
  }

  if (typeof node === "string") {
    const matches = node.match(imageRegex);
    if (matches) {
      matches.forEach((url) => {
        if (isCardLike(url)) {
          urls.add(url.split("?")[0]);
        }
      });
    }
    return urls;
  }

  if (Array.isArray(node)) {
    node.forEach((item) => collectImageUrls(item, urls));
    return urls;
  }

  if (typeof node === "object") {
    Object.values(node).forEach((value) => collectImageUrls(value, urls));
  }

  return urls;
};

const collectFromHtml = (html) => {
  const urls = new Set();
  let match;
  while ((match = imageRegex.exec(html))) {
    if (isCardLike(match[1])) {
      urls.add(match[1].split("?")[0]);
    }
  }
  return urls;
};

const ensureDir = async (dir) => {
  await fs.promises.mkdir(dir, { recursive: true });
};

const sanitizeFilename = (url, seen) => {
  const base = path.basename(new URL(url).pathname);
  if (!seen.has(base)) {
    seen.add(base);
    return base;
  }

  const extension = path.extname(base);
  const name = path.basename(base, extension);
  let counter = 1;
  let candidate = `${name}-${counter}${extension}`;

  while (seen.has(candidate)) {
    counter += 1;
    candidate = `${name}-${counter}${extension}`;
  }

  seen.add(candidate);
  return candidate;
};

const downloadImages = async (urls) => {
  const manifest = [];
  const seenNames = new Set();

  for (const url of urls) {
    const fileName = sanitizeFilename(url, seenNames);
    const filePath = path.join(outputPath, fileName);

    const response = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      console.warn(`Skipping ${url}: ${response.status} ${response.statusText}`);
      continue;
    }

    const arrayBuffer = await response.arrayBuffer();
    await fs.promises.writeFile(filePath, Buffer.from(arrayBuffer));

    manifest.push({ url, file: path.join(OUTPUT_DIR, fileName) });
    console.log(`Saved ${fileName}`);
  }

  await fs.promises.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
};

const main = async () => {
  await ensureDir(outputPath);

  const html = await fetchHtml();
  const nextData = extractNextData(html);
  const urls = new Set();

  if (nextData) {
    collectImageUrls(nextData, urls);
  }

  if (urls.size === 0) {
    collectFromHtml(html).forEach((url) => urls.add(url));
  }

  if (urls.size === 0) {
    throw new Error("No card art URLs found. The page structure may have changed.");
  }

  console.log(`Found ${urls.size} card art URLs.`);
  await downloadImages(urls);
  console.log(`Saved manifest to ${MANIFEST_PATH}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
