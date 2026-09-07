import csv
import os
import socket
import time
import psutil
from datetime import datetime

intervalo = 10 
hostname = socket.gethostname()
arquivo = f'./csv_{hostname}.csv'

# descobre quantos núcleos a máquina tem
qtd_nucleos = psutil.cpu_count()
colunas_nucleos = [f'cpu_core_{i}' for i in range(qtd_nucleos)]

# descobre todas as partições de disco existentes na máquina
particoes = []
for p in psutil.disk_partitions(all=False):
    particoes.append(p.mountpoint)

colunas_discos = [f'disco_{i}' for i in range(len(particoes))]

cabecalho = (
    ['horario', 'hostname', 'cpu_total'] + colunas_nucleos
    + ['ram', 'swap']
    + colunas_discos
    + ['rede_enviado_mb', 'rede_recebido_mb']
)

# se existir sensor de temperatura na máquina
tem_sensor_temp = hasattr(psutil, 'sensors_temperatures')
if tem_sensor_temp:
    cabecalho.append('temperatura_c')

# se existir sensor de bateria
tem_sensor_bateria = hasattr(psutil, 'sensors_battery')
if tem_sensor_bateria:
    cabecalho.append('bateria_percent')

# cria o arquivo com cabeçalho só se ele ainda não existir
if not os.path.exists(arquivo):
    with open(arquivo, 'w', newline='', encoding='utf-8') as csvfile:
        escritor = csv.writer(csvfile, delimiter=';')
        escritor.writerow(cabecalho)


def ler_temperatura():
    """Retorna a temperatura média em graus Celsius, ou vazio se não suportado."""
    if not tem_sensor_temp:
        return ''
    try:
        temperaturas = psutil.sensors_temperatures()
        if not temperaturas:
            return ''
        soma = 0
        contagem = 0
        for nome_sensor in temperaturas:
            lista_sensores = temperaturas[nome_sensor]
            for sensor in lista_sensores:
                soma = soma + sensor.current
                contagem = contagem + 1
        if contagem == 0:
            return ''
        return round(soma / contagem, 1)
    except Exception:
        return ''


def ler_bateria():
    """Retorna o percentual de bateria, ou vazio se a máquina não tiver bateria."""
    if not tem_sensor_bateria:
        return ''
    try:
        bateria = psutil.sensors_battery()
        if bateria is None:
            return ''
        return bateria.percent
    except Exception:
        return ''


def ler_discos():
    """Lê o percentual de uso de cada partição encontrada na máquina."""
    valores = []
    for mountpoint in particoes:
        try:
            uso = psutil.disk_usage(mountpoint).percent
        except Exception:
            uso = ''
        valores.append(uso)
    return valores


print(f"Coletor iniciado para o host '{hostname}'. Salvando em {arquivo}")
print(f"Discos monitorados: {particoes}")
print(f"Sensor de temperatura disponível: {tem_sensor_temp}")
print(f"Sensor de bateria disponível: {tem_sensor_bateria}")
print("-------------------------")

rede_anterior = psutil.net_io_counters()

try:
    while True:
        inicio_ciclo = time.time()

        uso_por_nucleo = psutil.cpu_percent(interval=1, percpu=True)
        uso_cpu_total = sum(uso_por_nucleo) / len(uso_por_nucleo)

        uso_ram = psutil.virtual_memory().percent
        uso_swap = psutil.swap_memory().percent
        uso_discos = ler_discos()

        rede_atual = psutil.net_io_counters()
        enviado_mb = (rede_atual.bytes_sent - rede_anterior.bytes_sent) / (1024 * 1024)
        recebido_mb = (rede_atual.bytes_recv - rede_anterior.bytes_recv) / (1024 * 1024)
        rede_anterior = rede_atual

        horario = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        linha = (
            [horario, hostname, round(uso_cpu_total, 1)] + uso_por_nucleo
            + [uso_ram, uso_swap]
            + uso_discos
            + [round(enviado_mb, 3), round(recebido_mb, 3)]
        )

        if tem_sensor_temp:
            linha.append(ler_temperatura())
        if tem_sensor_bateria:
            linha.append(ler_bateria())

        with open(arquivo, 'a', newline='', encoding='utf-8') as csvfile:
            escritor = csv.writer(csvfile, delimiter=';')
            escritor.writerow(linha)

        print(f"""Captura realizada: {horario}
        CPU total: {uso_cpu_total}%
        RAM: {uso_ram}%
        Swap: {uso_swap}%
        Discos: {uso_discos}
        Rede: enviado {round(enviado_mb, 3)} MB / recebido {round(recebido_mb, 3)} MB
        -------------------------""")

        tempo_gasto = time.time() - inicio_ciclo
        time.sleep(max(0, intervalo - tempo_gasto))

except KeyboardInterrupt:
    print("Coleta interrompida pelo usuário. Dados salvos em", arquivo)