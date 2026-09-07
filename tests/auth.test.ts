import { test, describe } from "node:test";
import assert from "node:assert";
import { hashPassword, comparePassword } from "../src/lib/password";
import { signAccessToken, verifyAccessToken } from "../src/lib/jwt";

describe("Authentication & Security Unit Tests", () => {
  test("Password hashing and comparison", async () => {
    const rawPassword = "securePassword123!";
    const hash = await hashPassword(rawPassword);

    assert.notStrictEqual(rawPassword, hash, "Hash must be different from raw password");
    const isValid = await comparePassword(rawPassword, hash);
    assert.strictEqual(isValid, true, "Valid password must match hash");

    const isInvalid = await comparePassword("wrongPassword", hash);
    assert.strictEqual(isInvalid, false, "Wrong password must be rejected");
  });

  test("JWT Access Token signing and verification", () => {
    const payload = {
      userId: "user-1234",
      email: "teacher@edutech.vn",
      role: "TEACHER",
      fullName: "Nguyễn Văn A",
    };

    const token = signAccessToken(payload);
    assert.ok(typeof token === "string" && token.length > 20, "Token should be valid JWT string");

    const verified = verifyAccessToken(token);
    assert.ok(verified !== null, "Token should be verified successfully");
    assert.strictEqual(verified.userId, payload.userId);
    assert.strictEqual(verified.email, payload.email);
    assert.strictEqual(verified.role, payload.role);
    assert.strictEqual(verified.fullName, payload.fullName);

    const invalid = verifyAccessToken("fake.invalid.token");
    assert.strictEqual(invalid, null, "Tampered token should return null");
  });
});
