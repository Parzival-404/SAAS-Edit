import { describe, expect, it } from "vitest";
import { escapeDrawtext, wrapTitle } from "./renderClip.js";

describe("wrapTitle", () => {
  it("laisse un titre court sur une seule ligne", () => {
    expect(wrapTitle("Titre court")).toBe("Titre court");
  });

  it("découpe un titre long sur plusieurs lignes de mots entiers", () => {
    const result = wrapTitle("Un titre de test bien accrocheur pour TikTok", 22, 3);
    const lines = result.split("\n");
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(22);
    }
    // aucun mot ne doit être coupé au milieu
    expect(result.replace(/\n/g, " ")).toBe(
      "Un titre de test bien accrocheur pour TikTok",
    );
  });

  it("tronque avec une ellipse si ça dépasse le nombre max de lignes", () => {
    const longTitle = Array.from({ length: 20 }, (_, i) => `mot${i}`).join(" ");
    const result = wrapTitle(longTitle, 10, 2);
    const lines = result.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
  });

  it("gère un mot unique plus long que maxCharsPerLine sans planter", () => {
    const result = wrapTitle("supercalifragilisticexpialidocious", 10, 3);
    expect(result).toContain("supercalifragilisticexpialidocious");
  });

  it("ignore les espaces superflus", () => {
    expect(wrapTitle("  Titre   avec   espaces  ")).toBe("Titre avec espaces");
  });
});

describe("escapeDrawtext", () => {
  it("échappe les apostrophes", () => {
    expect(escapeDrawtext("L'IA c'est fort")).toBe("L\\'IA c\\'est fort");
  });

  it("échappe les deux-points", () => {
    expect(escapeDrawtext("Titre: sous-titre")).toBe("Titre\\: sous-titre");
  });

  it("laisse intact un texte sans caractères spéciaux", () => {
    expect(escapeDrawtext("Texte normal")).toBe("Texte normal");
  });
});
