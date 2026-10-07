export { lerConfig, CONFIG_PADRAO, type ConfigLlm } from "./config.js";
export { criarModelo, NOME_PROVEDOR, type OpcoesModelo } from "./modelo.js";
export {
  gerarTexto,
  gerarObjeto,
  type OpcoesGeracao,
  type Resultado,
  type Uso,
  type LogprobToken,
} from "./gerar.js";
