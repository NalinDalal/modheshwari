import { expect, test } from "bun:test";

test("FamilyHead signup + login", async () => {
  const signupRes = await fetch("http://localhost:3001/api/signup/familyhead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email: "testuser@example.com",
      password: "secret123",
      familyName: "Test Family",
    }),
  });
  expect(signupRes.status).toBe(200);

  const loginRes = await fetch("http://localhost:3001/api/login/familyhead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "testuser@example.com",
      password: "secret123",
    }),
  });
  const data = await loginRes.json();
  expect(data.token).toBeDefined();
});
