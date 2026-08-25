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
  it("échappe une apostrophe via la séquence ferme-citation/échappe/rouvre-citation", () => {
    // C'est la seule technique qui fonctionne réellement : un backslash
    // seul (\\') ne protège rien à l'intérieur d'un text='...' pour
    // ffmpeg, voir le commentaire de escapeDrawtext.
    expect(escapeDrawtext("L'IA")).toBe("L'\\''IA");
  });

  it("laisse passer les métacaractères de filtergraph inchangés (sûrs entre guillemets)", () => {
    // `:` `,` `;` `[` `]` ne sont dangereux QUE hors des guillemets. Tant
    // qu'ils restent à l'intérieur de text='...', ffmpeg les traite comme
    // du texte littéral — pas besoin (et pas correct) de les échapper.
    expect(escapeDrawtext("Titre: partie 1, partie 2 [important]")).toBe(
      "Titre: partie 1, partie 2 [important]",
    );
  });

  it("double les % (syntaxe d'expansion de fonctions drawtext)", () => {
    expect(escapeDrawtext("100% viral")).toBe("100%% viral");
  });

  it("laisse intact un texte sans caractères spéciaux", () => {
    expect(escapeDrawtext("Texte normal")).toBe("Texte normal");
  });

  it("neutralise une tentative d'injection de filtre supplémentaire", () => {
    // Un titre malveillant qui tenterait de sortir du text='...' pour
    // injecter un filtre ffmpeg additionnel (ex. via prompt injection
    // dans la transcription analysée par le LLM) doit rester une simple
    // apostrophe littérale suivie de texte, jamais une citation rouverte
    // sans échappement correspondant.
    const malicious = "x' ,movie=/etc/passwd[bg];[bg]overlay,drawtext=text='y";
    const escaped = escapeDrawtext(malicious);
    // Chaque guillemet simple d'origine doit être suivi de la séquence
    // d'échappement complète — jamais un guillemet brut isolé qui
    // terminerait la citation sans réouverture.
    const rawQuoteCount = (escaped.match(/'/g) ?? []).length;
    const escapeSequenceCount = (escaped.match(/'\\''/g) ?? []).length;
    // Chaque séquence d'échappement consomme 3 des guillemets comptés
    // (') + (\') + ('), donc rawQuoteCount doit être un multiple exact
    // de 3 correspondant au nombre de guillemets d'origine échappés.
    expect(rawQuoteCount).toBe(escapeSequenceCount * 3);
    expect(escapeSequenceCount).toBe((malicious.match(/'/g) ?? []).length);
  });
});
