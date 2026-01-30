import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db',
  externalPartsProvider: process.env.EXTERNAL_PARTS_PROVIDER ?? '',
};
