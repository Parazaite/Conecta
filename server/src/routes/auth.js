import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import pool from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' }
});

const createToken = (user) => jwt.sign(
  { sub: String(user.id) },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (fullName.length < 2 || fullName.length > 120) {
    return res.status(400).json({ error: 'Informe seu nome (entre 2 e 120 caracteres).' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) {
    return res.status(400).json({ error: 'Informe um e-mail válido.' });
  }
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'A senha deve ter entre 8 e 72 caracteres.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      [fullName, email, passwordHash]
    );
    const user = { id: result.insertId, full_name: fullName, email };
    return res.status(201).json({ token: createToken(user), user });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Já existe uma conta com este e-mail.' });
    }
    throw error;
  }
}));

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const [users] = await pool.execute(
    'SELECT id, full_name, email, password_hash FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  const user = users[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  return res.json({
    token: createToken(user),
    user: { id: user.id, full_name: user.full_name, email: user.email }
  });
}));

router.delete('/account', authenticate, asyncHandler(async (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const [users] = await pool.execute(
    'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
    [req.user.id]
  );
  const user = users[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Senha incorreta; a conta não foi excluída.' });
  }

  await pool.execute('DELETE FROM users WHERE id = ?', [req.user.id]);
  return res.status(204).end();
}));

export default router;
