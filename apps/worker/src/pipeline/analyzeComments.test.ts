import { describe, expect, it } from "vitest";
import { normalizeCommentAnalysis } from "./analyzeComments.js";

describe("normalizeCommentAnalysis", () => {
  it("garde toutes les valeurs quand elles sont présentes", () => {
    const full = {
      summary: "Résumé",
      positiveCount: 10,
      negativeCount: 2,
      neutralCount: 3,
      topThemes: ["thème1"],
      faqs: ["question1"],
      contentIdeas: ["idée1"],
    };
    expect(normalizeCommentAnalysis(full)).toEqual(full);
  });

  it("remplace les champs manquants par des valeurs par défaut sûres", () => {
    const result = normalizeCommentAnalysis({ summary: "Résumé seul" });
    expect(result.summary).toBe("Résumé seul");
    expect(result.positiveCount).toBe(0);
    expect(result.topThemes).toEqual([]);
    expect(result.faqs).toEqual([]);
    expect(result.contentIdeas).toEqual([]);
  });

  it("ignore un champ tableau qui ne serait pas un tableau", () => {
    const result = normalizeCommentAnalysis({
      // @ts-expect-error simulate malformed LLM output
      topThemes: "pas un tableau",
    });
    expect(result.topThemes).toEqual([]);
  });

  it("fournit un résumé par défaut si absent", () => {
    const result = normalizeCommentAnalysis({});
    expect(result.summary).toBeTruthy();
  });
});
