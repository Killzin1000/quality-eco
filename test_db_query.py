import os
from typing import Optional, Dict, List
from supabase import create_client, Client
from dotenv import load_dotenv

# --- Configuração ---
# Carrega as chaves do seu arquivo .env
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERRO: As variáveis SUPABASE_URL ou SUPABASE_KEY não foram encontradas no .env")
    exit()

# Conexão com o Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print("LOG: Conexão com Supabase estabelecida.")

# --- Função de Consulta (Simplificada da bot_api.py) ---
def buscar_curso_por_nome_exato(nome_curso: str) -> Optional[Dict]:
    """
    Busca um curso pelo nome exato no Supabase e retorna os dados completos.
    """
    try:
        select_cols = (
            "id, \"Nome dos cursos\", \"Tipo\", \"Modalidade\", \"Carga Horária\", "
            "\"Prazo de Conclusão\", \"Preço Pix / Valor para Cadastro\""
        )
        
        # A busca por nome exato é CRÍTICA. Usamos .eq (equal)
        response = supabase.table("cursos").select(select_cols).eq('"Nome dos cursos"', nome_curso).limit(1).single().execute()
        
        if response.data:
            return response.data
            
    except Exception as e:
        # A API do Supabase lança erro se .single() não encontrar nada.
        # Apenas registramos o erro e retornamos None.
        print(f"AVISO: Curso '{nome_curso}' não encontrado ou erro de DB: {e}")
        
    return None

# --- Teste ---
# Use o nome completo exato da opção 2 que foi listada no seu teste
NOME_DO_CURSO_PARA_TESTE = "NEUROPSICOPEDAGOGIA - Pós-Graduação - EAD" 

print(f"LOG: Buscando curso pelo nome exato: '{NOME_DO_CURSO_PARA_TESTE}'")

curso_encontrado = buscar_curso_por_nome_exato(NOME_DO_CURSO_PARA_TESTE)

if curso_encontrado:
    print("\n✅ CURSO ENCONTRADO COM SUCESSO:")
    print(f"   ID: {curso_encontrado.get('id')}")
    print(f"   Nome: {curso_encontrado.get('Nome dos cursos')}")
    print(f"   Carga Horária: {curso_encontrado.get('Carga Horária')}")
    print(f"   Prazo: {curso_encontrado.get('Prazo de Conclusão')}")
    print("\nLOG: O ID e os dados estão corretos. O problema não é a consulta.")
else:
    print("\n❌ FALHA NA CONSULTA:")
    print(f"   Nenhum curso encontrado com o nome exato: '{NOME_DO_CURSO_PARA_TESTE}'")
    print("   Isso pode indicar que o nome no DB tem caracteres invisíveis ou está diferente.")