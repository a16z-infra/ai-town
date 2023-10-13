export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(ms, 0)));
}
