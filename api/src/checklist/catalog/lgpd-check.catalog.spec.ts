import {
  CODIGOS_NO_CHECKLIST,
  ITENS_NO_CHECKLIST,
  LGPD_CHECK_CATEGORIAS,
  LGPD_CHECK_ITENS,
  PERGUNTAS_LEGADAS,
  aplicarCatalogoLgpdCheck,
} from './lgpd-check.catalog';

describe('Catalogo LGPD-Check', () => {
  it('tem os 61 itens do LGPD-Check (47 obrigatorios e 14 opcionais), sem codigos repetidos', () => {
    const codigos = LGPD_CHECK_ITENS.map((i) => i.codigo);
    expect(codigos).toHaveLength(61);
    expect(new Set(codigos).size).toBe(61);
    expect(LGPD_CHECK_ITENS.filter((i) => i.obrigatorio)).toHaveLength(47);
    expect(LGPD_CHECK_ITENS.filter((i) => !i.obrigatorio)).toHaveLength(14);
  });

  it('cobre as cinco categorias do artigo (T=14, C=8, D=15, S=17, R=7)', () => {
    const porPrefixo = LGPD_CHECK_ITENS.reduce<Record<string, number>>((acc, i) => {
      acc[i.codigo[0]] = (acc[i.codigo[0]] ?? 0) + 1;
      return acc;
    }, {});
    expect(porPrefixo).toEqual({ T: 14, C: 8, D: 15, S: 17, R: 7 });
  });

  it('tem as secoes de Seguranca, Processamento e Direitos dos usuarios, todas com itens', () => {
    const titulos = LGPD_CHECK_CATEGORIAS.map((c) => c.titulo);
    expect(titulos).toEqual(
      expect.arrayContaining(['Segurança de dados', 'Processamento de dados', 'Direitos dos usuários']),
    );
    for (const cat of LGPD_CHECK_CATEGORIAS) {
      expect(LGPD_CHECK_ITENS.some((i) => i.categoria === cat.chave)).toBe(true);
    }
  });

  it('respeita os limites das colunas do banco', () => {
    for (const i of LGPD_CHECK_ITENS) {
      expect(i.codigo.length).toBeLessThanOrEqual(10);
      expect(i.referencia.length).toBeLessThanOrEqual(100);
      expect(i.recomendacao.trim()).not.toBe('');
    }
    for (const c of LGPD_CHECK_CATEGORIAS) {
      expect(c.artigo.length).toBeLessThanOrEqual(50);
      expect(c.titulo.length).toBeLessThanOrEqual(200);
    }
  });

  it('exibe 3 perguntas obrigatorias por secao (18 no total)', () => {
    expect(ITENS_NO_CHECKLIST).toHaveLength(18);
    expect(new Set(CODIGOS_NO_CHECKLIST).size).toBe(18);
    for (const cat of LGPD_CHECK_CATEGORIAS) {
      const itens = ITENS_NO_CHECKLIST.filter((i) => i.categoria === cat.chave);
      expect({ secao: cat.titulo, qtd: itens.length }).toEqual({ secao: cat.titulo, qtd: 3 });
      expect(itens.every((i) => i.obrigatorio)).toBe(true);
    }
  });

  it('mantem no checklist os itens que substituem as perguntas legadas (preserva respostas)', () => {
    for (const l of PERGUNTAS_LEGADAS) expect(CODIGOS_NO_CHECKLIST).toContain(l.novoCodigo);
  });

  it('aplica o catalogo usando apenas queries parametrizadas', async () => {
    let nextId = 1;
    const query = jest.fn(async (sql: string) => (sql.trim().startsWith('SELECT') ? [{ id: nextId++ }] : []));
    await aplicarCatalogoLgpdCheck(query);
    // Toda chamada recebe parametros (nada de interpolacao de texto no SQL).
    for (const call of query.mock.calls) {
      expect(Array.isArray(call[1])).toBe(true);
    }
    const inserts = query.mock.calls.filter(([sql]) => sql.includes('INSERT INTO "checklist_perguntas"'));
    expect(inserts).toHaveLength(18);
  });
});
