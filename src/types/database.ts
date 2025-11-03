// Database types matching Supabase schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          created_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          week: number;
          season: number;
          home_team_id: string;
          away_team_id: string;
          game_time: string;
          status: 'upcoming' | 'live' | 'final';
          home_score: number;
          away_score: number;
          quarter: string | null;
          time_remaining: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          week: number;
          season?: number;
          home_team_id: string;
          away_team_id: string;
          game_time: string;
          status?: 'upcoming' | 'live' | 'final';
          home_score?: number;
          away_score?: number;
          quarter?: string | null;
          time_remaining?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          week?: number;
          season?: number;
          home_team_id?: string;
          away_team_id?: string;
          game_time?: string;
          status?: 'upcoming' | 'live' | 'final';
          home_score?: number;
          away_score?: number;
          quarter?: string | null;
          time_remaining?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      picks: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          selected_team_id: string | null;
          tie_breaker: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          selected_team_id?: string | null;
          tie_breaker?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          selected_team_id?: string | null;
          tie_breaker?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      standings: {
        Row: {
          user_id: string | null;
          full_name: string | null;
          email: string | null;
          score: number | null;
        };
      };
    };
  };
}
