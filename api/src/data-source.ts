import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { User } from './users/entities/user.entity';
import { Project } from './projects/entities/project.entity';
import { LgpdArticle } from './checklist/entities/lgpd-article.entity';
import { ChecklistQuestion } from './checklist/entities/checklist-question.entity';
import { ChecklistResponse } from './checklist/entities/checklist-response.entity';
import { Report } from './reports/entities/report.entity';
import { Recommendation } from './reports/entities/recommendation.entity';

loadEnv();

const url = process.env.DATABASE_URL;

export default new DataSource({
  type: 'postgres',
  ...(url
    ? { url }
    : {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
      }),
  entities: [
    User,
    Project,
    LgpdArticle,
    ChecklistQuestion,
    ChecklistResponse,
    Report,
    Recommendation,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  ssl: url ? { rejectUnauthorized: false } : false,
});
