import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const authorization = req.get('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Entre na sua conta para continuar.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: Number(payload.sub) };
    return next();
  } catch {
    return res.status(401).json({ error: 'Sua sessão expirou. Entre novamente.' });
  }
}
