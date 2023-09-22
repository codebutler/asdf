import { P } from "ts-pattern";

export function difference<T>(setA: Set<T>, setB: Set<T>) {
  const _difference = new Set(setA);
  for (const elem of setB) {
    _difference.delete(elem);
  }
  return _difference;
}

export const Pselector = (selector: string) =>
  P.when<HTMLElement, (input: HTMLElement) => boolean>((input) =>
    input.matches(selector)
  );

export const ensure = <T>(value: T | null | undefined, message?: string): T => {
  if (!value) {
    throw new Error(message || 'value is required');
  }
  return value;
};
