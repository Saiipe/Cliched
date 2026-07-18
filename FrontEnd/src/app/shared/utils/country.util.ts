const COUNTRY_NAMES = new Intl.DisplayNames(['pt-BR'], { type: 'region' });

/** Código ISO 3166-1 alpha-2 (ex.: "US", "JP") vira emoji de bandeira: cada
 * letra corresponde a um "regional indicator symbol" do Unicode. */
export function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) {
    return '';
  }
  const points = [...code.toUpperCase()].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...points);
}

/** Nome do país em português a partir do código ISO, via API nativa do
 * navegador/Node (`Intl.DisplayNames`), sem precisar manter uma lista. */
export function countryName(code: string | null): string {
  if (!code) {
    return '-';
  }
  try {
    return COUNTRY_NAMES.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
