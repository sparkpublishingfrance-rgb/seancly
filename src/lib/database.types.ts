/**
 * Types du schéma Supabase, écrits à la main et alignés sur les migrations de
 * `supabase/migrations/`. À régénérer avec `supabase gen types typescript` dès
 * que la CLI sera branchée sur le projet.
 *
 * Toute modification du schéma doit être répercutée ici dans le même commit,
 * sans quoi la couche `src/api/` ment sur ce qu'elle reçoit.
 */

export type CreatorPlanRow = "free" | "pro" | "cine_plus";

export type ActivityVerbRow =
  | "rated"
  | "reviewed"
  | "created_list"
  | "added_to_list"
  | "followed"
  | "followed_list"
  | "commented_list"
  | "joined_guild";

export type ActivityObjectRow = "title" | "list" | "profile" | "guild";

export type ActivityVisibilityRow = "public" | "followers";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          handle: string;
          display_name: string;
          bio: string | null;
          avatar_color: string;
          is_creator: boolean;
          plan: CreatorPlanRow;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          handle: string;
          display_name: string;
          bio?: string | null;
          avatar_color?: string;
        };
        Update: {
          handle?: string;
          display_name?: string;
          bio?: string | null;
          avatar_color?: string;
        };
        Relationships: [{ foreignKeyName: "profiles_id_fkey"; columns: ["id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      profile_private: {
        Row: {
          id: string;
          birth_date: string | null;
          birth_date_consent_at: string | null;
        };
        Insert: {
          id: string;
          birth_date?: string | null;
          birth_date_consent_at?: string | null;
        };
        Update: {
          birth_date?: string | null;
          birth_date_consent_at?: string | null;
        };
        Relationships: [{ foreignKeyName: "profile_private_id_fkey"; columns: ["id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      lists: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          is_public?: boolean;
        };
        Update: {
          title?: string;
          is_public?: boolean;
        };
        Relationships: [{ foreignKeyName: "lists_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      list_items: {
        Row: {
          id: string;
          list_id: string;
          title_ref: string;
          position: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          title_ref: string;
          position?: number;
        };
        Update: {
          title_ref?: string;
          position?: number;
        };
        Relationships: [{ foreignKeyName: "list_items_list_id_fkey"; columns: ["list_id"]; isOneToOne: false; referencedRelation: "lists"; referencedColumns: ["id"] }];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
        };
        Update: Record<string, never>;
        Relationships: [
          { foreignKeyName: "follows_follower_id_fkey"; columns: ["follower_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "follows_following_id_fkey"; columns: ["following_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      ratings: {
        Row: {
          id: string;
          author_id: string;
          title_ref: string;
          rating: number;
          body: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title_ref: string;
          rating: number;
          body?: string | null;
        };
        Update: {
          rating?: number;
          body?: string | null;
        };
        Relationships: [{ foreignKeyName: "ratings_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      activity: {
        Row: {
          id: string;
          actor_id: string;
          verb: ActivityVerbRow;
          object_type: ActivityObjectRow;
          object_ref: string;
          metadata: { rating?: number; title?: string; excerpt?: string } | null;
          visibility: ActivityVisibilityRow;
          created_at: string;
        };
        // Aucune écriture cliente : les lignes naissent des triggers.
        Insert: never;
        Update: never;
        Relationships: [{ foreignKeyName: "activity_actor_id_fkey"; columns: ["actor_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      list_follows: {
        Row: { follower_id: string; list_id: string; created_at: string };
        Insert: { follower_id: string; list_id: string };
        Update: Record<string, never>;
        Relationships: [
          { foreignKeyName: "list_follows_follower_id_fkey"; columns: ["follower_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "list_follows_list_id_fkey"; columns: ["list_id"]; isOneToOne: false; referencedRelation: "lists"; referencedColumns: ["id"] },
        ];
      };
      list_comments: {
        Row: {
          id: string;
          list_id: string;
          author_id: string;
          body: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: { id?: string; list_id: string; author_id: string; body: string };
        // Seul le texte est modifiable ; les retraits passent par une fonction.
        Update: { body?: string };
        Relationships: [
          { foreignKeyName: "list_comments_list_id_fkey"; columns: ["list_id"]; isOneToOne: false; referencedRelation: "lists"; referencedColumns: ["id"] },
          { foreignKeyName: "list_comments_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      link_in_bio_items: {
        Row: {
          id: string;
          owner_id: string;
          label: string;
          url: string;
          position: number;
          enabled: boolean;
          clicks: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          label: string;
          url: string;
          position?: number;
          enabled?: boolean;
        };
        Update: {
          label?: string;
          url?: string;
          position?: number;
          enabled?: boolean;
        };
        Relationships: [{ foreignKeyName: "link_in_bio_items_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
    };
    Views: {
      follow_counts: {
        Row: {
          profile_id: string;
          followers: number;
          following: number;
        };
        Relationships: [];
      };
      list_stats: {
        Row: {
          list_id: string;
          items: number;
          followers: number;
          comments: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      register_link_click: {
        Args: { target_link: string };
        Returns: undefined;
      };
      delete_my_list_comment: {
        Args: { comment_id: string };
        Returns: undefined;
      };
      hide_list_comment: {
        Args: { comment_id: string };
        Returns: undefined;
      };
      popular_lists: {
        Args: { window_days?: number; max_rows?: number };
        Returns: {
          list_id: string;
          title: string;
          owner_id: string;
          items: number;
          followers: number;
          comments: number;
          score: number;
        }[];
      };
    };
    Enums: {
      creator_plan: CreatorPlanRow;
      activity_verb: ActivityVerbRow;
      activity_object: ActivityObjectRow;
      activity_visibility: ActivityVisibilityRow;
    };
  };
}
