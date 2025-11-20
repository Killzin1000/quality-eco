export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_prompts: {  // <--- ADICIONADO AQUI
        Row: {
          id: string
          nome_chave: string
          titulo: string
          conteudo: string | null
          ordem: number
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome_chave: string
          titulo: string
          conteudo?: string | null
          ordem?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome_chave?: string
          titulo?: string
          conteudo?: string | null
          ordem?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          comentario: string
          created_at: string
          curso_id: number
          data: string
          id: string
          nome: string
          nota: number
        }
        Insert: {
          comentario: string
          created_at?: string
          curso_id: number
          data?: string
          id?: string
          nome: string
          nota: number
        }
        Update: {
          comentario?: string
          created_at?: string
          curso_id?: number
          data?: string
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
          }
        ]
      }
      carrinhos_abandonados: {
        Row: {
          created_at: string
          curso_id: number
          data_abandono: string
          email: string
          id: string
          telefone: string
          nome: string | null // Atualizado conforme migração anterior
        }
        Insert: {
          created_at?: string
          curso_id: number
          data_abandono?: string
          email: string
          id?: string
          telefone: string
          nome?: string | null
        }
        Update: {
          created_at?: string
          curso_id?: number
          data_abandono?: string
          email?: string
          id?: string
          telefone?: string
          nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrinhos_abandonados_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          }
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
          idx: number | null
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
          idx?: number | null
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
          idx?: number | null
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
          aluno_cpf: string
          aluno_email: string
          aluno_nome: string
          aluno_telefone: string
          created_at: string
          curso_id: number
          forma_pagamento: string
          id: string
          valor_pago: string
        }
        Insert: {
          aluno_cpf: string
          aluno_email: string
          aluno_nome: string
          aluno_telefone: string
          created_at?: string
          curso_id: number
          forma_pagamento: string
          id?: string
          valor_pago: string
        }
        Update: {
          aluno_cpf?: string
          aluno_email?: string
          aluno_nome?: string
          aluno_telefone?: string
          created_at?: string
          curso_id?: number
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
          }
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      cupons: {
        Row: {
          id: string
          codigo: string
          desconto_percentual: number
          tipo: string // 'manual', 'exit_intent'
          ativo: boolean
          uso_atual: number
          uso_maximo: number
          data_expiracao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          codigo: string
          desconto_percentual: number
          tipo?: string
          ativo?: boolean
          uso_atual?: number
          uso_maximo?: number
          data_expiracao?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          desconto_percentual?: number
          tipo?: string
          ativo?: boolean
          uso_atual?: number
          uso_maximo?: number
          data_expiracao?: string | null
          created_at?: string
        }
        Relationships: []
      }
      leads_exit_intent: {
        Row: {
          id: string
          nome: string
          telefone: string
          cupom_codigo: string
          cupom_usado: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          telefone: string
          cupom_codigo: string
          cupom_usado?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          telefone?: string
          cupom_codigo?: string
          cupom_usado?: boolean
          created_at?: string
        }
        Relationships: []
      }
      curso_visualizacoes: {
        Row: {
          id: string
          curso_id: number
          session_id: string
          origem: string | null
          duracao_segundos: number
          created_at: string
        }
        Insert: {
          id?: string
          curso_id: number
          session_id: string
          origem?: string | null
          duracao_segundos?: number
          created_at?: string
        }
        Update: {
          id?: string
          curso_id?: number
          session_id?: string
          origem?: string | null
          duracao_segundos?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_visualizacoes_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          }
        ]
      }
      sessoes_usuario: {
        Row: {
          session_id: string
          user_agent: string | null
          origem_trafego: string | null
          converteu: boolean
          tempo_total_segundos: number
          created_at: string
          updated_at: string
        }
        Insert: {
          session_id: string
          user_agent?: string | null
          origem_trafego?: string | null
          converteu?: boolean
          tempo_total_segundos?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          session_id?: string
          user_agent?: string | null
          origem_trafego?: string | null
          converteu?: boolean
          tempo_total_segundos?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          user_id: string
          role: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never