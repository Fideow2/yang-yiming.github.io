import type {
  EntryCollectionId,
  EntryFrontmatter,
  EntryKind,
  EntryOpenMode,
  EntryRecord,
  SectionItem,
} from "../types";
import blogManifestSource from "./blog/blog.toml?raw";

const lifeEntryModules = import.meta.glob("./life/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const blogEntryModules = import.meta.glob("./blog/*/index.{md,html}", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const requiredFrontmatterFields = ["title", "summary", "meta"] as const;
const entryKinds = ["markdown", "html", "app", "link"] as const;
const entryOpenModes = ["entry", "iframe", "native"] as const;

interface BlogManifestEntry extends EntryFrontmatter {
  kind: EntryKind;
  open?: EntryOpenMode;
  slug: string;
  source?: string;
  href?: string;
}

function parseFrontmatter(source: string) {
  const trimmedSource = source.trim();

  if (!trimmedSource.startsWith("---")) {
    throw new Error("Entry markdown must start with frontmatter.");
  }

  const closingMarkerIndex = trimmedSource.indexOf("\n---", 3);

  if (closingMarkerIndex === -1) {
    throw new Error("Entry markdown frontmatter must end with ---.");
  }

  const frontmatterBlock = trimmedSource.slice(3, closingMarkerIndex).trim();
  const content = trimmedSource.slice(closingMarkerIndex + 4).trim();
  const frontmatter = Object.fromEntries(
    frontmatterBlock
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf(":");

        if (separatorIndex === -1) {
          throw new Error(`Invalid frontmatter line: ${line}`);
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line
          .slice(separatorIndex + 1)
          .trim()
          .replace(/^["']|["']$/g, "");

        return [key, value];
      }),
  ) as Partial<EntryFrontmatter>;

  requiredFrontmatterFields.forEach((field) => {
    if (!frontmatter[field]) {
      throw new Error(`Missing frontmatter field: ${field}`);
    }
  });

  return {
    frontmatter: frontmatter as EntryFrontmatter,
    content,
  };
}

function pathToSlug(path: string) {
  return path.split("/").pop()?.replace(/\.md$/, "") ?? path;
}

function normalizeManifestSource(path: string) {
  return path.replace(/^\.\//, "./blog/");
}

function parseStringValue(value: string, line: string) {
  const trimmedValue = value.trim();

  if (!/^".*"$/.test(trimmedValue)) {
    throw new Error(`Invalid TOML string value: ${line}`);
  }

  return trimmedValue
    .slice(1, -1)
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function isEntryKind(value: string): value is EntryKind {
  return entryKinds.includes(value as EntryKind);
}

function isEntryOpenMode(value: string): value is EntryOpenMode {
  return entryOpenModes.includes(value as EntryOpenMode);
}

function parseBlogManifest(source: string): BlogManifestEntry[] {
  const entries: Record<string, string>[] = [];
  let currentEntry: Record<string, string> | null = null;

  source.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      return;
    }

    if (line === "[[entries]]") {
      currentEntry = {};
      entries.push(currentEntry);
      return;
    }

    if (!currentEntry) {
      throw new Error("Blog manifest fields must be inside [[entries]].");
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      throw new Error(`Invalid TOML line: ${line}`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = parseStringValue(line.slice(separatorIndex + 1), line);
    currentEntry[key] = value;
  });

  return entries.map((entry) => {
    requiredFrontmatterFields.forEach((field) => {
      if (!entry[field]) {
        throw new Error(`Missing blog manifest field: ${field}`);
      }
    });

    if (!entry.slug) {
      throw new Error("Missing blog manifest field: slug");
    }

    if (!isEntryKind(entry.kind)) {
      throw new Error(`Invalid blog entry kind: ${entry.kind}`);
    }

    const openValue = entry.open;
    let open: EntryOpenMode | undefined;

    if (openValue && !isEntryOpenMode(openValue)) {
      throw new Error(`Invalid blog entry open mode: ${openValue}`);
    }

    if (openValue && isEntryOpenMode(openValue)) {
      open = openValue;
    }

    return {
      title: entry.title,
      summary: entry.summary,
      meta: entry.meta,
      date: entry.date,
      kicker: entry.kicker,
      coverImage: entry.coverImage,
      coverAlt: entry.coverAlt,
      kind: entry.kind,
      open,
      slug: entry.slug,
      source: entry.source,
      href: entry.href,
    } satisfies BlogManifestEntry;
  });
}

function sortEntries(left: EntryRecord, right: EntryRecord) {
  const leftDate = left.date ? Date.parse(left.date) : Number.NaN;
  const rightDate = right.date ? Date.parse(right.date) : Number.NaN;

  if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate) && leftDate !== rightDate) {
    return rightDate - leftDate;
  }

  return left.title.localeCompare(right.title);
}

function buildLifeEntries() {
  return Object.entries(lifeEntryModules)
    .map(([path, source]) => {
      const slug = pathToSlug(path);
      const { frontmatter, content } = parseFrontmatter(source);

      return {
        ...frontmatter,
        collectionId: "life",
        kind: "markdown",
        open: "entry",
        slug,
        href: `/life/${slug}`,
        content,
      } satisfies EntryRecord;
    })
    .sort(sortEntries);
}

function resolveBlogEntry(entry: BlogManifestEntry) {
  const open =
    entry.open ??
    (entry.kind === "link" ? "native" : entry.kind === "app" ? "iframe" : "entry");
  const source = entry.source ? normalizeManifestSource(entry.source) : undefined;
  const href =
    entry.kind === "link" && entry.href
      ? entry.href
      : open === "native" && entry.href
        ? entry.href
        : `/blog/${entry.slug}`;
  const content = source ? blogEntryModules[source] : undefined;

  if ((entry.kind === "markdown" || entry.kind === "html") && !content) {
    throw new Error(`Missing blog source for ${entry.slug}: ${entry.source}`);
  }

  if ((entry.kind === "app" || open === "iframe" || open === "native") && !entry.href) {
    throw new Error(`Missing blog href for ${entry.slug}`);
  }

  if (entry.kind === "link" && !entry.href) {
    throw new Error(`Missing blog href for ${entry.slug}`);
  }

  return {
    title: entry.title,
    summary: entry.summary,
    meta: entry.meta,
    date: entry.date,
    kicker: entry.kicker,
    coverImage: entry.coverImage,
    coverAlt: entry.coverAlt,
    collectionId: "blog",
    kind: entry.kind,
    open,
    slug: entry.slug,
    href,
    source: entry.href ?? source,
    externalHref: entry.href,
    content,
  } satisfies EntryRecord;
}

function buildBlogEntries() {
  return parseBlogManifest(blogManifestSource).map(resolveBlogEntry).sort(sortEntries);
}

export const entriesByCollection: Record<EntryCollectionId, EntryRecord[]> = {
  life: buildLifeEntries(),
  blog: buildBlogEntries(),
};

export const allEntries = Object.values(entriesByCollection).flat();

export function getEntries(collectionId: EntryCollectionId) {
  return entriesByCollection[collectionId];
}

export function getEntry(collectionId: EntryCollectionId, slug: string) {
  return entriesByCollection[collectionId].find((entry) => entry.slug === slug);
}

export function getEntrySectionItems(collectionId: EntryCollectionId): SectionItem[] {
  return getEntries(collectionId).map((entry) => ({
    title: entry.title,
    meta: entry.meta,
    description: entry.summary,
    href: entry.href,
  }));
}
