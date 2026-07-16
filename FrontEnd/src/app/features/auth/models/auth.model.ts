export interface UserProfile {
  readonly id: number;
  readonly username: string;
  readonly email: string;
  readonly avatar_url: string;
  readonly theme: string;
  readonly is_staff: boolean;
}

export interface AuthTokens {
  readonly access: string;
  readonly refresh: string;
}

export interface AuthPayload {
  readonly user: UserProfile;
  readonly tokens: AuthTokens;
}

export interface UserStats {
  readonly current_streak: number;
}

export interface MePayload {
  readonly user: UserProfile;
  readonly stats: UserStats;
}

export interface RegisterRequest {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly password_confirm: string;
  readonly accept_terms: boolean;
}

export interface ChangePasswordRequest {
  readonly current_password: string;
  readonly new_password: string;
  readonly new_password_confirm: string;
}
