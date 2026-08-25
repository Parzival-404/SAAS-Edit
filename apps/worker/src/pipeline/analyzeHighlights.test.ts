import { describe, expect, it } from "vitest";
import { extractJson, normalizeMoment } from "./analyzeHighlights.js";

describe("extractJson", () => {
  it("extrait un objet JSON pur", () => {
    expect(extractJson('{"clips":[]}')).toBe('{"clips":[]}');
  });

  it("extrait le JSON même entouré de texte parasite", () => {
    const text = 'Voici le résultat :\n{"clips":[{"title":"x"}]}\nVoilà.';
    expect(extractJson(text)).toBe('{"clips":[{"title":"x"}]}');
  });

  it("lève une erreur si aucune accolade n'est trouvée", () => {
    expect(() => extractJson("pas de json ici")).toThrow();
  });
});

describe("normalizeMoment", () => {
  it("garde toutes les valeurs quand elles sont présentes", () => {
    const full = {
      startSec: 1,
      endSec: 10,
      title: "Titre",
      hook: "Hook",
      description: "Desc",
      hashtags: ["a", "b"],
      captionText: "Caption",
      viralScore: 0.9,
      scoreReason: "Raison",
      titleVariants: ["V1"],
      hookVariants: ["H1"],
    };
    expect(normalizeMoment(full)).toEqual(full);
  });

  it("remplace les champs manquants par des valeurs par défaut sûres, sans planter", () => {
    const result = normalizeMoment({ title: "Seul titre présent" });
    expect(result.title).toBe("Seul titre présent");
    expect(result.startSec).toBe(0);
    expect(result.hashtags).toEqual([]);
    expect(result.titleVariants).toEqual([]);
    expect(result.hookVariants).toEqual([]);
    expect(result.viralScore).toBe(0);
  });

  it("ignore un champ hashtags/variants qui ne serait pas un tableau", () => {
    const result = normalizeMoment({
      // @ts-expect-error simulate malformed LLM output
      hashtags: "pas un tableau",
      // @ts-expect-error simulate malformed LLM output
      titleVariants: null,
    });
    expect(result.hashtags).toEqual([]);
    expect(result.titleVariants).toEqual([]);
  });
});
