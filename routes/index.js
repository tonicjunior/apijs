// routes/index.js

const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const filePath = path.join(__dirname, '../public/gameBoard.txt');

// Rota para cadastrar um novo usuário
router.get('/cadastro', (req, res) => {
  const { nickname, id } = req.query;

  if (!nickname || !id) {
    return res.status(400).json({ message: 'Nickname e ID são obrigatórios' });
  }

  // Adiciona a nova linha ao arquivo
  const newEntry = `${nickname},${id}\n`;
  fs.appendFile(filePath, newEntry, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao salvar o cadastro' });
    }
    res.status(201).json({ message: 'Cadastro realizado com sucesso' });
  });
});

// Rota para deletar um usuário pelo ID
router.get('/delete', (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'ID é obrigatório' });
  }

  // Lê o arquivo e remove a linha com o ID especificado
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao ler o arquivo' });
    }

    const lines = data.split('\n');
    const updatedLines = lines.filter(line => !line.includes(`,${id}`));

    if (lines.length === updatedLines.length) {
      return res.status(404).json({ message: 'ID não encontrado' });
    }

    // Reescreve o arquivo com as linhas restantes
    fs.writeFile(filePath, updatedLines.join('\n'), (err) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao deletar o cadastro' });
      }
      res.status(200).json({ message: 'Cadastro deletado com sucesso' });
    });
  });
});

// Rota para buscar todos os dados
router.get('/buscar', (req, res) => {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao ler o arquivo' });
    }

    // Formata cada linha em um objeto JSON
    const users = data
      .trim()
      .split('\n')
      .filter(line => line) // Ignora linhas vazias
      .map(line => {
        const [nickname, id] = line.split(',');
        return { nickname, id };
      });

    res.status(200).json(users);
  });
});

module.exports = router;
