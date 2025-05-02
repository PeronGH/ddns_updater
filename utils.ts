export function nonNullable<T>(value: T): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error("Value is null or undefined");
  }
  return value as NonNullable<T>;
}

export async function collectAsync<T>(
  iterable: AsyncIterable<T>,
): Promise<T[]> {
  const result: T[] = [];

  for await (const item of iterable) {
    result.push(item);
  }

  return result;
}
