export interface AdminCastMember {
  readonly name: string;
  readonly profile_path: string;
}

export interface AdminCastMovie {
  readonly tmdb_id: number;
  readonly title: string;
  readonly original_title: string;
  readonly release_year: number | null;
  readonly director: string;
  readonly top_cast: readonly AdminCastMember[];
  readonly poster_path: string;
}

export interface AdminCastChallenge {
  readonly challenge_id: number;
  readonly date: string;
  readonly status: 'pending' | 'ready' | 'failed';
  readonly swappable: boolean;
  readonly movie: AdminCastMovie;
}
