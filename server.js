const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: 'benserverplex.ddns.net',
    user: 'alunos',
    password: 'senhaAlunos',
    database: 'ecoseed', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/', async (req, res) => {
    try {
        const sql = `SELECT id, nome, email, score FROM users`;
        const [rows] = await pool.execute(sql);
        
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar dados: " + error.message });
    }
});

app.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ message: "Preencha todos os campos." });
    }

    try {
        const sql = `INSERT INTO users (nome, email, senha, score) VALUES (?, ?, ?, 0)`;
        const [result] = await pool.execute(sql, [nome, email, senha]);
        res.status(201).json({ message: "Cadastro realizado com sucesso!", id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Este e-mail já está cadastrado." });
        }
        res.status(500).json({ message: "Erro no servidor." });
    }
});

app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const sql = `SELECT * FROM users WHERE email = ? AND senha = ?`;
        const [rows] = await pool.execute(sql, [email, senha]);

        if (rows.length > 0) {
            const user = rows[0];
            res.status(200).json({
                id: user.id,
                nome: user.nome,
                email: user.email,
                score: user.score
            });
        } else {
            res.status(401).json({ message: "E-mail ou senha incorretos." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro interno." });
    }
});

app.put('/score', async (req, res) => {
    const { userId, score } = req.body;

    try {
        const sql = `UPDATE users SET score = ? WHERE id = ?`;
        const [result] = await pool.execute(sql, [score, userId]);

        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Pontuação salva com sucesso!" });
        } else {
            res.status(404).json({ message: "Usuário não encontrado." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao salvar pontuação." });
    }
});

app.get('/ranking', async (req, res) => {
    try {
        const sql = `SELECT nome, score FROM users ORDER BY score DESC LIMIT 10`;
        const [rows] = await pool.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar ranking." });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

module.exports = app;