/**
 * TEST BYPASS LOGIN PAGE
 *
 * =============================================================================
 * WARNING: THIS PAGE IS FOR TESTING ONLY
 * =============================================================================
 *
 * This page bypasses the real authentication flow to allow quick testing
 * with predefined test accounts. It directly sets the auth store state.
 *
 * TEST ACCOUNTS:
 * - Student:  student@test.com / Test@123
 * - Teacher:  teacher@test.com / Test@123
 * - Admin:    admin@test.com  / Test@123
 *
 * TO REMOVE AFTER TESTING:
 * 1. Delete this file: src/app/(auth)/login/test/page.tsx
 * 2. Delete this directory: src/app/(auth)/login/test/
 * 3. Remove any test data from auth store initialization
 *
 * Created: 2026-03-25
 * =============================================================================
 */

"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_HOME_ROUTES } from "@/lib/routes";
import { Shield, GraduationCap, Users, AlertTriangle } from "lucide-react";

// Test user data for each role
const TEST_USERS = {
  STUDENT: {
    id: "test-student-001",
    email: "student@test.com",
    name: "Test Student",
    avatar: undefined,
  },
  TEACHER: {
    id: "test-teacher-001",
    email: "teacher@test.com",
    name: "Test Teacher",
    avatar: undefined,
  },
  SYSTEM_ADMIN: {
    id: "test-admin-001",
    email: "admin@test.com",
    name: "Test Admin",
    avatar: undefined,
  },
} as const;

const ROLE_ICONS = {
  STUDENT: GraduationCap,
  TEACHER: Users,
  SYSTEM_ADMIN: Shield,
};

const ROLE_LABELS = {
  STUDENT: "Học sinh",
  TEACHER: "Giáo viên",
  SYSTEM_ADMIN: "Quản trị viên",
};

type TestRole = keyof typeof TEST_USERS;

export default function TestBypassLoginPage() {
  const router = useRouter();
  const { login, setActiveRole, setToken } = useAuthStore();

  const handleTestLogin = (role: TestRole) => {
    const user = TEST_USERS[role];

    // Set a fake token for testing
    setToken(`test-token-${role.toLowerCase()}-${Date.now()}`);

    // Set the active role
    setActiveRole(role);

    // Login with the test user
    login(user);

    // Redirect to role-specific home
    const homeRoute = ROLE_HOME_ROUTES[role];
    router.push(homeRoute);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
              TEST ONLY
            </span>
          </div>
          <CardTitle className="text-2xl">Test Bypass Login</CardTitle>
          <CardDescription>
            Đăng nhập nhanh với tài khoản test để kiểm tra các tính năng.
            <br />
            <span className="text-red-500 font-medium">
              Không sử dụng trong môi trường production!
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Student */}
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => handleTestLogin("STUDENT")}
          >
            <GraduationCap className="w-8 h-8 text-primary-500" />
            <div className="text-center">
              <p className="font-semibold text-base">Học sinh</p>
              <p className="text-xs text-muted-foreground">student@test.com</p>
            </div>
          </Button>

          {/* Teacher */}
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => handleTestLogin("TEACHER")}
          >
            <Users className="w-8 h-8 text-emerald-500" />
            <div className="text-center">
              <p className="font-semibold text-base">Giáo viên</p>
              <p className="text-xs text-muted-foreground">teacher@test.com</p>
            </div>
          </Button>

          {/* Admin */}
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => handleTestLogin("SYSTEM_ADMIN")}
          >
            <Shield className="w-8 h-8 text-red-500" />
            <div className="text-center">
              <p className="font-semibold text-base">Quản trị viên</p>
              <p className="text-xs text-muted-foreground">admin@test.com</p>
            </div>
          </Button>

          {/* Info box */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <p className="font-semibold mb-1">Tài khoản test:</p>
            <p>Email: student@test.com / teacher@test.com / admin@test.com</p>
            <p>Mật khẩu: Test@123 (không cần thiết vì bypass)</p>
          </div>

          {/* Back to normal login */}
          <div className="text-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/login")}
              className="text-muted-foreground"
            >
              Quay lại đăng nhập thường
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
