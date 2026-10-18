import { Router } from 'express';
import pool from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateProfile } from '../utils/profileValidation.js';

const router = Router();

async function includeServices(profiles) {
  if (!profiles.length) return profiles;
  const ids = profiles.map((profile) => profile.id);
  const placeholders = ids.map(() => '?').join(',');
  const [services] = await pool.execute(
    `SELECT id, profile_id, title, description, price, price_unit
     FROM services WHERE profile_id IN (${placeholders}) ORDER BY id`,
    ids
  );
  const grouped = new Map();
  for (const service of services) {
    const group = grouped.get(service.profile_id) || [];
    group.push({
      id: service.id,
      title: service.title,
      description: service.description,
      price: Number(service.price),
      price_unit: service.price_unit
    });
    grouped.set(service.profile_id, group);
  }
  return profiles.map((profile) => ({
    ...profile,
    services: grouped.get(profile.id) || []
  }));
}

const profileSelect = `
  SELECT p.id, p.user_id, u.full_name, p.category_id, c.name AS category,
         c.slug AS category_slug, c.icon AS category_icon, p.phone,
         p.neighborhood, p.city, p.bio, p.availability, p.is_active,
         p.updated_at
  FROM profiles p
  JOIN users u ON u.id = p.user_id
  JOIN categories c ON c.id = p.category_id`;

router.get('/', asyncHandler(async (req, res) => {
  const conditions = ['p.is_active = TRUE'];
  const values = [];
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const neighborhood = typeof req.query.neighborhood === 'string'
    ? req.query.neighborhood.trim().slice(0, 100)
    : '';
  const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';

  if (category) {
    conditions.push('c.slug = ?');
    values.push(category);
  }
  if (neighborhood) {
    conditions.push('p.neighborhood LIKE ?');
    values.push(`%${neighborhood}%`);
  }
  if (query) {
    conditions.push(`(
      u.full_name LIKE ? OR p.bio LIKE ? OR p.neighborhood LIKE ? OR
      EXISTS (SELECT 1 FROM services sx WHERE sx.profile_id = p.id AND sx.title LIKE ?)
    )`);
    values.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
  }

  const [profiles] = await pool.execute(
    `${profileSelect} WHERE ${conditions.join(' AND ')}
     ORDER BY p.updated_at DESC LIMIT 100`,
    values
  );
  return res.json(await includeServices(profiles));
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const [profiles] = await pool.execute(
    `${profileSelect} WHERE p.user_id = ? LIMIT 1`,
    [req.user.id]
  );
  const [profile] = await includeServices(profiles);
  return res.json(profile || null);
}));

router.post('/me', authenticate, asyncHandler(async (req, res) => {
  const validation = validateProfile(req.body || {});
  if (validation.error) return res.status(400).json({ error: validation.error });
  const { categoryId, phone, neighborhood, city, bio, availability, services } = validation.value;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute(
      'SELECT id FROM profiles WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );
    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({ error: 'Você já possui um perfil profissional.' });
    }
    const [category] = await connection.execute('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (!category.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'A categoria selecionada não existe.' });
    }
    const [result] = await connection.execute(
      `INSERT INTO profiles
       (user_id, category_id, phone, neighborhood, city, bio, availability)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, categoryId, phone, neighborhood, city, bio, availability]
    );
    for (const service of services) {
      await connection.execute(
        `INSERT INTO services (profile_id, title, description, price, price_unit)
         VALUES (?, ?, ?, ?, ?)`,
        [result.insertId, service.title, service.description, service.price, service.priceUnit]
      );
    }
    await connection.commit();
    const [profiles] = await pool.execute(`${profileSelect} WHERE p.id = ?`, [result.insertId]);
    return res.status(201).json((await includeServices(profiles))[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

router.put('/me', authenticate, asyncHandler(async (req, res) => {
  const validation = validateProfile(req.body || {});
  if (validation.error) return res.status(400).json({ error: validation.error });
  const { categoryId, phone, neighborhood, city, bio, availability, services } = validation.value;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [owned] = await connection.execute(
      'SELECT id FROM profiles WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!owned.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Crie seu perfil antes de atualizá-lo.' });
    }
    const [category] = await connection.execute('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (!category.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'A categoria selecionada não existe.' });
    }
    const profileId = owned[0].id;
    await connection.execute(
      `UPDATE profiles SET category_id = ?, phone = ?, neighborhood = ?, city = ?,
       bio = ?, availability = ? WHERE id = ? AND user_id = ?`,
      [categoryId, phone, neighborhood, city, bio, availability, profileId, req.user.id]
    );
    await connection.execute('DELETE FROM services WHERE profile_id = ?', [profileId]);
    for (const service of services) {
      await connection.execute(
        `INSERT INTO services (profile_id, title, description, price, price_unit)
         VALUES (?, ?, ?, ?, ?)`,
        [profileId, service.title, service.description, service.price, service.priceUnit]
      );
    }
    await connection.commit();
    const [profiles] = await pool.execute(`${profileSelect} WHERE p.id = ?`, [profileId]);
    return res.json((await includeServices(profiles))[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

router.patch('/me/status', authenticate, asyncHandler(async (req, res) => {
  if (typeof req.body?.is_active !== 'boolean') {
    return res.status(400).json({ error: 'Informe se o perfil deve ficar ativo ou desativado.' });
  }
  const [result] = await pool.execute(
    'UPDATE profiles SET is_active = ? WHERE user_id = ?',
    [req.body.is_active, req.user.id]
  );
  if (!result.affectedRows) {
    return res.status(404).json({ error: 'Você ainda não criou um perfil profissional.' });
  }
  return res.json({ is_active: req.body.is_active });
}));

router.delete('/me', authenticate, asyncHandler(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM profiles WHERE user_id = ?', [req.user.id]);
  if (!result.affectedRows) {
    return res.status(404).json({ error: 'Você ainda não criou um perfil profissional.' });
  }
  return res.status(204).end();
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(404).json({ error: 'Profissional não encontrado.' });
  }
  const [profiles] = await pool.execute(
    `${profileSelect} WHERE p.id = ? AND p.is_active = TRUE LIMIT 1`,
    [req.params.id]
  );
  if (!profiles.length) return res.status(404).json({ error: 'Profissional não encontrado.' });
  return res.json((await includeServices(profiles))[0]);
}));

export default router;
