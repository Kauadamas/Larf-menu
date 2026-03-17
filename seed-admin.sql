-- ============================================================
-- Inserir superadmin inicial no banco de dados
-- E-mail: admin123@gmail.com
-- Senha:  ADMIN123
-- ============================================================
-- Hash gerado com bcrypt (10 rounds) para a senha "ADMIN123"
-- ============================================================

INSERT INTO users (openId, name, email, loginMethod, passwordHash, role, createdAt, updatedAt, lastSignedIn)
VALUES (
  'superadmin-local-1',
  'Admin',
  'admin123@gmail.com',
  'password',
  '$2b$10$0ECFIwsqmCHTgvxPAkS1DuPLNaQ9fLmAU8nX/k/oB4Ps6LruuXpbi',
  'superadmin',
  NOW(),
  NOW(),
  NOW()
);

-- Após entrar no painel, altere a senha em:
-- Admin > Usuários > botão "Senha"
