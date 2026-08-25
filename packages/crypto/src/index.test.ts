import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./index.js";

describe("encryptSecret / decryptSecret", () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "test-encryption-key-not-for-prod";
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalKey;
  });

  it("déchiffre exactement ce qui a été chiffré", () => {
    const plaintext = "sk-tiktok-fake-access-token-12345";
    const encrypted = encryptSecret(plaintext);
    expect(encrypted).not.toContain(plaintext);
    expect(decryptSecret(encrypted)).toBe(plaintext);
  });

  it("produit un résultat différent à chaque appel (IV aléatoire)", () => {
    const a = encryptSecret("même valeur");
    const b = encryptSecret("même valeur");
    expect(a).not.toBe(b);
  });

  it("échoue si le texte chiffré est altéré (intégrité GCM)", () => {
    const encrypted = encryptSecret("valeur secrète");
    const tampered = encrypted.slice(0, -2) + "ff";
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("lève une erreur explicite si ENCRYPTION_KEY est absente", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encryptSecret("x")).toThrow(/ENCRYPTION_KEY/);
  });
});
