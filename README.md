
# API de Usuários Online

Esta é uma API desenvolvida para gerenciar usuários online em um jogo multiplayer. A API permite cadastrar, buscar e excluir usuários, proporcionando uma maneira simples e eficiente de interagir com a lista de jogadores.

## Funcionalidades

- **Cadastro de Usuários**: Permite que novos usuários se registrem no sistema com um nickname e um ID de jogo.
- **Busca de Usuários**: Recupera a lista de usuários online, excluindo o próprio usuário que fez a requisição.
- **Exclusão de Usuários**: Remove usuários do sistema com base em seu ID.

## Estrutura da API

A API é construída utilizando o framework Node.js e expõe os seguintes endpoints:

### 1. Cadastro de Usuário

- **URL**: `/cadastro`
- **Método**: `GET`
- **Parâmetros**:
  - `nickname`: O nickname do usuário (obrigatório).
  - `id`: O ID do jogo (obrigatório).
- **Resposta**:
  - Um objeto JSON com uma mensagem de sucesso ou erro.

### 2. Busca de Usuários

- **URL**: `/buscar`
- **Método**: `GET`
- **Resposta**:
  - Um array de objetos JSON representando os usuários online, cada um contendo:
    - `nickname`: O nickname do usuário.
    - `id`: O ID do usuário.

### 3. Exclusão de Usuário

- **URL**: `/delete`
- **Método**: `GET`
- **Parâmetros**:
  - `id`: O ID do usuário a ser excluído (obrigatório).
- **Resposta**:
  - Um objeto JSON com uma mensagem de sucesso ou erro.

## Tecnologias Utilizadas

- Node.js
- Express.js
- MongoDB (ou outro banco de dados conforme a implementação)

## Como Executar o Projeto

1. Clone o repositório:

   ```bash
   git clone https://github.com/tonicjunior/apijs.git
   cd apijs
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Inicie o servidor:

   ```bash
   npm start
   ```

4. Acesse a API em `http://localhost:3000`.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

Este projeto é licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Contato

Para dúvidas ou sugestões, entre em contato pelo e-mail: [seu-email@exemplo.com](mailto:seu-email@exemplo.com)
