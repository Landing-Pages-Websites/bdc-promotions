const NON_DIGIT_PATTERN = /\D/g;

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(NON_DIGIT_PATTERN, "")}`;
}
