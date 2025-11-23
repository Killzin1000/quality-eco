import os
import json
import re
from typing import Tuple, List, Optional, Dict
from supabase import create_client, Client
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# === CONFIGURAÇÕES ===
print("LOG (Python): Carregando variáveis de ambiente...")
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Conexões
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
    print("LOG (Python): Conexão com Supabase e Gemini (2.5-flash) configurada.")
except Exception as e:
    print(f"ERRO CRÍTICO (Python): Falha ao iniciar cliente Gemini: {e}")
    model = None

configuracao_geracao = genai.GenerationConfig(
    temperature=0.2,
    top_p=0.8,
    top_k=40
)

PROMPTS_MODULARES: Dict[str, str] = {}
PROMPTS_CARREGADOS = False

# === FUNÇÃO DE CARREGAMENTO DE PROMPTS ===
def carregar_prompts_do_supabase() -> bool:
    global PROMPTS_MODULARES, PROMPTS_CARREGADOS
    print("LOG (Python): Carregando prompts modulares do Supabase...")
    try:
        # Nota: Selecionamos apenas prompts ATIVOS, o que é o comportamento correto.
        response = supabase.table("agent_prompts").select("nome_chave, conteudo").eq('ativo', True).execute()
        
        if not response.data:
            print("!!! ERRO CRÍTICO (Python): Nenhum prompt encontrado no Supabase.")
            PROMPTS_CARREGADOS = False
            return False

        PROMPTS_MODULARES = {}
        for prompt in response.data:
            if prompt.get('nome_chave') and prompt.get('conteudo'):
                PROMPTS_MODULARES[prompt['nome_chave']] = prompt['conteudo']
        
        print(f"LOG (Python): {len(PROMPTS_MODULARES)} prompts carregados com sucesso.")
        PROMPTS_CARREGADOS = True
        return True
    except Exception as e:
        print(f"!!! ERRO CRÍTICO (Python) ao carregar prompts: {e}")
        PROMPTS_CARREGADOS = False
        return False

# === NOVA FUNÇÃO PARA SALVAR NO BANCO ===
def salvar_mensagem(session_id: str, role: str, content: str):
    """Salva uma mensagem individual na tabela chat_messages do Supabase"""
    try:
        content_to_save = content.replace("HIDDEN:", "")
        supabase.table("chat_messages").insert({
            "session_id": session_id,
            "role": role,
            "content": content_to_save
        }).execute()
    except Exception as e:
        print(f"!!! ERRO AO SALVAR MENSAGEM NO DB: {e}")

# === FUNÇÃO PARA MONTAR O PROMPT BASE ===
def montar_prompt_base(perfil_cliente_prompt: str, dados_curso_injetados: Optional[str] = None) -> str:
    global PROMPTS_MODULARES
    
    # 1. Busca dos prompts fixos
    prompt_persona = PROMPTS_MODULARES.get('persona', "Você é um assistente.")
    prompt_regras = PROMPTS_MODULARES.get('regras_gerais', "Seja educado.")
    prompt_etapas = PROMPTS_MODULARES.get('etapas_atendimento', "Responda o cliente.")
    prompt_objecoes = PROMPTS_MODULARES.get('regras_objecoes', "Tente reverter a objeção.")
    prompt_elegibilidade = PROMPTS_MODULARES.get('regras_elegibilidade', "")
    
    # Lista de chaves já tratadas (para evitar duplicação no loop)
    chaves_excluidas = ['persona', 'regras_gerais', 'etapas_atendimento', 'regras_objecoes', 'regras_elegibilidade', 'prompt_navegacao', 'prompt_finalizacao']
    
    # 2. Inclusão dinâmica dos prompts restantes
    prompts_dinamicos = ""
    for chave, conteudo in PROMPTS_MODULARES.items():
        if chave not in chaves_excluidas:
            # Adiciona o título do módulo no corpo do prompt para ajudar a IA a priorizar
            prompts_dinamicos += f"\n--- MÓDULO: {chave.upper()} ---\n{conteudo}\n"

    # Prompts de controle do sistema
    prompt_navegacao = """
---
### 8. REGRA DE NAVEGAÇÃO
- Se o cliente pedir para "ir para a página do curso", "ver o curso", "me matricular" ou "quero comprar", e você souber DE QUAL CURSO ele está falando (seja pelo 'Contexto de Página' ou por um `[DADOS_CURSO_ENCONTRADO]` no histórico):
- Responda de forma afirmativa (ex: "Claro, estou te redirecionando...") E ADICIONE a tag `[NAVEGAR_PARA]` na última linha.
---
"""
    
    prompt_finalizacao = """
---
### 9. REGRA DE OURO: FIDELIDADE AOS DADOS (CRÍTICO!)
- **ATENÇÃO MÁXIMA:** Use APENAS os dados fornecidos no bloco `[DADOS_CURSO_ENCONTRADO]` abaixo.
- Se o dado diz "Necessário Estágio?: Não", você DEVE dizer que **não tem estágio**.
- Se o dado diz "Prazo de Conclusão: Mínimo 6", você DEVE dizer que são **6 meses**.
- NÃO use a "Carga Horária" para chutar a duração em meses. Use o campo "Tempo de Conclusão".
- Se você não sabe uma informação, diga que vai verificar com a secretaria, NÃO INVENTE.
- Se for buscar um curso, sua resposta de usuário deve ser neutra (ex: "Vou verificar...") e a tag `[CURSO_BUSCA] NOME DO CURSO` deve vir DEPOIS, em uma nova linha.
---
### 10. REGRA DE CONTEXTO ATIVO (CRÍTICO)
- Se o campo 'Contexto de Página (Curso)' no PERFIL DO CLIENTE já estiver preenchido com um curso:
- **NÃO USE** a tag `[CURSO_BUSCA]` para procurar esse mesmo curso novamente ou cursos similares.
- Assuma que você JÁ TEM os dados dele no bloco `[DADOS_CURSO_ENCONTRADO]`.
- Use `[CURSO_BUSCA]` **SOMENTE** se o cliente disser EXPLICITAMENTE: "quero ver outro curso", "mudar de curso", "busque por X".
---
"""

    # 3. Construção do prompt base com TUDO
    prompt_base = f"""
{prompt_persona}
{prompt_regras}
{prompt_objecoes}
{prompt_etapas}
{prompt_elegibilidade}
{prompt_navegacao}
{prompt_finalizacao}
{prompts_dinamicos}
"""

    if dados_curso_injetados:
        prompt_base += f"\n{dados_curso_injetados}\n"

    prompt_completo = f"""
{prompt_base}

{perfil_cliente_prompt}

Sua tarefa principal é gerar a resposta conversacional.
**Siga TODAS as regras definidas acima, especialmente a FIDELIDADE AOS DADOS e a PRESERVAÇÃO DO CONTEXTO.**
"""
    return prompt_completo


