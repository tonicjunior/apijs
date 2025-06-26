// routes/index.js

const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const filePath = path.join(__dirname, '../public/gameBoard.txt');
const rpgStoriesPath = path.join(__dirname, '../data/rpg_stories.json');
const terrorStoriesPath = path.join(__dirname, '../data/terror_stories.json');

// --- Helper Functions ---
/**
 * Reads a JSON file asynchronously and returns its content.
 * @param {string} filePath - The path to the JSON file.
 * @returns {Promise<object>} A promise that resolves with the JSON data.
 */
function readJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }
      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

/**
 * Removes old entries from the game board data.
 * @param {string} data - The raw data from the game board file.
 * @returns {string} The data with old entries removed.
 */
function removeOldEntries(data) {
  const currentTime = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  // Filters lines to keep only those within the 5-minute window
  return data
    .trim()
    .split('\n')
    .filter(line => {
      const parts = line.split(',');
      if (parts.length !== 3) return false; // Skips malformed lines
      const [nickname, id, timestamp] = parts;
      return currentTime - Number(timestamp) <= fiveMinutes;
    })
    .join('\n');
}

// --- Existing Routes ---

// Route to register a new user
router.get('/cadastro', (req, res) => {
  const { nickname, id } = req.query;

  if (!nickname || !id) {
    return res.status(400).json({ message: 'Nickname e ID são obrigatórios' });
  }

  const currentTime = Date.now();

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err && err.code !== 'ENOENT') { // ENOENT means file does not exist, which is fine
      return res.status(500).json({ message: 'Erro ao ler o arquivo' });
    }

    const fileData = data || '';
    const updatedData = removeOldEntries(fileData);

    const newEntry = `${nickname},${id},${currentTime}\n`;
    const newData = updatedData ? updatedData + '\n' + newEntry : newEntry;

    fs.writeFile(filePath, newData.trim(), err => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao salvar o cadastro' });
      }
      res.status(201).json({ message: 'Cadastro realizado com sucesso' });
    });
  });
});

// Route to delete a user by ID
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

// Route to fetch all data
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

// Route to delete all records
router.get('/deleteAll', (req, res) => {
  fs.writeFile(filePath, '', err => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao deletar todos os registros' });
    }
    res.status(200).json({ message: 'Todos os registros foram excluídos com sucesso' });
  });
});

// --- New API Routes ---

/**
 * Rota: /api/themes
 * Returns the available themes (RPG and Horror in this case).
 */
router.get('/api/themes', (req, res) => {
  const themes = [
    {
      id: 'rpg',
      name: 'ÉPICA AVENTURA',
      description: 'Entre em um mundo de magia e perigo...',
      image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3',
      button_text: 'ESCOLHER DESTINO'
    },
    {
      id: 'terror',
      name: 'HORROR PROFUNDO',
      description: 'Enfrente seus piores medos...',
      image: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c',
      button_text: 'ABRAÇAR O MEDO'
    }
  ];

  res.status(200).json({
    success: true,
    data: themes
  });
});

/**
 * Rota: /api/stories?theme={theme_id}
 * Returns the available stories for a specific theme.
 */
router.get('/api/stories', async (req, res) => {
  const { theme } = req.query;

  if (!theme) {
    return res.status(400).json({ success: false, message: 'O parâmetro "theme" é obrigatório.' });
  }

  const storiesPath = theme === 'rpg' ? rpgStoriesPath : (theme === 'terror' ? terrorStoriesPath : null);

  if (!storiesPath) {
    return res.status(404).json({ success: false, message: 'Tema não encontrado.' });
  }

  try {
    const storiesData = await readJsonFile(storiesPath);
    // Filter out only the stories from the JSON data
    const stories = Object.values(storiesData).filter(item => item.id.includes('-story'));
    res.status(200).json({
      success: true,
      data: stories
    });
  } catch (error) {
    console.error('Erro ao ler o arquivo de histórias:', error);
    res.status(500).json({ success: false, message: 'Erro ao carregar as histórias.' });
  }
});

/**
 * Rota: /api/scenes?theme={theme_id}&scene_id={scene_id}
 * Returns the data for a specific scene.
 */
router.get('/api/scenes', async (req, res) => {
  const { theme, scene_id } = req.query;

  if (!theme || !scene_id) {
    return res.status(400).json({ success: false, message: 'Os parâmetros "theme" e "scene_id" são obrigatórios.' });
  }

  const storiesPath = theme === 'rpg' ? rpgStoriesPath : (theme === 'terror' ? terrorStoriesPath : null);

  if (!storiesPath) {
    return res.status(404).json({ success: false, message: 'Tema não encontrado.' });
  }

  try {
    const storiesData = await readJsonFile(storiesPath);
    const sceneKey = `${theme}-scene-${scene_id}`;
    const scene = storiesData[sceneKey];

    if (!scene) {
      return res.status(404).json({ success: false, message: 'Cena não encontrada.' });
    }

    res.status(200).json({
      success: true,
      data: scene
    });
  } catch (error) {
    console.error('Erro ao ler o arquivo de cenas:', error);
    res.status(500).json({ success: false, message: 'Erro ao carregar a cena.' });
  }
});

module.exports = router;
