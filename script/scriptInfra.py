import csv
import psutil
import time
#import socket
from datetime import datetime

arquivo = './csv_marina.csv'
intervalo = 10

#hostname = socket.gethostname()
hostname = "Marina"
# descobre quantos núcleos a máquina tem
qtd_nucleos = psutil.cpu_count()
colunas_nucleos = [f'cpu_core_{i}' for i in range(qtd_nucleos)]
cabecalho = ['horario', 'hostname', 'cpu_total'] + colunas_nucleos + ['ram', 'disco']

with open(arquivo, 'w', newline='') as csvfile:
    escritor = csv.writer(csvfile, delimiter=';')
    escritor.writerow(cabecalho)

while True:
    uso_por_nucleo = psutil.cpu_percent(interval=1, percpu=True)
    uso_cpu_total = sum(uso_por_nucleo) / len(uso_por_nucleo)

    uso_ram = psutil.virtual_memory().percent
    uso_disco = psutil.disk_usage('/').percent
    total_gb = uso_disco / (1024 **3)
    horario = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    linha = [horario, hostname, round(uso_cpu_total, 1)] + uso_por_nucleo + [uso_ram, uso_disco]

    with open(arquivo, 'a', newline='') as csvfile:
        escritor = csv.writer(csvfile, delimiter=';')
        escritor.writerow(linha)

    print(f"""Captura realizada: {horario}
        CPU total: {uso_cpu_total}%
        RAM: {uso_ram}%
        Disco:{uso_disco}%
        -------------------------""")

    time.sleep(intervalo - 1)