# === MODELOS DE DADOS ===
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatSession(BaseModel):
    nome_cliente: str = "visitante"
    formacao_cliente: Optional[str] = None
    tipo_formacao: Optional[str] = None
    area_preferencial: Optional[str] = None
    historico: List[ChatMessage] = []
    curso_contexto: Optional[str] = None

class ChatRequest(BaseModel):
    mensagem: str
    session: ChatSession

class ChatResponse(BaseModel):
    resposta_bot: str
    session_atualizada: ChatSession
    navegar_para: Optional[str] = None

# === INICIALIZAÇÃO DA API ===
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === FUNÇÕES DE LÓGICA ===

def detectar_tipo_e_palavras_chave(termo_busca_ia: str) -> Tuple[str, List[str]]:
    termo_lower = termo_busca_ia.lower()
    tipo_query = None
    if "pós" in termo_lower or "especialização" in termo_lower: tipo_query = "Pós-Graduação"
    elif "r2" in termo_lower or "formação pedagógica" in termo_lower: tipo_query = "Formação Pedagógica"
    elif "2ª licenciatura" in termo_lower or "segunda licenciatura" in termo_lower: tipo_query = "2ª Licenciatura"
    elif "licenciatura" in termo_lower: tipo_query = "Licenciatura"
    
    termo_limpo = re.sub(r"\b(Pós-Graduação|em|de|da|na|2ª Licenciatura|Licenciatura|Curso|sobre|o|a|os|as|R2|Formação Pedagógica)\b", "", termo_busca_ia, flags=re.IGNORECASE)
    if "uti" in termo_limpo.lower(): termo_limpo = "Terapia Intensiva"
    
    termo_limpo = re.sub(r"[\*#`]", "", termo_limpo)
    termo_limpo = re.sub(r"\s+", " ", termo_limpo).strip()
    
    palavras_chave = [p for p in termo_limpo.split() if len(p) > 2]
    if not palavras_chave and termo_limpo: palavras_chave = [termo_limpo]
    return tipo_query, palavras_chave

def buscar_cursos_relevantes(termo_busca_ia: str, area_preferencial: str = None) -> list:
    global supabase
    tipo_curso, palavras_chave = detectar_tipo_e_palavras_chave(termo_busca_ia)
    
    if not palavras_chave: return []
    
    resultados = []
    try:
        select_cols = (
            "id, \"Nome dos cursos\", \"Tipo\", \"Modalidade\", \"Carga Horária\", "
            "\"Prazo de Conclusão\", \"Área de Atuação\", \"Pré Requesito para Matrícula\", "
            "\"Necessário Artigo?\", \"Necessário Estágio?\", \"Preço Boleto / Valor para Cadastro\", "
            "\"Preço Cartão / Valor para Cadastro\", \"Preço Pix / Valor para Cadastro\", "
            "\"Link e-MEC Curso\", \"Polo\", \"Observações\", \"Ementa\""
        )
        
        if area_preferencial:
            query = supabase.table("cursos").select(select_cols).eq('"Área de Atuação"', area_preferencial)
            if tipo_curso: query = query.ilike('"Tipo"', f"%{tipo_curso}%")
            for palavra in palavras_chave:
                query = query.ilike('"Nome dos cursos"', f"%{palavra}%")
            
            response = query.execute()
            if response.data:
                resultados.extend(response.data)

        if not resultados:
            query = supabase.table("cursos").select(select_cols)
            if tipo_curso: query = query.ilike('"Tipo"', f"%{tipo_curso}%")
            for palavra in palavras_chave:
                query = query.ilike('"Nome dos cursos"', f"%{palavra}%")
            
            response = query.execute()
            if response.data:
                resultados.extend(response.data)
        
        cursos_unicos = list({curso['id']: curso for curso in resultados}.values())
        return cursos_unicos[:5]

    except Exception as e:
        print(f"LOG (Python) ERRO SUPABASE: {e}")
        return []

