// Métricas da classificação (M3, reaproveitadas na M8): acurácia, precisão/recall/F1 por classe e macro-F1.
import { CATEGORIAS } from "../src/noticia.js";

export type Saida = {
  resultado: { ok: boolean; decisao?: { relevante: boolean; categoria: string | null; confianca: number } };
  publicacao: { acao: string; motivos: string[] };
};

export const rotuloDe = (relevante: boolean, categoria: string | null) => (relevante ? categoria ?? "?" : "irrelevante");
export const CLASSES = [...CATEGORIAS, "irrelevante"];

export function metricas(pares: { esperado: string; previsto: string }[]) {
  const porClasse = CLASSES.map((c) => {
    const tp = pares.filter((p) => p.previsto === c && p.esperado === c).length;
    const fp = pares.filter((p) => p.previsto === c && p.esperado !== c).length;
    const fn = pares.filter((p) => p.previsto !== c && p.esperado === c).length;
    const precisao = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    const f1 = precisao + recall ? (2 * precisao * recall) / (precisao + recall) : 0;
    return { classe: c, precisao, recall, f1, suporte: tp + fn };
  });
  const acuracia = pares.filter((p) => p.esperado === p.previsto).length / pares.length;
  const macroF1 = porClasse.reduce((s, c) => s + c.f1, 0) / porClasse.length;
  return { porClasse, acuracia, macroF1 };
}

