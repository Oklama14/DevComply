/**
 * Versao vigente de cada documento cujo aceite e registrado no cadastro.
 *
 * Quem carimba a versao e o servidor, nao o cliente: o navegador informa apenas que
 * o titular aceitou, e gravar a versao que o proprio backend considera corrente
 * evita depender de um campo que poderia ser forjado. Ao publicar um texto novo,
 * suba a versao aqui — quem aceitou a versao anterior continua com o registro
 * daquilo que de fato leu.
 */
export const POLITICA_PRIVACIDADE_VERSAO = '2026-10-29';
export const TERMOS_USO_VERSAO = '2026-10-23';
