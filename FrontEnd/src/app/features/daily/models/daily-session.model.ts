export interface ApiEnvelope<T> {
  readonly success: boolean;
  readonly message: string;
  readonly data: T;
}

export interface DailyTitleHint {
  readonly length: number;
  readonly word_count: number;
}

export type ClueResult = 'correct' | 'partial' | 'wrong';

export interface YearClue {
  readonly value: number | null;
  readonly result: ClueResult;
  readonly direction?: 'up' | 'down';
}

export interface GenreClueItem {
  readonly id: number;
  readonly name: string;
  readonly match: 'green' | 'red';
}

export interface GenreClue {
  readonly value: readonly GenreClueItem[];
  readonly result: ClueResult;
}

export interface CountryClue {
  readonly value: string | null;
  readonly result: ClueResult;
  readonly proximity?: 'close' | 'far';
}

export interface DirectorClue {
  readonly value: string | null;
  readonly result: ClueResult;
}

export interface CastClue {
  readonly value: readonly string[];
  readonly shared_count: number;
  readonly result: ClueResult;
}

export interface RuntimeClue {
  readonly value: number | null;
  readonly result: ClueResult;
  readonly direction?: 'up' | 'down';
}

export interface GuessClues {
  readonly release_year: YearClue;
  readonly genres: GenreClue;
  readonly country: CountryClue;
  readonly director: DirectorClue;
  readonly cast: CastClue;
  readonly runtime: RuntimeClue;
}

export interface DailyPreviousGuess {
  readonly attempt_number: number;
  readonly title: string;
  readonly is_correct: boolean;
  readonly clues: GuessClues | Record<string, never>;
}

export interface DailyReveal {
  readonly tmdb_id: number;
  readonly title: string;
  readonly original_title: string;
  readonly release_year: number | null;
  readonly genres: readonly string[];
  readonly origin_country: readonly string[];
  readonly director: string | null;
  readonly top_cast: readonly string[];
  readonly runtime: number | null;
  readonly poster_url: string;
}

export interface DailyChallengeState {
  readonly challenge_id: number;
  readonly date: string;
  readonly max_attempts: number;
  readonly attempts_used: number;
  readonly attempts_remaining: number;
  readonly status: 'playing' | 'won' | 'lost';
  readonly score: number | null;
  readonly poster_level: number;
  readonly poster_url: string;
  readonly image_source: 'poster' | 'backdrop';
  readonly title_hint: DailyTitleHint;
  readonly previous_guesses: readonly DailyPreviousGuess[];
  readonly reveal: DailyReveal | null;
  readonly anon_token?: string;
}

export interface DailyGuessRequest {
  readonly tmdb_id: number;
}

export interface DailyGuessResult extends DailyChallengeState {
  readonly correct: boolean;
  readonly clues: GuessClues | Record<string, never>;
}

export interface MovieSearchResult {
  readonly tmdb_id: number;
  readonly title: string;
  readonly release_year: number | null;
  readonly poster_path: string | null;
}

export interface TMDBSearchResultItem {
  readonly id: number;
  readonly title: string;
  readonly release_date: string | null;
  readonly poster_path: string | null;
}

export interface TMDBSearchResponse {
  readonly results: readonly TMDBSearchResultItem[];
}