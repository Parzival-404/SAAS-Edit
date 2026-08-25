import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YoutubeApiError, listRecentUploads, resolveChannel } from "./index.js";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("resolveChannel", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("résout une URL /channel/UCxxxx par id direct", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        items: [
          {
            id: "UCabcdefghijklmnopqrstuv",
            snippet: { title: "Ma Chaîne", thumbnails: { default: { url: "http://x/thumb.jpg" } } },
          },
        ],
      }),
    );

    const result = await resolveChannel(
      "https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv",
      "fake-key",
    );

    expect(result.channelId).toBe("UCabcdefghijklmnopqrstuv");
    expect(result.title).toBe("Ma Chaîne");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("id=UCabcdefghijklmnopqrstuv"));
  });

  it("résout un @handle via forHandle", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        items: [{ id: "UCxxx", snippet: { title: "Handle Channel" } }],
      }),
    );

    const result = await resolveChannel("https://www.youtube.com/@monhandle", "fake-key");

    expect(result.channelId).toBe("UCxxx");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("forHandle=monhandle"));
  });

  it("accepte un handle brut sans URL", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ items: [{ id: "UCyyy", snippet: { title: "Direct" } }] }),
    );

    await resolveChannel("@monhandle", "fake-key");

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("forHandle=monhandle"));
  });

  it("lève une YoutubeApiError explicite si la chaîne n'existe pas", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await expect(resolveChannel("@inconnu", "fake-key")).rejects.toThrow(YoutubeApiError);
  });

  it("propage un message d'erreur propre (pas le JSON brut) si l'API échoue", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { message: "API key not valid." } }, false, 400),
    );

    await expect(resolveChannel("@x", "bad-key")).rejects.toThrow("API key not valid.");
  });
});

describe("listRecentUploads", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("liste les vidéos de la playlist uploads", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ items: [{ id: "UCxxx", contentDetails: { relatedPlaylists: { uploads: "PLxxx" } } }] }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              snippet: {
                title: "Vidéo 1",
                description: "desc",
                publishedAt: "2026-01-01T00:00:00Z",
                resourceId: { videoId: "vid1" },
                thumbnails: { medium: { url: "http://x/1.jpg" } },
              },
            },
          ],
        }),
      );

    const videos = await listRecentUploads("UCxxx", "fake-key");

    expect(videos).toHaveLength(1);
    expect(videos[0].videoId).toBe("vid1");
    expect(videos[0].thumbnailUrl).toBe("http://x/1.jpg");
  });

  it("ne garde que les vidéos publiées après publishedAfter", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ items: [{ id: "UCxxx", contentDetails: { relatedPlaylists: { uploads: "PLxxx" } } }] }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              snippet: {
                title: "Ancienne vidéo",
                description: "",
                publishedAt: "2025-01-01T00:00:00Z",
                resourceId: { videoId: "old" },
              },
            },
            {
              snippet: {
                title: "Nouvelle vidéo",
                description: "",
                publishedAt: "2026-06-01T00:00:00Z",
                resourceId: { videoId: "new" },
              },
            },
          ],
        }),
      );

    const videos = await listRecentUploads("UCxxx", "fake-key", new Date("2026-01-01T00:00:00Z"));

    expect(videos.map((v) => v.videoId)).toEqual(["new"]);
  });

  it("lève une erreur si la chaîne n'a pas de playlist uploads", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await expect(listRecentUploads("UCinconnue", "fake-key")).rejects.toThrow(YoutubeApiError);
  });
});
