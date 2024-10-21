## Desafio: Backend de Loja Física

### Introdução
Este é o primeiro desafio avaliativo do programa Bolsas CompassUol. O projeto consiste no desenvolvimento da estrutura de um backend para uma Physical Store, utilizando as tecnologias e conhecimentos adquiridos no curso. O projeto servirá como base para construção de um e-commerce de relógios.

### Arquitetura do Sistema
* **Tecnologias:**
  * Linguagens: JavaScript
  * Banco de dados: MongoDB 
  * Framework: NodeJS

### Funcionalidades
* **Cadastro de lojas:** Permite adicionar novas lojas ao sistema.
* **Busca de lojas:** Encontra lojas próximas a um determinado CEP, utilizando a API ViaCEP.
* **Geração de logs:** Registra todas as ações e erros em formato JSON, utilizando o Winston.

### Implementação
* **Cálculo da distância:** Utilizamos a fórmula de Haversine para calcular a distância entre dois pontos na superfície da Terra.
* **Busca por lojas:** A busca é realizada em um raio de 100km do CEP informado, retornando as lojas mais próximas.
* **Geração de logs:** Os logs são armazenados em arquivos JSON, facilitando a análise e depuração.

## Instalação e Execução

1. **Clonar o Repositório**

    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git

2. **Instalar Dependências**
Execute o seguinte comando para instalar as dependências:
    ```bash
    npm install

3. **Configurar Variáveis de Ambiente**
Crie um arquivo .env na raiz do projeto com as seguintes variáveis:
    ```bach
    OPENCAGE_API_KEY=SuaChaveDaAPI
    OPENCAGE_BASE_URL=https://api.opencagedata.com/geocode/v1/json

4. **Executar a Aplicação**
Execute o projeto via terminal:
    ```bash	
    node src/index.js  

5. **Logs**
Os logs gerados pela aplicação serão armazenados no arquivo logs/logs.json, contendo informações sobre as ações da aplicação.

### Considerações Finais
Este projeto faz parte do desafio Bolsas CompassUol e foi desenvolvido seguindo as melhores práticas de desenvolvimento de software, visando um código limpo, organizado e de fácil manutenção.