def buscar_curso_por_nome_exato(nome_curso: str, completo: bool = False) -> Optional[Dict]:
    global supabase
    try:
        if completo:
            select_cols = (
                "id, \"Nome dos cursos\", \"Tipo\", \"Modalidade\", \"Carga Horária\", "
                "\"Prazo de Conclusão\", \"Área de Atuação\", \"Pré Requesito para Matrícula\", "
                "\"Necessário Artigo?\", \"Necessário Estágio?\", \"Preço Boleto / Valor para Cadastro\", "
                "\"Preço Cartão / Valor para Cadastro\", \"Preço Pix / Valor para Cadastro\", "
                "\"Link e-MEC Curso\", \"Polo\", \"Observações\", \"Ementa\""
            )
        else:
            select_cols = "id"

        response = supabase.table("cursos").select(select_cols).eq('"Nome dos cursos"', nome_curso).limit(1).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        pass
    return None

def montar_resposta_dividida(curso: dict, nome_cliente: str, resumido: bool = False):
    nome = curso.get("Nome dos cursos", "Curso Não Encontrado")
    tipo = curso.get("Tipo", "")
    modalidade = curso.get("Modalidade", "")
    carga = curso.get("Carga Horária", "")
    prazo = curso.get("Prazo de Conclusão", "")
    area = curso.get("Área de Atuação", "")
    pre = curso.get("Pré Requesito para Matrícula", "Nenhum")
    boleto = curso.get("Preço Boleto / Valor para Cadastro", "Consulte") 
    cartao = curso.get("Preço Cartão / Valor para Cadastro", "Consulte")
    pix = curso.get("Preço Pix / Valor para Cadastro", "Consulte")
    link_emec = curso.get("Link e-MEC Curso", "Link indisponível")
    polo = curso.get("Polo", "EaD")
    obs = curso.get("Observações", "")
    ementa_link = curso.get("Ementa", None)
    
    raw_artigo = curso.get("Necessário Artigo?", "Não informado")
    raw_estagio = curso.get("Necessário Estágio?", "Não informado")

    artigo_str = "SIM (É Obrigatório fazer Artigo/TCC)" if raw_artigo == "Sim" else "NÃO (Não precisa de TCC/Artigo)"
    estagio_str = "SIM (É Obrigatório fazer Estágio)" if raw_estagio == "Sim" else "NÃO (Não precisa de Estágio)"
    
    nome_tratado = "você" if nome_cliente == "visitante" else nome_cliente
    
    if resumido:
         resposta_gancho = (f"Opção: **{nome}**\n" f"• **Tipo:** {tipo}\n" f"• **Área:** {area}")
         return resposta_gancho, "" # Não retornamos dados ocultos no resumido
    
    resposta_gancho = (f"Perfeito, {nome_cliente}! 🎓\n" f"Encontrei o curso de **{nome}**. Ele é uma **{tipo}** focada exatamente na área de **{area}**.")
    pergunta_fechamento = f"Isso se alinha com o que {nome_tratado} estava pensando? Se sim, já te passo mais detalhes sobre a duração e a modalidade dele. 😉"
    
    # Adicionando o ID ao bloco de dados para garantir que a IA (se for chamada) possa usá-lo
    dados_para_contexto = f"""
    [DADOS_CURSO_ENCONTRADO: {nome}]
    =============================================
    DADOS OFICIAIS DO SISTEMA (USE ESTES DADOS EXATAMENTE):
    - ID do Curso: {curso.get('id')}
    - Nome do Curso: {nome}
    - Tipo: {tipo}
    - Modalidade: {modalidade}
    - Carga Horária Total: {carga}
    - Tempo de Conclusão (Duração): {prazo}
    - Requisitos para Matrícula: {pre}
    - Trabalho Final (TCC/Artigo): {artigo_str}
    - Estágio Supervisionado: {estagio_str}
    - Polo: {polo}
    
    VALORES DE INVESTIMENTO:
    - Opção Boleto: {boleto}
    - Opção Cartão: {cartao}
    - Opção Pix: {pix}
    
    LINKS E EXTRAS:
    - Ementa: {ementa_link}
    - Link e-MEC: {link_emec}
    - Observações: {obs}
    =============================================
    """
    return resposta_gancho, dados_para_contexto, pergunta_fechamento

