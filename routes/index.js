const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const router = express.Router();

// --- CONFIGURAÇÃO DE CRIPTOGRAFIA (MODIFICADO) ---
// Carrega a chave secreta do arquivo .env
const SECRET_KEY = process.env.SECRET_KEY;
const ALGORITHM = 'aes-256-gcm';

// Verificação de segurança: Garante que a chave secreta foi carregada.
if (!SECRET_KEY || SECRET_KEY.length !== 64) {
  console.error('ERRO CRÍTICO: A variável de ambiente SECRET_KEY não foi definida ou é inválida.');
  process.exit(1); // Encerra o processo se a chave não estiver configurada corretamente.
}

// --- CAMINHOS PARA OS ARQUIVOS ---
const gameBoardPath = path.join(__dirname, '../public/gameBoard.txt');
const chatIaPath = path.join(__dirname, '../public/chat-ia.txt');
const imgIaPath = path.join(__dirname, '../public/img-ia.txt');

// --- FUNÇÕES AUXILIARES DE CRIPTOGRAFIA (MODIFICADO) ---
// Agora as funções recebem a chave como parâmetro para serem mais puras.

function encrypt(text, secretKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(encryptedText, secretKey) {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Formato inválido');
    
    const [iv, authTag, content] = parts.map(part => Buffer.from(part, 'hex'));
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(secretKey, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error("Erro na descriptografia:", error);
    return null;
  }
}

// --- ROTAS EXISTENTES (sem alterações na lógica) ---
function removeOldEntries(data) {
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

// ... Suas outras rotas de /delete, /buscar, /deleteAll continuam aqui ...


// --- NOVAS ROTAS PARA GERENCIAR CHAVES CRIPTOGRAFADAS (MODIFICADO) ---

router.get('/set-chat-key', (req, res) => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ message: 'A chave é obrigatória. Use o parâmetro ?key=SUA_CHAVE' });
  }
  
  // Passamos a SECRET_KEY para a função
  const encryptedKey = encrypt(key, SECRET_KEY);
  
  fs.writeFile(chatIaPath, encryptedKey, 'utf8', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao salvar o arquivo da chave do chat.' });
    }
    res.status(200).json({ message: 'Chave do chat salva e criptografada com sucesso!' });
  });
});

router.get('/get-chat-key', (req, res) => {
  fs.readFile(chatIaPath, 'utf8', (err, encryptedKey) => {
    if (err) {
      // ... (sem alteração aqui)
      return res.status(500).json({ message: 'Erro ao ler o arquivo da chave do chat.' });
    }

    // Passamos a SECRET_KEY para a função
    const decryptedKey = decrypt(encryptedKey.trim(), SECRET_KEY);
    
    if (!decryptedKey) {
        return res.status(500).json({ message: 'Falha ao descriptografar a chave. Verifique a SECRET_KEY ou a integridade do arquivo.' });
    }
    
    res.status(200).json({ key: decryptedKey });
  });
});

router.get('/set-img-key', (req, res) => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ message: 'A chave é obrigatória. Use o parâmetro ?key=SUA_CHAVE' });
  }

  // Passamos a SECRET_KEY para a função
  const encryptedKey = encrypt(key, SECRET_KEY);
  
  fs.writeFile(imgIaPath, encryptedKey, 'utf8', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao salvar o arquivo da chave de imagem.' });
    }
    res.status(200).json({ message: 'Chave de imagem salva e criptografada com sucesso!' });
  });
});

router.get('/get-img-key', (req, res) => {
  fs.readFile(imgIaPath, 'utf8', (err, encryptedKey) => {
    if (err) {
      // ... (sem alteração aqui)
      return res.status(500).json({ message: 'Erro ao ler o arquivo da chave de imagem.' });
    }

    // Passamos a SECRET_KEY para a função
    const decryptedKey = decrypt(encryptedKey.trim(), SECRET_KEY);

    if (!decryptedKey) {
        return res.status(500).json({ message: 'Falha ao descriptografar a chave. Verifique a SECRET_KEY ou a integridade do arquivo.' });
    }

    res.status(200).json({ key: decryptedKey });
  });
});

module.exports = router;
