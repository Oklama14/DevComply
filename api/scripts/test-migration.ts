import 'reflect-metadata';
import { newDb, DataType } from 'pg-mem';
import { InitialSchema1720000000000 } from '@/migrations/1720000000000-InitialSchema';

async function main() {
  const db = newDb();
  db.public.registerFunction({ name: 'version', returns: DataType.text, implementation: () => 'PostgreSQL 14.0' });
  db.public.registerFunction({ name: 'current_database', returns: DataType.text, implementation: () => 'devcomply' });
  const ds = db.adapters.createTypeormDataSource({ type: 'postgres', entities: [] });
  await ds.initialize();
  const qr = ds.createQueryRunner();

  // Executa so os CREATE TABLE + FKs (sem os DO-blocks, que dependem de pg_constraint)
  const mig: any = new InitialSchema1720000000000();
  const captured: string[] = [];
  const fakeQr: any = {
    query: async (sql: string) => {
      if (sql.trim().startsWith('DO $$')) {
        // extrai o ALTER de dentro do bloco e executa direto (fresh DB)
        const m = sql.match(/THEN (ALTER TABLE[\s\S]+?); END IF/);
        if (m) { captured.push('FK'); return qr.query(m[1].replace(/''/g, "'")); }
        return;
      }
      captured.push(sql.split('(')[0].trim());
      return qr.query(sql);
    },
  };
  await mig.up(fakeQr);

  const tables = ['usuarios','artigos_lgpd','projetos','checklist_perguntas','relatorios','checklist_respostas','recomendacoes'];
  for (const t of tables) {
    const r = await qr.query(`SELECT count(*)::int AS c FROM "${t}"`);
    console.log(`OK tabela ${t}: ${JSON.stringify(r[0])}`);
  }
  console.log('Statements executados:', captured.length);
  await ds.destroy();
  console.log('MIGRATION SQL VALIDA');
}
main().catch((e) => { console.error('FALHOU:', e?.message || e); process.exit(1); });
