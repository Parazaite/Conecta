const text = (value, maxLength) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

export function validateProfile(body) {
  body ||= {};
  const categoryId = Number(body.category_id);
  const profile = {
    categoryId,
    phone: text(body.phone, 30),
    neighborhood: text(body.neighborhood, 100),
    city: text(body.city, 100),
    bio: text(body.bio, 2000),
    availability: text(body.availability, 180)
  };

  if (!Number.isInteger(categoryId) || categoryId < 1) {
    return { error: 'Escolha uma categoria válida.' };
  }
  if (!profile.phone || !profile.neighborhood || !profile.city || !profile.bio) {
    return { error: 'Preencha telefone, bairro, cidade e apresentação.' };
  }
  if (!Array.isArray(body.services) || body.services.length < 1 || body.services.length > 10) {
    return { error: 'Informe de 1 a 10 serviços.' };
  }

  const services = [];
  for (const service of body.services) {
    const title = text(service?.title, 120);
    const description = text(service?.description, 500);
    const price = Number(service?.price);
    const priceUnit = text(service?.price_unit, 40) || 'por serviço';

    if (!title || !Number.isFinite(price) || price < 0) {
      return { error: 'Cada serviço precisa de um nome e um preço válido.' };
    }
    services.push({ title, description, price, priceUnit });
  }

  return { value: { ...profile, services } };
}
