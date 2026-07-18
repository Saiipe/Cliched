export interface CastMember {
  readonly name: string;
  readonly profile_path: string;
}

export interface CastPreviousGuess {
  readonly tmdb_id: number;
  readonly title: string;
  readonly is_correct: boolean;
}

export interface CastReveal {
  readonly tmdb_id: number;
  readonly title: string;
  readonly original_title: string;
  readonly release_year: number | null;
  readonly director: string;
  readonly poster_path: string;
}

export interface CastChallengeState {
  readonly challenge_id: number;
  readonly date: string;
  readonly max_attempts: number;
  readonly attempts_used: number;
  readonly attempts_remaining: number;
  readonly status: 'playing' | 'won' | 'lost';
  readonly score: number | null;
  readonly cast: readonly CastMember[];
  readonly total_cast: number;
  readonly director: string | null;
  readonly previous_guesses: readonly CastPreviousGuess[];
  readonly reveal: CastReveal | null;
  readonly anon_token?: string;
}

export interface CastGuessResult extends CastChallengeState {
  readonly correct: boolean;
}
