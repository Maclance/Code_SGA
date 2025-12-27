/**
 * Supabase Database Types
 * 
 * This is a placeholder file for Supabase generated types.
 * Once your schema is defined, regenerate types with:
 * 
 *   npx supabase gen types typescript --project-id jdhqasvacqqorhhpqsmp > src/types/database.ts
 * 
 * @module types/database
 */

/**
 * Placeholder Database interface
 * Will be replaced by auto-generated types from Supabase schema
 */
export interface Database {
    public: {
        Tables: Record<string, never>; // Placeholder - will be populated by schema
        Views: Record<string, never>; // Placeholder - will be populated by schema
        Functions: {
            // RPC functions will be added here
            select_one: {
                Args: Record<string, never>;
                Returns: number;
            };
        };
        Enums: Record<string, never>; // Placeholder - will be populated by schema
    };
}

/**
 * Helper types for working with typed Supabase client
 */
export type Tables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Row'];

export type InsertDto<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Insert'];

export type UpdateDto<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Update'];
