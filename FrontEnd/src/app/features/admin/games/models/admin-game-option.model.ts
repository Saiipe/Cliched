export interface AdminGameOption {
  readonly label: string;
  /** null = ainda sem tela administrativa própria (aparece desabilitado). */
  readonly route: string | null;
}
