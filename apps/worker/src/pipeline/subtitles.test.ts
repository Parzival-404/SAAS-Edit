import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatAssTime, generateSubtitleFile } from "./subtitles.js";

describe("formatAssTime", () => {
  it("formate zéro secondes", () => {
    expect(formatAssTime(0)).toBe("0:00:00.00");
  });

  it("formate les secondes et centièmes", () => {
    expect(formatAssTime(5.25)).toBe("0:00:05.25");
  });

  it("formate les minutes", () => {
    expect(formatAssTime(75)).toBe("0:01:15.00");
  });

  it("formate les heures", () => {
    expect(formatAssTime(3661.5)).toBe("1:01:01.50");
  });
});

describe("generateSubtitleFile", () => {
  let workDir: string;

  beforeEach(async () => {
    workDir = await mkdtemp(path.join(tmpdir(), "saas-edit-subtitles-"));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it("ne garde que les segments qui chevauchent la fenêtre du clip, avec des timestamps relatifs", async () => {
    const outputPath = path.join(workDir, "test.ass");
    await generateSubtitleFile(
      [
        { start: 0, end: 5, text: "avant le clip" },
        { start: 8, end: 12, text: "premier segment du clip" },
        { start: 12, end: 16, text: "deuxième segment" },
        { start: 30, end: 35, text: "bien après le clip" },
      ],
      10, // clipStart
      20, // clipEnd
      outputPath,
    );

    const content = await readFile(outputPath, "utf-8");

    expect(content).not.toContain("avant le clip");
    expect(content).not.toContain("bien après le clip");
    expect(content).toContain("premier segment du clip");
    expect(content).toContain("deuxième segment");

    // "premier segment du clip" commence à 8s dans la source, donc à
    // -2s relatif au clip -> clampé à 0.
    expect(content).toContain("Dialogue: 0,0:00:00.00,0:00:02.00,Default,premier segment du clip");
  });

  it("échappe les retours à la ligne dans le texte", async () => {
    const outputPath = path.join(workDir, "test.ass");
    await generateSubtitleFile(
      [{ start: 0, end: 2, text: "ligne un\nligne deux" }],
      0,
      5,
      outputPath,
    );
    const content = await readFile(outputPath, "utf-8");
    expect(content).toContain("ligne un ligne deux");
  });

  it("neutralise les accolades pour éviter qu'elles soient lues comme des tags de style ASS", async () => {
    const outputPath = path.join(workDir, "test.ass");
    await generateSubtitleFile(
      [{ start: 0, end: 2, text: "{\\pos(0,0)}texte déplacé {rire}" }],
      0,
      5,
      outputPath,
    );
    const content = await readFile(outputPath, "utf-8");
    expect(content).not.toContain("{\\pos");
    expect(content).not.toContain("{rire}");
    expect(content).toContain("｛\\pos(0,0)｝texte déplacé ｛rire｝");
  });
});
