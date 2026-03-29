export function safeDivide(a: number, b: number): number {
  if (!b) return 0;
  return a / b;
}

export function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export function roundRatio(value: number): number {
  return Number(value.toFixed(4));
}
