const assetAttributes = [
  ["a", "href"],
  ["audio", "src"],
  ["iframe", "src"],
  ["img", "src"],
  ["object", "data"],
  ["source", "src"],
  ["video", "poster"],
  ["video", "src"],
] as const;

function isRelativeUrl(value: string) {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(value.trim());
}

function resolveRelativeUrl(value: string, assetBase: string) {
  const basePath = assetBase.endsWith("/") ? assetBase : `${assetBase}/`;
  const url = new URL(value, `https://entry.local${basePath}`);

  return `${url.pathname}${url.search}${url.hash}`;
}

export function resolveEntryAssetUrls(html: string, assetBase?: string) {
  if (!assetBase) {
    return html;
  }

  const document = new DOMParser().parseFromString(html, "text/html");

  assetAttributes.forEach(([tagName, attributeName]) => {
    document.querySelectorAll(tagName).forEach((element) => {
      const value = element.getAttribute(attributeName);

      if (!value || !isRelativeUrl(value)) {
        return;
      }

      element.setAttribute(attributeName, resolveRelativeUrl(value, assetBase));
    });
  });

  return document.body.innerHTML;
}