def atualizar_dados_cliente(session: ChatSession, mensagem_usuario: str, historico_recente_bot: list) -> bool:
    msg_lower = mensagem_usuario.lower()
    last_bot_msg = ""
    if historico_recente_bot:
        last_bot_msg = str(historico_recente_bot[-1].content).lower()
        
    etiqueta_atualizada = False
    
    if session.nome_cliente == "visitante":
        match_nome = re.search(r"(?:me chamo|meu nome é|sou o|sou)\s+([a-zA-Záéíóúâêôãõç]{3,})", msg_lower)
        if match_nome:
            nome = match_nome.group(1).capitalize()
            if nome.lower() not in ["formado", "licenciado", "graduado", "bacharel", "tecnólogo"]:
                session.nome_cliente = nome
                etiqueta_atualizada = True
        elif "seu nome?" in last_bot_msg and len(mensagem_usuario.split()) <= 3:
             nome_extraido = mensagem_usuario.strip().title()
             if nome_extraido.lower() not in ["olá", "oi", "sou", "tenho", "formado", "bacharel", "licenciado", "tecnólogo", "tudo", "bom", "claro", "sim"]:
                session.nome_cliente = nome_extraido
                etiqueta_atualizada = True

    if ("graduação" in last_bot_msg or "licenciatura" in last_bot_msg or "formação" in last_bot_msg) and \
       ("formado em" in msg_lower or "licenciado em" in msg_lower or "tenho" in msg_lower or "sou" in msg_lower or "bacharel" in msg_lower or "tecnólogo" in msg_lower) and \
       len(mensagem_usuario.split()) < 15:
        
        match_formacao = re.search(r"((?:formado|licenciado|bacharel|tecnólogo)(?: em)?\s+[a-zA-Záéíóúâêôãõç\s]+)", msg_lower)
        if match_formacao:
            formacao_texto = match_formacao.group(1).strip().capitalize()
        else:
            formacao_texto = mensagem_usuario.replace("já sou", "").replace("sou", "").strip().capitalize()

        if len(formacao_texto) > 5:
            session.formacao_cliente = formacao_texto
            tipo_form = "Superior Completo"
            if "bacharel" in msg_lower: tipo_form = "Bacharel"
            elif "licenciado" in msg_lower or "licenciatura" in msg_lower: tipo_form = "Licenciado"
            elif "tecnólogo" in msg_lower: tipo_form = "Tecnólogo"
            session.tipo_formacao = tipo_form

            area_nova = None
            if "enfermagem" in msg_lower or "saúde" in msg_lower: area_nova = "Saúde"
            elif "pedagogia" in msg_lower or "educação" in msg_lower or "letras" in msg_lower: area_nova = "Educação"
            elif "educação física" in msg_lower: area_nova = "Educação/Saúde"

            if area_nova:
                session.area_preferencial = area_nova
            
            etiqueta_atualizada = True

    elif not etiqueta_atualizada:
        if "pedagogia" in msg_lower or "educação" in msg_lower:
            if session.area_preferencial != "Educação":
                 session.area_preferencial = "Educação"
        elif "enfermagem" in msg_lower or "saúde" in msg_lower:
             if session.area_preferencial != "Saúde":
                 session.area_preferencial = "Saúde"
    
    return etiqueta_atualizada


