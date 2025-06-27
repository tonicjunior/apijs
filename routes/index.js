const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto'); // Módulo de criptografia
const router = express.Router();

// --- CONFIGURAÇÃO DE CRIPTOGRAFIA ---
const SECRET_KEY = 'e8b2a7e4b1c9d8f3a7b6c5d4e3f2a1b0e8b2a7e4b1c9d8f3a7b6c5d4e3f2a1b0'; // Use esta chave para ambas as operações
const ALGORITHM = 'aes-256-gcm';

// --- CAMINHOS PARA OS ARQUIVOS ---
const gameBoardPath = path.join(__dirname, '../public/gameBoard.txt');
const chatIaPath = path.join(__dirname, '../public/chat-ia.txt');
const imgIaPath = path.join(__dirname, '../public/img-ia.txt');

// --- FUNÇÕES AUXILIARES DE CRIPTOGRAFIA ---

/**
 * Criptografa um texto usando a SECRET_KEY.
 * @param {string} text - O texto a ser criptografado.
 * @returns {string} O texto criptografado no formato "iv:authTag:content".
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Descriptografa um texto que foi criptografado com a função encrypt.
 * @param {string} encryptedText - O texto criptografado.
 * @returns {string|null} O texto original ou null se a descriptografia falhar.
 */
function decrypt(encryptedText) {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Formato inválido');
    
    const [iv, authTag, content] = parts.map(part => Buffer.from(part, 'hex'));
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error("Erro na descriptografia:", error);
    return null;
  }
}

// --- ROTAS EXISTENTES (gameBoard) ---

function removeOldEntries(data) {
  // ... (seu código original sem alterações)
  const currentTime = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return data.trim().split('\n').filter(line => {
      const parts = line.split(',');
      if (parts.length !== 3) return false;
      const [nickname, id, timestamp] = parts;
      return currentTime - Number(timestamp) <= fiveMinutes;
    }).join('\n');
}

router.get('/cadastro', (req, res) => {
  // ... (seu código original sem alterações)
  const { nickname, id } = req.query;
  if (!nickname || !id) { return res.status(400).json({ message: 'Nickname e ID são obrigatórios' }); }
  const currentTime = Date.now();
  fs.readFile(gameBoardPath, 'utf8', (err, data) => {
    if (err && err.code !== 'ENOENT') { return res.status(500).json({ message: 'Erro ao ler o arquivo' }); }
    const fileData = data || '';
    const updatedData = removeOldEntries(fileData);
    const newEntry = `${nickname},${id},${currentTime}\n`;
    const newData = updatedData ? updatedData + '\n' + newEntry : newEntry;
    fs.writeFile(gameBoardPath, newData.trim(), err => {
      if (err) { return res.status(500).json({ message: 'Erro ao salvar o cadastro' }); }
      res.status(201).json({ message: 'Cadastro realizado com sucesso' });
    });
  });
});

router.get('/delete', (req, res) => {
  // ... (seu código original sem alterações)
  const { id } = req.query;
  if (!id) { return res.status(400).json({ message: 'ID é obrigatório' }); }
  fs.readFile(gameBoardPath, 'utf8', (err, data) => {
    if (err) { return res.status(500).json({ message: 'Erro ao ler o arquivo' }); }
    const lines = data.split('\n');
    const updatedLines = lines.filter(line => !line.includes(`,${id}`));
    if (lines.length === updatedLines.length) { return res.status(404).json({ message: 'ID não encontrado' }); }
    fs.writeFile(gameBoardPath, updatedLines.join('\n'), err => {
      if (err) { return res.status(500).json({ message: 'Erro ao deletar o cadastro' }); }
      res.status(200).json({ message: 'Cadastro deletado com sucesso' });
    });
  });
});

router.get('/buscar', (req, res) => {
  // ... (seu código original sem alterações)
  fs.readFile(gameBoardPath, 'utf8', (err, data) => {
    if (err) { return res.status(500).json({ message: 'Erro ao ler o arquivo' }); }
    const users = data.trim().split('\n').filter(line => line).map(line => {
        const [nickname, id, timestamp] = line.split(',');
        return { nickname, id, timestamp };
      });
    res.status(200).json(users);
  });
});

router.get('/deleteAll', (req, res) => {
  // ... (seu código original sem alterações)
  fs.writeFile(gameBoardPath, '', err => {
    if (err) { return res.status(500).json({ message: 'Erro ao deletar todos os registros' }); }
    res.status(200).json({ message: 'Todos os registros foram excluídos com sucesso' });
  });
});


// --- NOVAS ROTAS PARA GERENCIAR CHAVES CRIPTOGRAFADAS ---

// Rota para DEFINIR (criptografar e salvar) a chave do Chat
router.get('/set-chat-key', (req, res) => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ message: 'A chave é obrigatória. Use o parâmetro ?key=SUA_CHAVE' });
  }
  
  const encryptedKey = encrypt(key);
  
  fs.writeFile(chatIaPath, encryptedKey, 'utf8', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao salvar o arquivo da chave do chat.' });
    }
    res.status(200).json({ message: 'Chave do chat salva e criptografada com sucesso!' });
  });
});

// Rota para OBTER (ler e descriptografar) a chave do Chat
router.get('/get-chat-key', (req, res) => {
  fs.readFile(chatIaPath, 'utf8', (err, encryptedKey) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ message: 'Arquivo da chave do chat não encontrado.' });
      }
      return res.status(500).json({ message: 'Erro ao ler o arquivo da chave do chat.' });
    }

    const decryptedKey = decrypt(encryptedKey.trim());
    
    if (!decryptedKey) {
        return res.status(500).json({ message: 'Falha ao descriptografar a chave. Verifique a SECRET_KEY ou a integridade do arquivo.' });
    }
    
    res.status(200).json({ key: decryptedKey });
  });
});


// Rota para DEFINIR (criptografar e salvar) a chave de Imagem
router.get('/set-img-key', (req, res) => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ message: 'A chave é obrigatória. Use o parâmetro ?key=SUA_CHAVE' });
  }

  const encryptedKey = encrypt(key);
  
  fs.writeFile(imgIaPath, encryptedKey, 'utf8', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao salvar o arquivo da chave de imagem.' });
    }
    res.status(200).json({ message: 'Chave de imagem salva e criptografada com sucesso!' });
  });
});

// Rota para OBTER (ler e descriptografar) a chave de Imagem
router.get('/get-img-key', (req, res) => {
  fs.readFile(imgIaPath, 'utf8', (err, encryptedKey) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ message: 'Arquivo da chave de imagem não encontrado.' });
      }
      return res.status(500).json({ message: 'Erro ao ler o arquivo da chave de imagem.' });
    }

    const decryptedKey = decrypt(encryptedKey.trim());

    if (!decryptedKey) {
        return res.status(500).json({ message: 'Falha ao descriptografar a chave. Verifique a SECRET_KEY ou a integridade do arquivo.' });
    }

    res.status(200).json({ key: decryptedKey });
  });
});


module.exports = router;
