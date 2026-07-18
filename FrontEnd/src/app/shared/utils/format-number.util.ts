const thousandsFormatter = new Intl.NumberFormat('pt-BR');

export function formatThousands(value: number): string {
  return thousandsFormatter.format(value);
}

/**
 * Formato padrão de pontuação da aplicação: abaixo de 10 mil mostra o número
 * completo ("2.430", "9.999"); a partir daí compacta em k/M com no máximo uma
 * casa decimal, exibida só enquanto ela é significativa ("12.5k", "98k",
 * "120k", "999k", "1M", "1.2M"). Trunca em vez de arredondar para nunca
 * inflar pontuação (999.999 vira "999k", não "1M").
 */
export function formatPoints(value: number): string {
  if (value >= 1_000_000) {
    return compact(value / 1_000_000, 'M');
  }
  if (value >= 10_000) {
    return compact(value / 1_000, 'k');
  }
  return formatThousands(value);
}

function compact(scaled: number, suffix: string): string {
  const truncated = Math.floor(scaled * 10) / 10;
  if (truncated >= 100 || Number.isInteger(truncated)) {
    return `${Math.floor(truncated)}${suffix}`;
  }
  return `${truncated.toFixed(1)}${suffix}`;
}
