import glob
import os
from datetime import datetime, timedelta

import pandas as pd
# Configuração geral
padrao_arquivos = './csv_*.csv'
arquivo_saida = './infrawatch_resumo.csv'

minutos_ultima_janela = 60     #última hora
minutos_janela_curta = 30      #últimos 30 minutos
minutos_para_considerar_offline = 2  # se não chegou dado novo marca offline

# limites de alerta (em %)
limite_cpu_critico = 90
limite_cpu_atencao = 70
limite_ram_critico = 90
limite_ram_atencao = 75
limite_disco_critico = 95
limite_disco_atencao = 85


def classificar(valor, limite_atencao, limite_critico):
    """Transforma um número em um status de alerta."""
    if pd.isna(valor):
        return 'SEM DADOS'
    if valor >= limite_critico:
        return 'CRITICO'
    if valor >= limite_atencao:
        return 'ATENCAO'
    return 'OK'


def encontrar_colunas_disco(df):
    """Descobre dinamicamente quantas colunas existem."""
    colunas = []
    for nome_coluna in df.columns:
        if nome_coluna.startswith('disco_'):
            colunas.append(nome_coluna)
    return colunas


def media_na_janela(df, coluna, minutos):
    """Calcula a média de uma coluna filtrando pelo horário real,
    assim não depende do intervalo de coleta ser constante."""
    if coluna not in df.columns:
        return float('nan')
    horario_limite = df['horario'].max() - timedelta(minutes=minutos)
    janela = df[df['horario'] >= horario_limite]
    return janela[coluna].mean()


def processar_host(caminho_arquivo):
    """Lê um CSV de um host e devolve um dicionário com snapshot + resumo."""
    nome_arquivo = os.path.basename(caminho_arquivo)
    df = pd.read_csv(caminho_arquivo, sep=';')

    if len(df) == 0:
        return None

    df['horario'] = pd.to_datetime(df['horario'])

    colunas_numericas = ['cpu_total', 'ram', 'swap', 'rede_enviado_mb', 'rede_recebido_mb']
    colunas_disco = encontrar_colunas_disco(df)
    colunas_numericas = colunas_numericas + colunas_disco

    if 'temperatura_c' in df.columns:
        colunas_numericas.append('temperatura_c')
    if 'bateria_percent' in df.columns:
        colunas_numericas.append('bateria_percent')

    for coluna in colunas_numericas:
        if coluna in df.columns:
            df[coluna] = pd.to_numeric(df[coluna], errors='coerce')

    hostname = df['hostname'].iloc[-1]
    ultima_linha = df.iloc[-1]
    ultimo_horario = df['horario'].max()

    atraso = datetime.now() - ultimo_horario
    esta_offline = atraso > timedelta(minutes=minutos_para_considerar_offline)

    cpu_atual = ultima_linha['cpu_total']
    ram_atual = ultima_linha['ram']

    # disco atual: pega o maior uso entre todas as partições da máquina
    disco_atual = float('nan')
    if len(colunas_disco) > 0:
        valores_disco_atual = []
        for coluna in colunas_disco:
            valores_disco_atual.append(ultima_linha[coluna])
        disco_atual = max(valores_disco_atual)

    #médias por janela
    cpu_media_hora = media_na_janela(df, 'cpu_total', minutos_ultima_janela)
    ram_media_hora = media_na_janela(df, 'ram', minutos_ultima_janela)

    disco_media_30min = float('nan')
    if len(colunas_disco) > 0:
        somas = []
        for coluna in colunas_disco:
            valor = media_na_janela(df, coluna, minutos_janela_curta)
            if pd.notna(valor):
                somas.append(valor)
        if len(somas) > 0:
            disco_media_30min = sum(somas) / len(somas)

    #status de alerta
    if esta_offline:
        status_geral = 'OFFLINE'
    else:
        status_cpu = classificar(cpu_atual, limite_cpu_atencao, limite_cpu_critico)
        status_ram = classificar(ram_atual, limite_ram_atencao, limite_ram_critico)
        status_disco = classificar(disco_atual, limite_disco_atencao, limite_disco_critico)

        if status_cpu == 'CRITICO' or status_ram == 'CRITICO' or status_disco == 'CRITICO':
            status_geral = 'CRITICO'
        elif status_cpu == 'ATENCAO' or status_ram == 'ATENCAO' or status_disco == 'ATENCAO':
            status_geral = 'ATENCAO'
        else:
            status_geral = 'OK'

    resultado = {
        'hostname': hostname,
        'arquivo': nome_arquivo,
        'total_amostras': len(df),
        'ultimo_horario': ultimo_horario,
        'minutos_desde_ultimo_dado': round(atraso.total_seconds() / 60, 1),
        'status_geral': status_geral,
        'cpu_atual': round(cpu_atual, 1) if pd.notna(cpu_atual) else '',
        'ram_atual': round(ram_atual, 1) if pd.notna(ram_atual) else '',
        'disco_atual_maior': round(disco_atual, 1) if pd.notna(disco_atual) else '',
        'cpu_media_ultima_hora': round(cpu_media_hora, 1) if pd.notna(cpu_media_hora) else '',
        'ram_media_ultima_hora': round(ram_media_hora, 1) if pd.notna(ram_media_hora) else '',
        'disco_media_ultimos_30min': round(disco_media_30min, 1) if pd.notna(disco_media_30min) else '',
    }
    return resultado


# Processa todos os hosts encontrados
arquivos_encontrados = glob.glob(padrao_arquivos)

if len(arquivos_encontrados) == 0:
    print(f"Nenhum arquivo encontrado com o padrao '{padrao_arquivos}'.")
else:
    resultados = []
    for caminho in arquivos_encontrados:
        resultado_host = processar_host(caminho)
        if resultado_host is not None:
            resultados.append(resultado_host)

    resumo = pd.DataFrame(resultados)
    resumo.to_csv(arquivo_saida, sep=';', index=False)

    print(f"Analise concluida para {len(resultados)} equipamento(s).")
    print("-------------------------")
    for r in resultados:
        print(f"Host: {r['hostname']} ({r['arquivo']})")
        print(f"  Status geral: {r['status_geral']}")
        print(f"  Ultimo dado: {r['ultimo_horario']} ({r['minutos_desde_ultimo_dado']} min atras)")
        print(f"  CPU atual: {r['cpu_atual']}% | media ultima hora: {r['cpu_media_ultima_hora']}%")
        print(f"  RAM atual: {r['ram_atual']}% | media ultima hora: {r['ram_media_ultima_hora']}%")
        print(f"  Disco atual (maior): {r['disco_atual_maior']}% | media 30min: {r['disco_media_ultimos_30min']}%")
        print("-------------------------")
    print(f"Resumo salvo em: {arquivo_saida}")
