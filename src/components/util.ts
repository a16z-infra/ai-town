const baseUrl = import.meta.env.BASE_URL;

export function rewriteAssetUrl(url: string): string {
    if (baseUrl === "/" && url.startsWith("/ai-town"))  {
        return url.substring("/ai-town".length);
    }
    return url;
}
