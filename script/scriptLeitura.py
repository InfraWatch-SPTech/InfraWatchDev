import pandas as pd

arquivo_entrada = './csv_marina.csv'
arquivo_saida = './infrawatch_resumo.csv'
linhas_por_hora = 360
linhas_30min = 180

df = pd.read_csv(arquivo_entrada, sep=';')

for coluna in ['cpu_total', 'ram', 'disco']:
    df[coluna] = pd.to_numeric(df[coluna])

total_amostras = len(df)

# Media e pico de CPU 
media_cpu = df['cpu_total'].mean()
pico_cpu = df['cpu_total'].max()

# Media de RAM na "ultima hora"
media_ram_hora = df['ram'].tail(linhas_por_hora).mean()

# Media de disco nos "ultimos 30 minutos"
media_disco_30min = df['disco'].tail(linhas_30min).mean()

resumo = pd.DataFrame({
    'metrica': [
        'total_amostras',
        'cpu_media_geral',
        'cpu_pico',
        'ram_media_ultima_hora',
        'disco_media_ultimos_30min',
    ],
    'valor': [
        total_amostras,
        round(media_cpu, 1),
        round(pico_cpu, 1),
        round(media_ram_hora, 1),
        round(media_disco_30min, 1),
    ]
})

resumo.to_csv(arquivo_saida, sep=';', index=False)

print(f"Analise concluida com {total_amostras} amostras.")
print(f"CPU media: {media_cpu:.1f}% | pico: {pico_cpu:.1f}%")
print(f"RAM media (ultima hora): {media_ram_hora:.1f}%")
if pd.notna(media_disco_30min):
    print(f"Disco medio (ultimos 30min): {media_disco_30min:.1f} %")
else:
    print("Disco medio (ultimos 30min): sem dados validos nesse arquivo.")
print(f"Resumo salvo em: {arquivo_saida}")