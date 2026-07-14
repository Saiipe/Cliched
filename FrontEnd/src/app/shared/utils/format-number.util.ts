const thousandsFormatter = new Intl.NumberFormat('pt-BR');

export function formatThousands(value: number): string {
  return thousandsFormatter.format(value);
}