# === FUNÇÃO PRINCIPAL ===
def gerar_resposta_usuario(mensagem: str, session: ChatSession) -> Tuple[str, ChatSession, Optional[str]]:
    global PROMPTS_CARREGADOS, model, configuracao_geracao
    
    navegar_para_link = None
    dados_do_contexto = None 
    curso_selecionado_via_numero = None
    
    if not PROMPTS_CARREGADOS:
        print("LOG (Python): Prompts não carregados. Tentando carregar agora...")
        sucesso = carregar_prompts_do_supabase()
        if not sucesso:
             resposta_erro = "Desculpe, meu cérebro (IA) está offline."
             session.historico.append(ChatMessage(role="assistant", content=resposta_erro))
             return resposta_erro, session, None

    # SALVAR MSG USUARIO (O Python fará isso se não for a mensagem inicial)
    if mensagem != "...iniciar...":
        salvar_mensagem(session.nome_cliente, "user", mensagem)
    
    msg_lower = mensagem.lower()
    
    # === ETAPA 1.1: INTERCEPTAR PERGUNTA SOBRE CARGA HORÁRIA (Defensive Bypass) ===
    if session.curso_contexto and ("carga horaria" in msg_lower or "carga horária" in msg_lower):
        print("LOG (Python): Interceptando pergunta sobre Carga Horária (Defensive Bypass).")
        curso_obj = buscar_curso_por_nome_exato(session.curso_contexto, completo=True)
        
        if curso_obj and curso_obj.get('Carga Horária'):
            carga_horaria_txt = curso_obj.get('Carga Horária')
            nome_cliente_local = session.nome_cliente
            
            resposta_cargahoraria = f"""
Claro, {nome_cliente_local}! A carga horária total para o curso de **{session.curso_contexto}** é de **{carga_horaria_txt}**.

Mais alguma dúvida sobre os detalhes acadêmicos? Caso contrário, podemos falar sobre os valores de investimento! 😉
"""
            session.historico.append(ChatMessage(role="assistant", content=resposta_cargahoraria))
            salvar_mensagem(session.nome_cliente, "assistant", resposta_cargahoraria)
            print(f"LOG (Python): Resposta forçada de Carga Horária: {carga_horaria_txt}")
            return resposta_cargahoraria, session, None

    # === ETAPA 1.2: INTERCEPTAR PERGUNTA SOBRE ARTIGO/TCC/ESTÁGIO (Defensive Bypass) ===
    if session.curso_contexto and ("artigo" in msg_lower or "tcc" in msg_lower or "estágio" in msg_lower or "estagio" in msg_lower):
        print("LOG (Python): Interceptando pergunta sobre Artigo/Estágio (Defensive Bypass).")
        curso_obj = buscar_curso_por_nome_exato(session.curso_contexto, completo=True)
        
        if curso_obj:
            artigo_val = curso_obj.get('Necessário Artigo?', 'Não Informado')
            estagio_val = curso_obj.get('Necessário Estágio?', 'Não Informado')
            nome_cliente_local = session.nome_cliente
            
            # Formatação dos textos para a resposta
            artigo_txt = "NÃO, não é necessário entregar Artigo ou TCC" if artigo_val == "Não" else f"SIM, é obrigatório um {artigo_val.upper()}"
            estagio_txt = "NÃO, o curso não exige Estágio Supervisionado" if estagio_val == "Não" else f"SIM, é obrigatório o Estágio Supervisionado"

            resposta_artigo_estagio = f"""
Claro, {nome_cliente_local}! Essa é uma informação de conformidade muito importante.

Para o curso de **{session.curso_contexto}**, os requisitos de conclusão são:
* **Artigo/TCC:** {artigo_txt}.
* **Estágio Supervisionado:** {estagio_txt}.

Com isso, você já tem certeza dos requisitos acadêmicos. Quer que eu te envie os **valores de investimento** agora? 😉
"""
            session.historico.append(ChatMessage(role="assistant", content=resposta_artigo_estagio))
            salvar_mensagem(session.nome_cliente, "assistant", resposta_artigo_estagio)
            print("LOG (Python): Resposta forçada de Requisitos (Artigo/Estágio).")
            return resposta_artigo_estagio, session, None
            
    # === ETAPA 1.3: INTERCEPTAR PERGUNTA SOBRE EMENTA (Defensive Bypass) ===
    if session.curso_contexto and ("grade" in msg_lower or "ementa" in msg_lower):
        print("LOG (Python): Interceptando pergunta sobre Ementa/Grade (Defensive Bypass).")
        curso_obj = buscar_curso_por_nome_exato(session.curso_contexto, completo=True)
        
        if curso_obj and curso_obj.get('Ementa'):
            ementa_link = curso_obj.get('Ementa')
            nome_cliente_local = session.nome_cliente
            
            resposta_ementa = f"""
Ah, sim! A ementa é super importante, {nome_cliente_local}. 😊

Você pode acessar a ementa completa do curso de **{session.curso_contexto}** por este link: [Ementa Completa]({ementa_link})

Dê uma olhadinha com calma e me diga o que achou, combinado?
"""
            session.historico.append(ChatMessage(role="assistant", content=resposta_ementa))
            salvar_mensagem(session.nome_cliente, "assistant", resposta_ementa)
            print("LOG (Python): Resposta forçada de Ementa/Grade.")
            return resposta_ementa, session, None

    # === ETAPA 1.4: INTERCEPTAR PERGUNTA SOBRE MEC/RECONHECIMENTO (Defensive Bypass) ===
    if session.curso_contexto and ("mec" in msg_lower or "reconhecimento" in msg_lower or "valida" in msg_lower):
        print("LOG (Python): Interceptando pergunta sobre MEC/Reconhecimento (Defensive Bypass).")
        curso_obj = buscar_curso_por_nome_exato(session.curso_contexto, completo=True)
        
        if curso_obj and curso_obj.get('Link e-MEC Curso'):
            link_mec = curso_obj.get('Link e-MEC Curso')
            nome_cliente_local = session.nome_cliente
            
            # Formato Markdown [label](link)
            link_markdown = f"[Link para o e-MEC]({link_mec})"
            
            resposta_mec = f"""
Compreendo perfeitamente sua pergunta, {nome_cliente_local}! É super importante ter essa segurança sobre o reconhecimento do curso.

Sim, a **{session.curso_contexto}** é totalmente reconhecida pelo MEC! Isso significa que seu diploma terá validade em todo o território nacional.

Você pode verificar o reconhecimento diretamente no site do e-MEC, através deste link: {link_markdown}

Ter essa garantia é fundamental para sua jornada profissional, não é mesmo, {nome_cliente_local}? ✨
"""
            session.historico.append(ChatMessage(role="assistant", content=resposta_mec))
            salvar_mensagem(session.nome_cliente, "assistant", resposta_mec)
            print("LOG (Python): Resposta forçada de Reconhecimento MEC.")
            return resposta_mec, session, None

    # === INTERCEPTAÇÃO DE NÚMEROS (PRIORIDADE MÁXIMA - BYPASS GEMINI) ===
    match_numero = re.match(r"^(\d+)$", mensagem.strip())
    if match_numero and session.historico and session.historico[-1].role == "assistant":
        try:
            last_msg = session.historico[-1].content
            opcoes = re.findall(r"\n(\d+)\.\s+(.*?)(?=\n|$)", last_msg)
            
            if opcoes:
                indice_escolhido = int(match_numero.group(1))
                
                curso_selecionado_via_numero = None
                for num_str, nome_curso in opcoes:
                    if int(num_str) == indice_escolhido:
                        curso_selecionado_via_numero = nome_curso.strip()
                        break
                
                if curso_selecionado_via_numero:
                    print(f"LOG (Python): Usuário digitou '{{mensagem}}' -> Interpretado como seleção de curso: {{curso_selecionado_via_numero}}")
                    
                    # 1. Tenta buscar o curso completo imediatamente
                    curso_obj = buscar_curso_por_nome_exato(curso_selecionado_via_numero, completo=True)

                    if curso_obj:
                        # LOGS DE DEBUG
                        print(f"LOG (DEBUG): Curso ID {curso_obj.get('id')} ENCONTRADO com SUCESSO via seleção numérica.")
                        
                        session.curso_contexto = curso_selecionado_via_numero
                        nome_cliente_local = session.nome_cliente
                        
                        # 2. Monta o bloco de dados oculto 
                        _, dados_ocultos, _ = montar_resposta_dividida(curso_obj, nome_cliente_local, resumido=False)

                        # --- GERAÇÃO DA RESPOSTA DETALHADA DIRETO NO PYTHON (ETAPA 5.1) ---
                        modalidade_txt = curso_obj.get('Modalidade', 'Não Informada')
                        prazo_txt = curso_obj.get('Prazo de Conclusão', 'Consulte a Duração')
                        requisito_txt = curso_obj.get('Pré Requesito para Matrícula', 'Não Informado')
                        carga_horaria_txt = curso_obj.get('Carga Horária', 'Não Informada')
                        
                        artigo_val = curso_obj.get('Necessário Artigo?', 'Não Informado')
                        estagio_val = curso_obj.get('Necessário Estágio?', 'Não Informado')
                        
                        artigo_txt = "Sim" if artigo_val == "Sim" else "Não"
                        estagio_txt = "Sim" if estagio_val == "Sim" else "Não"
                        
                        # 3. CONSTRÓI A RESPOSTA CONVERSACIONAL COM DADOS REAIS
                        resposta_detalhada_python = f"""
Perfeito, {nome_cliente_local}! 🎓 Você escolheu o curso de **{curso_obj.get('Nome dos cursos')}**.
                         
Vou te passar os detalhes acadêmicos:
* O curso é na modalidade **{modalidade_txt}** e tem duração de **{prazo_txt}**.
* A **Carga Horária** é de **{carga_horaria_txt}**.
* O requisito é ter **{requisito_txt}**, e como você já é formado em {session.formacao_cliente or 'Pedagogia'}, se encaixa perfeitamente! 😊
* Requisitos de conclusão: **Artigo/TCC**: {artigo_txt}. **Estágio**: {estagio_txt}.

Isso se alinha com o que você imaginava para o curso?
"""
                        
                        # 4. Atualiza o histórico (HIDDEN e a resposta)
                        session.historico.append(ChatMessage(role="assistant", content=f"HIDDEN:{dados_ocultos}"))
                        session.historico.append(ChatMessage(role="assistant", content=resposta_detalhada_python))
                        salvar_mensagem(session.nome_cliente, "assistant", resposta_detalhada_python)
                        print("LOG (Python): Resposta forçada após seleção numérica. Bypassing Gemini call.")

                        return resposta_detalhada_python, session, None
                    else:
                         # Se o curso não for achado (DB ou nome errado), damos uma mensagem de erro controlada.
                         resposta_erro_bypass = f"Ops, {session.nome_cliente}. Não consegui carregar os detalhes do curso que você digitou. Por favor, tente digitar o nome completo do curso ou selecione outra opção."
                         session.historico.append(ChatMessage(role="assistant", content=resposta_erro_bypass))
                         salvar_mensagem(session.nome_cliente, "system_error", resposta_erro_bypass)
                         return resposta_erro_bypass, session, None

            # Se a opção numérica existir, mas o curso não for encontrado (else/except), cairemos aqui
            # para continuar para o Gemini, que é onde a lista errada é gerada.
            # O bloco 'else' está ausente, o que faria o fluxo cair direto para o Gemini
        except Exception as e:
            # Em caso de erro de REGEX ou INT, informamos o usuário.
            print(f"!!! CRITICAL BYPASS ERROR: {e}") 
            resposta_erro_critico = f"Desculpe, {session.nome_cliente}. Ocorreu um erro interno ao processar sua escolha numérica. Por favor, tente novamente ou digite o nome completo do curso."
            session.historico.append(ChatMessage(role="assistant", content=resposta_erro_critico))
            salvar_mensagem(session.nome_cliente, "system_error", resposta_erro_critico)
            return resposta_erro_critico, session, None

    # =========================================================================
    
    # Se o fluxo forçado não retornou, continuamos para o Gemini.
    if curso_selecionado_via_numero and not curso_selecionado_via_numero.startswith("Quero saber mais"):
        mensagem = f"Quero saber mais sobre o curso {curso_selecionado_via_numero}"


    historico_recente_bot = [msg for msg in session.historico if msg.role == "assistant"]
    
    if session.curso_contexto:
        print(f"LOG (Python): Contexto ativo: {session.curso_contexto}. Atualizando dados...")
        curso_obj = buscar_curso_por_nome_exato(session.curso_contexto, completo=True)
        if curso_obj:
            _, dados_ocultos, _ = montar_resposta_dividida(curso_obj, session.nome_cliente)
            dados_do_contexto = dados_ocultos
        else:
            print(f"!!! ALERTA (Python): Curso do contexto '{session.curso_contexto}' não achado no DB. Limpando contexto.")
            session.curso_contexto = None

    if mensagem != "...iniciar...":
        # ATUALIZA AS ETIQUETAS COM BASE NA ÚLTIMA MENSAGEM DO USUÁRIO
        atualizar_dados_cliente(session, mensagem, historico_recente_bot)
        # Adiciona a mensagem re-escrita ou original ao histórico da sessão
        session.historico.append(ChatMessage(role="user", content=mensagem))
    
    nome_cliente_local = session.nome_cliente

    perfil_cliente_prompt = f"""
---
🧠 **PERFIL DO CLIENTE (Etiquetas Obrigatórias)**
- **Nome:** {session.nome_cliente}
- **Formação:** {session.formacao_cliente if session.formacao_cliente else 'Ainda não informado'}
- **Tipo de Formação:** {session.tipo_formacao if session.tipo_formacao else 'Ainda não informado'}
- **Área Preferencial:** {session.area_preferencial if session.area_preferencial else 'Ainda não definida'}
- **Contexto de Página (Curso):** {session.curso_contexto if session.curso_contexto else 'Nenhum'}
---
"""
    
    if not dados_do_contexto:
        for msg in reversed(session.historico):
             if "[DADOS_CURSO_ENCONTRADO:" in msg.content:
                  content_clean = msg.content.replace("HIDDEN:", "")
                  dados_do_contexto = content_clean
                  break
    
    prompt_sistema_completo = montar_prompt_base(perfil_cliente_prompt, dados_do_contexto)
    
    historico_limpo_str = ""
    for msg in session.historico[-10:]:
        if not msg.content.startswith("HIDDEN:") and not msg.content.startswith("[DADOS_CURSO_ENCONTRADO:"):
            role_str = "Bot" if msg.role in ["bot", "assistant"] else "Usuário"
            historico_limpo_str += f"{role_str}: {msg.content}\n"

    prompt_final = f"""
{prompt_sistema_completo}

Histórico recente da conversa:
{historico_limpo_str}

Nova mensagem do usuário: "{mensagem}"

OBSERVAÇÃO: Se o histórico mostrar uma lista numerada e o usuário tiver escolhido uma opção, assuma que o curso escolhido é o foco agora e use os dados dele.
"""

    try:
        if not model: raise Exception("Cliente Gemini não foi inicializado.")
             
        print(f"LOG (Python): Gerando conteúdo no Gemini para: {mensagem}")
        interpretacao = model.generate_content(prompt_final, generation_config=configuracao_geracao)
        resposta_bruta = interpretacao.text.strip()
        
        if "PERFIL DO CLIENTE" in resposta_bruta:
            resposta_ia_conversacional = "Desculpe, me confundi. Pode repetir?"
        else:
            resposta_ia_conversacional = resposta_bruta
        
        match_nav = re.search(r"\[NAVEGAR_PARA\]", resposta_bruta, re.IGNORECASE)
        match_busca = re.search(r"\[CURSO_BUSCA\]\s*(.*)\b([a-zA-Z\s\-áéíóúâêôãõç]{5,}[a-zA-Záéíóúâêôãõç])\s*$", resposta_bruta, re.IGNORECASE | re.DOTALL)

        if match_nav:
            print("LOG (Python): IA solicitou [NAVEGAR_PARA]")
            resposta_ia_conversacional = resposta_bruta.split(match_nav.group(0))[0].strip()
            
            curso_para_navegar = session.curso_contexto
            if not curso_para_navegar and dados_do_contexto:
                 match_dados = re.search(r"\[DADOS_CURSO_ENCONTRADO:\s*(.*?)\]", dados_do_contexto)
                 if match_dados:
                     curso_para_navegar = match_dados.group(1).strip()

            if curso_para_navegar:
                print(f"LOG (Python): Navegando para: {curso_para_navegar}")
                curso_obj = buscar_curso_por_nome_exato(curso_para_navegar, completo=False)
                if curso_obj and curso_obj.get('id'):
                    navegar_para_link = f"/curso/{curso_obj.get('id')}"
            else:
                 print("!!! ERRO (Python): IA pediu para navegar mas não achou curso.")
            
            salvar_mensagem(session.nome_cliente, "assistant", resposta_ia_conversacional)

        elif match_busca: 
            print("LOG (Python): IA solicitou [CURSO_BUSCA]")
            resposta_ia_conversacional = resposta_bruta.split(match_busca.group(0))[0].strip()
            termo_principal = match_busca.group(2).strip()
            
            # === BLINDAGEM DE CONTEXTO ===
            # Se já temos contexto e a busca é redundante, ignoramos
            if session.curso_contexto and termo_principal.lower() in session.curso_contexto.lower():
                 print("LOG (Python): Busca redundante. Mantendo contexto.")
                 cursos_encontrados_raw = []
            else:
                 cursos_encontrados_raw = buscar_cursos_relevantes(termo_principal, session.area_preferencial)
            # =============================
            
            if cursos_encontrados_raw:
                # Se tivermos objetos completos (do force search), não precisamos re-buscar por ID
                if 'Nome dos cursos' not in cursos_encontrados_raw[0]: 
                    ids_cursos = [c['id'] for c in cursos_encontrados_raw]
                    resp_completos = supabase.table("cursos").select("*").in_("id", ids_cursos).execute()
                    cursos_encontrados_raw = resp_completos.data or []

            if not cursos_encontrados_raw and not session.curso_contexto:
                resposta_falha = resposta_ia_conversacional + f"\n\nOps, {nome_cliente_local}. Não encontrei cursos com esse nome."
                session.historico.append(ChatMessage(role="assistant", content=resposta_falha))
                salvar_mensagem(session.nome_cliente, "assistant", resposta_falha)
                return resposta_falha, session, None
            
            if len(cursos_encontrados_raw) == 1:
                print("LOG (Python): 1 curso encontrado.")
                curso = cursos_encontrados_raw[0]
                session.curso_contexto = curso.get('Nome dos cursos')
                
                gancho, dados_ocultos, pergunta = montar_resposta_dividida(curso, nome_cliente_local, resumido=False)
                
                session.historico.append(ChatMessage(role="assistant", content=f"HIDDEN:{dados_ocultos}"))
                
                resposta_final = f"{resposta_ia_conversacional}\n\n{gancho}\n\n{pergunta}"
                session.historico.append(ChatMessage(role="assistant", content=resposta_final))
                
                salvar_mensagem(session.nome_cliente, "assistant", resposta_final)
                return resposta_final, session, None

            if len(cursos_encontrados_raw) > 1:
                print(f"LOG (Python): {len(cursos_encontrados_raw)} cursos encontrados. Listando opções numeradas.")
                
                resposta_final = resposta_ia_conversacional + "\n\nEncontrei estas opções:\n"
                for i, curso in enumerate(cursos_encontrados_raw, 1):
                     nome_do_curso = curso.get('Nome dos cursos', 'Curso')
                     resposta_final += f"\n{i}. {nome_do_curso}"
                
                resposta_final += "\n\nPor favor, digite o **número** da opção que deseja conhecer melhor (ex: 1)."
                
                session.historico.append(ChatMessage(role="assistant", content=resposta_final))
                salvar_mensagem(session.nome_cliente, "assistant", resposta_final)
                return resposta_final, session, navegar_para_link
                        
        print("LOG (Python): Resposta conversacional normal.")
        session.historico.append(ChatMessage(role="assistant", content=resposta_ia_conversacional))
        salvar_mensagem(session.nome_cliente, "assistant", resposta_ia_conversacional)
        return resposta_ia_conversacional, session, navegar_para_link

    except Exception as e:
        print(f"LOG (Python) ERRO GEMINI: {e}")
        resposta_erro = f"Ocorreu um erro ao gerar a resposta. [LOG INTERNO: {e}]"
        session.historico.append(ChatMessage(role="assistant", content=resposta_erro))
        salvar_mensagem(session.nome_cliente, "system_error", str(e))
        return resposta_erro, session, None


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    print(f"\n--- LOG (Python) API: Nova Requisição Recebida ---")
    try:
        resposta_bot, session_atualizada, navegar_para = gerar_resposta_usuario(request.mensagem, request.session)
        # NOVO LOG PARA ACOMPANHAR A SESSÃO ATUALIZADA
        print(
            "LOG (ChatProvider) SESSÃO ATUALIZADA:", 
            json.dumps({ 
                "nome": session_atualizada.nome_cliente, 
                "curso": session_atualizada.curso_contexto,
                "formacao": session_atualizada.formacao_cliente,
            })
        )
        return ChatResponse(
            resposta_bot=resposta_bot,
            session_atualizada=session_atualizada,
            navegar_para=navegar_para
        )
    except Exception as e:
        print(f"!!! ERRO FATAL (Python) Desconhecido: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {e}")

@app.post("/refresh-prompts", status_code=200)
async def refresh_prompts():
    sucesso = carregar_prompts_do_supabase()
    if sucesso: return {"status": "sucesso", "prompts_carregados": len(PROMPTS_MODULARES)}
    else: raise HTTPException(status_code=500, detail="Falha ao recarregar prompts.")

@app.get("/")
def root(): return {"status": "API do Bot ESP (v5.3 - Name Fix) está online!"}

if __name__ == "__main__":
    carregar_prompts_do_supabase()
    print("LOG (Python): Iniciando servidor FastAPI localmente na porta 8000...")
    uvicorn.run("bot_api:app", host="127.0.0.1", port=8000, reload=True)