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

export const ensure = <T>(reference: T | null | undefined, message?: string): T => {
  if (reference === null || reference === undefined) {
    throw new Error(message || 'Value cannot be null or undefined.');
  }
  return reference;
};
