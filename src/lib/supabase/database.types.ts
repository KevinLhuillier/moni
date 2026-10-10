// Types alignés sur supabase/migrations. Régénérables avec :
// npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts

export type TransactionType = "expense" | "income" | "saving"

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: TransactionType
          color: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          type?: TransactionType
          color?: string
          icon?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          type: TransactionType
          amount: number
          date: string
          description: string | null
          recurring: boolean
          recurring_source_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          category_id?: string | null
          type: TransactionType
          amount: number
          date?: string
          description?: string | null
          recurring?: boolean
          recurring_source_id?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          category_id: string
          amount: number
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["budgets"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { transaction_type: TransactionType }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Category = Database["public"]["Tables"]["categories"]["Row"]
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"]
export type Budget = Database["public"]["Tables"]["budgets"]["Row"]

export type TransactionWithCategory = Transaction & {
  category: Pick<Category, "id" | "name" | "color" | "icon"> | null
}
