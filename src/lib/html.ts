import DOMPurify from "dompurify";
import { resolveEntryAssetUrls } from "./entryAssets";

export function renderEntryHtml(html: string, assetBase?: string) {
  return {
    __html: DOMPurify.sanitize(resolveEntryAssetUrls(html, assetBase)),
  };
}
