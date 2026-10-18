import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProfile } from '../src/utils/profileValidation.js';

const validProfile = {
  category_id: 2,
  phone: ' 11999990000 ',
  neighborhood: ' Centro ',
  city: ' São Paulo ',
  bio: ' Costureira com experiência. ',
  availability: 'De segunda a sexta',
  services: [
    { title: 'Ajuste de roupa', description: 'Barras e ajustes', price: 35, price_unit: 'por peça' }
  ]
};

test('accepts a valid profile and trims text values', () => {
  const result = validateProfile(validProfile);
  assert.equal(result.error, undefined);
  assert.equal(result.value.phone, '11999990000');
  assert.equal(result.value.neighborhood, 'Centro');
  assert.equal(result.value.services[0].price, 35);
});

test('rejects an invalid category and missing required profile data', () => {
  assert.match(validateProfile({ ...validProfile, category_id: 0 }).error, /categoria/i);
  assert.match(validateProfile({ ...validProfile, bio: ' ' }).error, /apresentação/i);
});

test('requires between one and ten services with non-negative prices', () => {
  assert.match(validateProfile({ ...validProfile, services: [] }).error, /1 a 10/i);
  assert.match(
    validateProfile({ ...validProfile, services: [{ title: 'Reparo', price: -1 }] }).error,
    /preço válido/i
  );
});

test('rejects more than ten services', () => {
  const services = Array.from({ length: 11 }, (_, index) => ({ title: `Serviço ${index}`, price: 0 }));
  assert.match(validateProfile({ ...validProfile, services }).error, /1 a 10/i);
});
