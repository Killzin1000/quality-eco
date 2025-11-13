export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      avaliacoes: {
        Row: {
          comentario: string | null
          created_at: string | null
          curso_id: number | null
          data: string | null
          id: string
          nome: string
          nota: number
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          curso_id?: number | null
          data?: string | null
          id?: string
          nome: string
          nota: number
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          curso_id?: number | null
          data?: string | null
          id?: string
          nome?: string
          nota?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      carrinhos_abandonados: {
        Row: {
          created_at: string | null
          curso_id: number | null
          data_abandono: string | null
          email: string | null
          id: string
          telefone: string | null
        }
        Insert: {
          created_at?: string | null
          curso_id?: number | null
          data_abandono?: string | null
          email?: string | null
          id?: string
          telefone?: string | null
        }
        Update: {
          created_at?: string | null
          curso_id?: number | null
          data_abandono?: string | null
          email?: string | null
          id?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrinhos_abandonados_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          "Área de Atuação": string | null
          "Carga Horária": string | null
          "Data Inicio / Data limite para inclusão": string | null
          Documentos: string | null
          Ementa: string | null
          "Estuda Por / Contrato com": string | null
          "Horário de Aula": string | null
          id: number
          ImagemCapa: string | null
          "Link Cronograma": string | null
          "Link e-MEC Curso": string | null
          Modalidade: string | null
          "Necessário Artigo?": string | null
          "Necessário Estágio?": string | null
          "Nome dos cursos": string | null
          "Número da Turma": string | null
          Observações: string | null
          Pacotes: string | null
          "Parceria Técnico Científica": string | null
          Polo: string | null
          "Prazo de Conclusão": string | null
          "Prazo Médio de Certificação": string | null
          "Pré Requesito para Matrícula": string | null
          "Preço Boleto / Valor para Cadastro": string | null
          "Preço Cartão / Valor para Cadastro": string | null
          "Preço Pix / Valor para Cadastro": string | null
          "Público Alvo": string | null
          "Qtda Mínima e Máxima de Alunos na Turma": string | null
          "Quantidade de Alunos Matrículados": string | null
          Subcategoria: string | null
          Tipo: string | null
          "Tipo de Certificação": string | null
        }
        Insert: {
          "Área de Atuação"?: string | null
          "Carga Horária"?: string | null
          "Data Inicio / Data limite para inclusão"?: string | null
          Documentos?: string | null
          Ementa?: string | null
          "Estuda Por / Contrato com"?: string | null
          "Horário de Aula"?: string | null
          id?: number
          ImagemCapa?: string | null
          "Link Cronograma"?: string | null
          "Link e-MEC Curso"?: string | null
          Modalidade?: string | null
          "Necessário Artigo?"?: string | null
          "Necessário Estágio?"?: string | null
          "Nome dos cursos"?: string | null
          "Número da Turma"?: string | null
          Observações?: string | null
          Pacotes?: string | null
          "Parceria Técnico Científica"?: string | null
          Polo?: string | null
          "Prazo de Conclusão"?: string | null
          "Prazo Médio de Certificação"?: string | null
          "Pré Requesito para Matrícula"?: string | null
          "Preço Boleto / Valor para Cadastro"?: string | null
          "Preço Cartão / Valor para Cadastro"?: string | null
          "Preço Pix / Valor para Cadastro"?: string | null
          "Público Alvo"?: string | null
          "Qtda Mínima e Máxima de Alunos na Turma"?: string | null
          "Quantidade de Alunos Matrículados"?: string | null
          Subcategoria?: string | null
          Tipo?: string | null
          "Tipo de Certificação"?: string | null
        }
        Update: {
          "Área de Atuação"?: string | null
          "Carga Horária"?: string | null
          "Data Inicio / Data limite para inclusão"?: string | null
          Documentos?: string | null
          Ementa?: string | null
          "Estuda Por / Contrato com"?: string | null
          "Horário de Aula"?: string | null
          id?: number
          ImagemCapa?: string | null
          "Link Cronograma"?: string | null
          "Link e-MEC Curso"?: string | null
          Modalidade?: string | null
          "Necessário Artigo?"?: string | null
          "Necessário Estágio?"?: string | null
          "Nome dos cursos"?: string | null
          "Número da Turma"?: string | null
          Observações?: string | null
          Pacotes?: string | null
          "Parceria Técnico Científica"?: string | null
          Polo?: string | null
          "Prazo de Conclusão"?: string | null
          "Prazo Médio de Certificação"?: string | null
          "Pré Requesito para Matrícula"?: string | null
          "Preço Boleto / Valor para Cadastro"?: string | null
          "Preço Cartão / Valor para Cadastro"?: string | null
          "Preço Pix / Valor para Cadastro"?: string | null
          "Público Alvo"?: string | null
          "Qtda Mínima e Máxima de Alunos na Turma"?: string | null
          "Quantidade de Alunos Matrículados"?: string | null
          Subcategoria?: string | null
          Tipo?: string | null
          "Tipo de Certificação"?: string | null
        }
        Relationships: []
      }
      matriculas: {
        Row: {
          aluno_cpf: string | null
          aluno_email: string
          aluno_nome: string
          aluno_telefone: string | null
          created_at: string | null
          curso_id: number | null
          data_compra: string | null
          forma_pagamento: string
          id: string
          valor_pago: string
        }
        Insert: {
          aluno_cpf?: string | null
          aluno_email: string
          aluno_nome: string
          aluno_telefone?: string | null
          created_at?: string | null
          curso_id?: number | null
          data_compra?: string | null
          forma_pagamento: string
          id?: string
          valor_pago: string
        }
        Update: {
          aluno_cpf?: string | null
          aluno_email?: string
          aluno_nome?: string
          aluno_telefone?: string | null
          created_at?: string | null
          curso_id?: number | null
          data_compra?: string | null
          forma_pagamento?: string
          id?: string
          valor_pago?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
