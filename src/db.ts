// src/db.ts
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Abre o banco de dados local
export const db = open({
  filename: path.resolve(__dirname, 'bioapp.db'),
  driver: sqlite3.Database,
}).then(database => {
  // Intercepta os métodos run/get/all para logar
  const methodsToWrap = ['run', 'get', 'all'] as const;

  methodsToWrap.forEach(method => {
    const original = database[method].bind(database);
    database[method] = async (...args: any[]) => {
      console.log(`📌 [DB] Método: ${method} | Query: ${args[0]} | Params: ${JSON.stringify(args.slice(1))}`);
      return (original as any)(...args);
    };     
  });

  return database;
});

// Inicializa o banco e cria tabela de usuários se não existir
export const initDB = async () => {
  const database = await db;
  await database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      dob TEXT NOT NULL
    )
  `);
  console.log('✅ Banco de dados inicializado');
};
