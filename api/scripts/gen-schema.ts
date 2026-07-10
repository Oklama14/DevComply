import 'reflect-metadata';
import { newDb, DataType } from 'pg-mem';
import { User } from '@/users/entities/user.entity';
import { Project } from '@/projects/entities/project.entity';
import { LgpdArticle } from '@/checklist/entities/lgpd-article.entity';
import { ChecklistQuestion } from '@/checklist/entities/checklist-question.entity';
import { ChecklistResponse } from '@/checklist/entities/checklist-response.entity';
import { Report } from '@/reports/entities/report.entity';
import { Recommendation } from '@/reports/entities/recommendation.entity';

async function main() {
  const db = newDb();
  db.public.registerFunction({ name: 'version', returns: DataType.text, implementation: () => 'PostgreSQL 14.0 (pg-mem)' });
  db.public.registerFunction({ name: 'current_database', returns: DataType.text, implementation: () => 'devcomply' });
  db.public.registerFunction({ name: 'obj_description', args: [DataType.regclass, DataType.text], returns: DataType.text, implementation: () => null as any });

  const ds = db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: [User, Project, LgpdArticle, ChecklistQuestion, ChecklistResponse, Report, Recommendation],
  });
  await ds.initialize();
  const sql = await ds.driver.createSchemaBuilder().log();
  console.log('==UP==');
  sql.upQueries.forEach((q: any) => console.log(q.query + ';'));
  console.log('==DOWN==');
  sql.downQueries.forEach((q: any) => console.log(q.query + ';'));
  await ds.destroy();
}
main().catch((e) => { console.error('ERRO:', e?.message || e); process.exit(1); });
