export function formatSequenceNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}
