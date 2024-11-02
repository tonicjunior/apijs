// routes/index.js

const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const filePath = path.join(__dirname, '../public/gameBoard.txt');

// Função para verificar e remover itens antigos (mais de 5 minutos)
function removeOldEntries(data) {
  const currentTime = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  // Filtra as linhas que estão dentro do período de 5 minutos
  return data
    .trim()
    .split('\n')
    .filter(line => {
      const [nickname, id, timestamp] = line.split(',');
      return currentTime - Number(timestamp) <= fiveMinutes;
    })
    .join('\n');
}

// Rota para cadastrar um novo usuário
router.get('/cadastro', (req, res) => {
  const { nickname, id } = req.query;

  if (!nickname || !id) {
    return res.status(400).json({ message: 'Nickname e ID são obrigatórios' });
  }

  const currentTime = Date.now();

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao ler o arquivo' });
    }

    // Remove itens antigos com mais de 5 minutos
    const updatedData = removeOldEntries(data);

    // Adiciona o novo registro com timestamp
    const newEntry = `${nickname},${id},${currentTime}\n`;
    const newData = updatedData + '\n' + newEntry;

    fs.writeFile(filePath, newData.trim(), err => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao salvar o cadastro' });
      }
      res.status(201).json({ message: 'Cadastro realizado com sucesso' });
    });
  });
});

// Rota para deletar um usuário pelo ID
router.get('/delete', (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'ID é obrigatório' });
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao ler o arquivo' });
    }

    const lines = data.split('\n');
    const updatedLines = lines.filter(line => !line.includes(`,${id}`));

    if (lines.length === updatedLines.length) {
      return res.status(404).json({ message: 'ID não encontrado' });
    }

    fs.writeFile(filePath, updatedLines.join('\n'), err => {
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

    const users = data
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => {
        const [nickname, id, timestamp] = line.split(',');
        return { nickname, id, timestamp };
      });

    res.status(200).json(users);
  });
});

// Rota para excluir todos os registros
router.get('/deleteAll', (req, res) => {
  fs.writeFile(filePath, '', err => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao deletar todos os registros' });
    }
    res.status(200).json({ message: 'Todos os registros foram excluídos com sucesso' });
  });
});

module.exports = router;
