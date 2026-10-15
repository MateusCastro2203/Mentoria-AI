// O mesmo Worker, com a solução de referência (pnpm -F @mentoria/ex08-operacao dev:solucao).
import { executarDia } from "../solucao/execucao.js";
import { criarWorker } from "./worker.js";

export default criarWorker(executarDia);
