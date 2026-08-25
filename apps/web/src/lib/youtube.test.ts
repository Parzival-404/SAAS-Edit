import { afterEach, describe, expect, it, vi } from "vitest";
import { extractYoutubeVideoId, fetchYoutubeOEmbed } from "./youtube.js";

describe("extractYoutubeVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc123", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["http://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("extrait l'id depuis %s", (url, expected) => {
    expect(extractYoutubeVideoId(url)).toBe(expected);
  });

  it.each([
    ["https://example.com/not-youtube"],
    ["pas une url du tout"],
    [""],
    ["https://www.youtube.com/watch?v=trop-court"],
  ])("renvoie null pour une entrée invalide (%s)", (url) => {
    expect(extractYoutubeVideoId(url)).toBeNull();
  });
});

describe("fetchYoutubeOEmbed", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renvoie les métadonnées quand l'appel réussit", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Titre vidéo",
        author_name: "Chaîne Test",
        thumbnail_url: "http://x/thumb.jpg",
      }),
    }) as unknown as typeof fetch;

    const result = await fetchYoutubeOEmbed("https://youtube.com/watch?v=x");
    expect(result).toEqual({
      title: "Titre vidéo",
      authorName: "Chaîne Test",
      thumbnailUrl: "http://x/thumb.jpg",
    });
  });

  it("renvoie null sans planter si la réponse n'est pas ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    expect(await fetchYoutubeOEmbed("https://youtube.com/watch?v=x")).toBeNull();
  });

  it("renvoie null sans planter si le réseau échoue (ex: proxy qui bloque)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;
    expect(await fetchYoutubeOEmbed("https://youtube.com/watch?v=x")).toBeNull();
  });
});
