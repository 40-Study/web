import { http, HttpResponse } from "msw";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

/**
 * MSW request handlers for API mocking in tests
 */
export const handlers = [
  // Auth endpoints
  http.get(`${API_URL}/auth/me`, () => {
    return HttpResponse.json({
      message: "success",
      data: {
        user: { id: "1", email: "test@example.com", name: "Test User" },
        permissions: ["read:courses", "write:courses"],
      },
    });
  }),

  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === "test@example.com" && body.password === "password123") {
      return HttpResponse.json({
        message: "success",
        data: {
          session_token: "test-session-token",
          system_roles: [{ id: "1", name: "student", description: "Student" }],
          user: { id: "1", email: "test@example.com", name: "Test User" },
        },
      });
    }
    return HttpResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }),

  // Course endpoints
  http.get(`${API_URL}/courses`, () => {
    return HttpResponse.json({
      data: [
        {
          id: "1",
          title: "React Basics",
          slug: "react-basics",
          level: "beginner",
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });
  }),
];
