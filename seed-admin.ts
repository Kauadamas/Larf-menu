/**
 * Script para criar o usuário superadmin inicial.
 * 
 * Execute com:
 *   npx tsx seed-admin.ts
 * 
 * Após entrar no painel, altere a senha em: Admin > Usuários > botão "Senha"
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { users } from "./drizzle/schema";

const EMAIL = "admin123@gmail.com";
const PASSWORD = "ADMIN123";
const NAME = "Admin";

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await db.insert(users).values({
    openId: "superadmin-local-1",
    name: NAME,
    email: EMAIL,
    loginMethod: "password",
    passwordHash,
    role: "superadmin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });

  console.log(`✅ Superadmin criado com sucesso!`);
  console.log(`   E-mail: ${EMAIL}`);
  console.log(`   Senha:  ${PASSWORD}`);
  console.log(`\n⚠️  Lembre-se de alterar a senha após o primeiro login.`);

  await connection.end();
}

seed().catch((err) => {
  console.error("❌ Erro ao criar superadmin:", err.message);
  process.exit(1);
});
