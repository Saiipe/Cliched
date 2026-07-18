export interface AdminUser {
  readonly id: number;
  readonly username: string;
  readonly email: string;
  readonly is_active: boolean;
  readonly is_superuser: boolean;
  readonly is_premium: boolean;
  readonly date_joined: string;
  readonly last_login: string | null;
  readonly total_wins: number;
  readonly current_streak: number;
  readonly best_streak: number;
}

export interface LoginEvent {
  readonly created_at: string;
  readonly ip_address: string | null;
}
