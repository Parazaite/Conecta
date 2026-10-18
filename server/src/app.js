import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import profileRoutes from './routes/profiles.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5174' }));
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/profiles', profileRoutes);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

app.use((error, _req, res, _next) => {
  console.error('API error:', error);
  if (res.headersSent) return;
  return res.status(500).json({ error: 'Não foi possível concluir a operação. Tente novamente.' });
});

export default app;
