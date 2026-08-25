const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./config/database");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const palavraJWT = "Chave_do_jwt";

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token não enviado" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, palavraJWT);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// Cria o usuário no banco e devolve token e os dados
app.post("/register", (req, res) => {
  const { nome, email, data_nasc, senha } = req.body;

  bcrypt.hash(senha, 10, (err, hash) => {
    if (err)
      return res.status(500).json({ error: "Erro ao criptografar senha" });

    db.query(
      "INSERT INTO users (nome, email, data_nasc, senha) VALUES (?, ?, ?, ?)",
      [nome, email, data_nasc, hash],
      (err, result) => {
        if (err) {
          console.error("Erro ao cadastrar usuário:", err);
          return res
            .status(500)
            .json({ error: "Erro ao cadastrar usuário", detail: err.message });
        }
        const userId = result.insertId;
        const token = jwt.sign({ userId, nome }, palavraJWT, {
          expiresIn: "7d",
        });

        res.status(201).json({
          message: "Usuário cadastrado com sucesso!",
          token,
          userId,
          nome,
        });
      },
    );
  });
});

app.post("/registerAreas", (req, res) => {
  const { nomeAreaMentorado, nomeAreaMentorar, users_id } = req.body;

  db.query(
    "INSERT INTO funcoesUser (nomeAreaMentorar, nomeAreaMentorado, users_id) VALUES (?, ?, ?)",
    [nomeAreaMentorar, nomeAreaMentorado, users_id],
    (err, results) => {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: "Erro ao salvar áreas", data: err });

      res
        .status(201)
        .json({ success: true, message: "Áreas salvas com sucesso!" });
    },
  );
});

app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro no login" });
    if (results.length === 0)
      return res.status(401).json({ error: "Usuário não encontrado" });

    const user = results[0];

    bcrypt.compare(senha, user.senha, (err, match) => {
      if (err)
        return res.status(500).json({ error: "Erro ao verificar senha" });
      if (!match) return res.status(401).json({ error: "Senha incorreta" });

      const token = jwt.sign({ userId: user.id, nome: user.nome }, palavraJWT, {
        expiresIn: "7d",
      });

      res.json({
        message: "Login realizado com sucesso!",
        token,
        userId: user.id,
        nome: user.nome,
        email: user.email,
      });
    });
  });
});

app.put("/editarUser", autenticar, (req, res) => {
  const { inputNome, inputSenha } = req.body;
  const userId = req.user.userId;

  bcrypt.hash(inputSenha, 10, (err, hash) => {
    if (err)
      return res.status(500).json({ error: "Erro ao criptografar senha" });

    db.query(
      "UPDATE users SET nome = ?, senha = ? WHERE id = ?",
      [inputNome, hash, userId],
      (err) => {
        if (err)
          return res.status(500).json({ error: "Erro ao editar usuário" });

        res.json({ message: "Usuário editado com sucesso!", nome: inputNome });
      },
    );
  });
});

app.get("/totalUsers", (req, res) => {
  const query = "SELECT COUNT(id) AS total_users FROM users;";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao obter total de usuários:", err);
      return res.status(500).json({ error: "Erro ao obter total de usuários" });
    }

    res.json({ total_users: results[0].total_users });
  });
});

app.get("/ranking", (req, res) => {
  const query = `SELECT nome, pontos FROM users ORDER BY pontos DESC;`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao obter ranking:", err);
      return res.status(500).json({ error: "Erro ao obter ranking" });
    }

    res.json(results);
  });
});

app.get("/getPontosUser/:id", (req, res) => {
  const usersId = req.params.id;
  const query = `SELECT pontos FROM users WHERE id = ?;`;

  db.query(query, [usersId], (err, results) => {
    if (err) {
      console.error("Erro ao obter pontos do usuário:", err);
      return res.status(500).json({ error: "Erro ao obter pontos do usuário" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(results[0]);
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../frontend/src/uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const permitidos = ["image/jpeg", "image/png", "image/webp"];
    if (permitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  },
});

app.post("/uploadFoto/:id", upload.single("fotoPerfil"), (req, res) => {
  const userId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ error: "Nenhuma imagem enviada" });
  }

  const caminho = `uploads/${req.file.filename}`;
  const query = `UPDATE users SET fotoPerfil = ? WHERE id = ?`;

  db.query(query, [caminho, userId], (err) => {
    if (err) {
      console.error("Erro ao salvar foto:", err);
      return res.status(500).json({ error: "Erro ao salvar foto" });
    }

    res.json({ fotoPerfil: caminho });
  });
});

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../../frontend/src/uploads")),
);

app.get("/getUser/:id", (req, res) => {
  const query = `SELECT nome, email, pontos, fotoPerfil FROM users WHERE id = ?`;

  db.query(query, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar usuário" });
    if (results.length === 0)
      return res.status(404).json({ error: "Usuário não encontrado" });

    res.json(results[0]);
  });
});

const fs = require("fs");

app.delete("/deletarFoto/:id", (req, res) => {
  const userId = req.params.id;

  db.query(
    "SELECT fotoPerfil FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Erro ao buscar foto" });
      if (results.length === 0)
        return res.status(404).json({ error: "Usuário não encontrado" });

      const fotoCaminho = results[0].fotoPerfil;

      if (fotoCaminho) {
        const caminhoCompleto = path.join(
          __dirname,
          "../../frontend/src",
          fotoCaminho,
        );
        fs.unlink(caminhoCompleto, (err) => {
          if (err)
            console.warn("Arquivo não encontrado ou já deletado:", err.message);
        });
      }

      db.query(
        "UPDATE users SET fotoPerfil = NULL WHERE id = ?",
        [userId],
        (err) => {
          if (err)
            return res.status(500).json({ error: "Erro ao deletar foto" });
          res.json({ message: "Foto deletada com sucesso" });
        },
      );
    },
  );
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
