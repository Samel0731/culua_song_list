// Every page has a stable unique order. A failed page invalidates the whole read.
export async function readAll<T>(page: (start: number, end: number) => PromiseLike<{ data: T[] | null; error: unknown }>, size = 1000): Promise<T[]> {
  const rows: T[] = [];
  for (let start = 0; ; start += size) {
    const result = await page(start, start + size - 1);
    if (result.error || !result.data) throw new Error('Archive read incomplete');
    rows.push(...result.data);
    if (result.data.length < size) return rows;
  }
}
