# Visão do Produto — Diário de Viagens

## 1. Declaração de Visão

O **Diário de Viagens** é uma plataforma pensada para viajantes que desejam documentar, organizar e reviver suas jornadas de forma simples, elegante e duradoura. Diferente de redes sociais convencionais — onde o conteúdo se perde em feeds efêmeros e algoritmos de engajamento —, o Diário de Viagens oferece um espaço pessoal e contextualizado, onde textos, fotos, locais e itinerários são conectados cronologicamente e geograficamente.

---

## 2. O Problema

Viajar gera uma imensa quantidade de memórias fragmentadas:
1. **Dispersão de Informação**: Fotos ficam perdidas na galeria do celular; notas e dicas ficam em blocos de anotações; recibos e bilhetes em emails.
2. **Falta de Contexto Geográfico e Temporal**: Meses após a viagem, é difícil lembrar a ordem exata das cidades visitadas, a data em que um restaurante específico foi visitado ou onde aquela foto especial foi tirada.
3. **Dependência de Conexão Contínua**: Muitos aplicativos de viagem exigem conexão constante à internet. No entanto, viagens frequentemente envolvem aviões, montanhas, trilhas ou áreas remotas sem sinal.
4. **Perda de Privacidade e Soberania dos Dados**: Plataformas corporativas usam dados de localização e fotos para fins de publicidade dirigida, e muitas vezes compactam as fotos de forma agressiva.

---

## 3. A Solução

O **Diário de Viagens** resolve essas dores combinando:
* **Estrutura Natural de Viagem**: Viagens divididas em destinos, dias e entradas cronológicas.
* **Mídia Contextualizada**: Fotos anexadas diretamente às entradas e locais, preservando fidelidade e metadados.
* **Mapeamento e Linha do Tempo**: Visualização interativa que exibe a trajetória percorrida no mapa e a narrativa no tempo.
* **Operação Offline-First**: O viajante pode registrar relatos e fotos no meio da floresta ou no avião; o aplicativo sincroniza automaticamente quando houver conexão.
* **Soberania e Custo Mínimo**: Arquitetura leve e auto-hospedável (self-hosted), rodando em VPS de baixo custo com armazenamento S3/MinIO.

---

## 4. Personas Principais

### Persona 1: O Mochileiro / Viajante Solo (Lucas, 26 anos)
* **Comportamento**: Faz viagens longas, passa por vários países em uma mesma jornada e frequentemente fica sem sinal de internet móvel.
* **Necessidades**: Funcionar offline, registrar notas rápidas com fotos e geolocalização no mapa para não esquecer os locais visitados.
* **Frustrações**: Aplicativos pesados que travam sem internet ou cobram assinaturas abusivas.

### Persona 2: A Família em Férias (Camila e Roberto, 38 anos)
* **Comportamento**: Fazem viagens de férias planejadas, tiram muitas fotos dos passeios e filhos.
* **Necessidades**: Criar uma narrativa organizada das férias com capa bonita, dias estruturados e galeria limpa para relembrar com amigos e parentes.
* **Frustrações**: Feeds sociais públicos e poluição visual.

---

## 5. Proposta de Valor e Diferenciais

| Recurso | Redes Sociais Típicas | Diário de Viagens |
| :--- | :--- | :--- |
| **Organização** | Feed solto e algorítmico | Linha do tempo estruturada por viagem, dia e destino |
| **Visualização** | Grade genérica de fotos | Linha do tempo interativa e mapa da rota |
| **Offline** | Não funciona sem rede | Offline-First nativo no mobile com fila de sincronização |
| **Privacidade** | Dados monetizados | Total privacidade com opção de compartilhamento restrito |
| **Armazenamento** | Compressão agressiva | Armazenamento dedicado com URLs pré-assinadas S3 |
