export type ChallengeImageSource = 'poster' | 'backdrop';

export interface AdminChallengeMovie {
  readonly tmdb_id: number;
  readonly title: string;
  readonly original_title: string;
  readonly release_year: number | null;
  readonly genres: readonly { id: number; name: string }[];
  readonly origin_country: string;
  readonly director: string;
  readonly top_cast: readonly string[];
  readonly runtime: number | null;
  readonly poster_path: string;
  readonly backdrop_path: string;
}

export interface AdminDailyChallenge {
  readonly challenge_id: number;
  readonly date: string;
  readonly status: 'pending' | 'ready' | 'failed';
  readonly swappable: boolean;
  readonly image_source: ChallengeImageSource;
  readonly image_path: string;
  readonly movie: AdminChallengeMovie;
}

export type PosterLanguage = 'pt' | 'en' | null;

export interface GalleryImage {
  readonly file_path: string;
  readonly vote_average: number;
  readonly iso_639_1: PosterLanguage;
}

export interface ImageGallery {
  readonly posters: readonly GalleryImage[];
}
