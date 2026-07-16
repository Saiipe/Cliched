export type LegalPageType = 'privacidade' | 'termos' | 'cookies';

export interface LegalSection {
  readonly heading: string;
  readonly body: string;
}

export interface LegalContent {
  readonly title: string;
  readonly updatedAt: string;
  readonly intro: string;
  readonly sections: readonly LegalSection[];
}
