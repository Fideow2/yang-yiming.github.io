import { renderEntryHtml } from "../lib/html";
import { renderEntryMarkdown } from "../lib/entryMarkdown";
import type { EntryRecord } from "../types";

interface EntryPageProps {
  entry: EntryRecord;
}

export function EntryPage({ entry }: EntryPageProps) {
  const collectionLabel =
    entry.collectionId.charAt(0).toUpperCase() + entry.collectionId.slice(1);
  const embeddedHref = entry.externalHref ?? entry.source;
  const shouldEmbed = entry.open === "iframe" && embeddedHref;
  const shouldShowNativeLink =
    (entry.open === "native" || entry.kind === "link") && embeddedHref;

  return (
    <main className="page-main">
      <article className="entry-page">
        <div className="entry-page__header">
          <a className="entry-page__backlink" href={`/#${entry.collectionId}`}>
            <span aria-hidden="true" className="entry-page__backlink-arrow">
              ←
            </span>
            <span>Back to {collectionLabel}</span>
          </a>
          <p className="section-kicker">{entry.kicker ?? entry.meta}</p>
          <h1 className="entry-page__title">{entry.title}</h1>
          <p className="entry-page__meta">{entry.meta}</p>
          <p className="entry-page__summary">{entry.summary}</p>
        </div>

        <div
          className={
            shouldEmbed
              ? "entry-page__content entry-page__content--embed"
              : "entry-page__content"
          }
        >
          {entry.kind === "markdown" && entry.content ? (
            <div
              dangerouslySetInnerHTML={renderEntryMarkdown(
                entry.content,
                entry.assetBase,
              )}
            />
          ) : null}

          {entry.kind === "html" && entry.open === "entry" && entry.content ? (
            <div
              dangerouslySetInnerHTML={renderEntryHtml(
                entry.content,
                entry.assetBase,
              )}
            />
          ) : null}

          {shouldEmbed ? (
            <iframe
              className="entry-page__frame"
              src={embeddedHref}
              title={entry.title}
            />
          ) : null}

          {shouldShowNativeLink ? (
            <p>
              <a href={embeddedHref}>Open {entry.title}</a>
            </p>
          ) : null}
        </div>
      </article>
    </main>
  );
}
