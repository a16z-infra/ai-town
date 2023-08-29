export function convertNextStaticUrl(url: string) {
    const prefix = "/ai-town";
    if (url.startsWith(prefix)) {
        return url.slice(prefix.length);
    }
    return url;
}