import 'dotenv/config';
import app from './app.js';
import { checkDatabaseConnection } from './config/database.js';

const port = Number(process.env.PORT || 3001);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET precisa estar definido com pelo menos 32 caracteres em server/.env.');
}

try {
  await checkDatabaseConnection();
  app.listen(port, () => {
    console.log(`Conecta Bairro API disponível em http://localhost:${port}`);
  });
} catch (error) {
  console.error('Não foi possível conectar ao MySQL. Confira server/.env e execute server/schema.sql.', error);
  process.exitCode = 1;
}
