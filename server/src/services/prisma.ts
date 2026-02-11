import { PrismaClient } from '@prisma/client';

// В Prisma 7 URL передается в конструктор, если используется динамическая конфигурация
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export default prisma;
