"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ArrowLeft, Plus, Mail, UserCheck, FileText, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { AUTH_CONFIG, ROLE_NAME_MAP, STORAGE_KEYS } from "@/lib/constants";
import { showComingSoon } from "@/lib/toast-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SocialLoginButton } from "@/components/auth/social-login-button";
import { RoleCard } from "@/components/auth/role-card";
import { SelectionCard } from "@/components/auth/selection-card";
import { OtpInput } from "@/components/auth/otp-input";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { MailIcon } from "@/components/icons";
import type { RoleType } from "@/components/auth/role-card";
import { useQueryClient } from "@tanstack/react-query";
import { useLogin, useRegisterRequest, useRegister, useSelectProfile, useSelectOrg, authKeys } from "@/hooks/queries/use-auth";
import { authService, getDeviceInfo } from "@/services/auth.service";
import type { SystemRole } from "@/services/auth.service";
import type { Permission } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth.store";
import { roleService } from "@/services/role.service";
import { AUTH_ROUTES, getRoleHomeRoute, normalizeRole } from "@/lib/routes";

// ─── Types ──────────────────────────────────────────────────────────────────

type ModalView =
    | "login"
    | "login-role"
    | "login-org"
    | "register"
    | "register-role"
    | "register-form"
    | "register-otp"
    | "register-success";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: "login" | "register";
}

// ─── Progress Bar ───────────────────────────────────────────────────────────

const REGISTER_STEPS = [
    { label: "Phương thức", icon: Mail },
    { label: "Vai trò", icon: UserCheck },
    { label: "Thông tin", icon: FileText },
    { label: "Xác thực", icon: ShieldCheck },
];

function StepProgress({ currentStep }: { currentStep: number }) {
    return (
        <div className="mb-8">
            <p className="text-center text-sm text-gray-500 mb-5">4 bước dễ dàng</p>
            <div className="flex items-start">
                {REGISTER_STEPS.map(({ label, icon: Icon }, i) => {
                    const isDone = i < currentStep;
                    const isActive = i === currentStep;

                    return (
                        <div key={label} className="flex items-start flex-1">
                            {/* Step */}
                            <div className="flex flex-col items-center flex-1">
                                <div className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                                    isDone && "bg-primary-500 text-white",
                                    isActive && "bg-primary-500 text-white ring-4 ring-primary-100",
                                    !isDone && !isActive && "bg-gray-100 text-gray-400",
                                )}>
                                    {isDone ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <Icon className="w-5 h-5" />
                                    )}
                                </div>
                                <span className={cn(
                                    "mt-2 text-[11px] font-medium",
                                    (isDone || isActive) ? "text-primary-600" : "text-gray-400",
                                )}>
                                    {label}
                                </span>
                            </div>

                            {/* Connector */}
                            {i < REGISTER_STEPS.length - 1 && (
                                <div className="flex-shrink-0 w-8 mt-5">
                                    <div className={cn(
                                        "h-0.5 w-full rounded-full transition-all duration-500",
                                        i < currentStep ? "bg-primary-500" : "bg-gray-200",
                                    )} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Modal ─────────────────────────────────────────────────────────────

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
    const [view, setView] = useState<ModalView>(initialMode);
    const [mounted, setMounted] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Register state
    const [registerEmail, setRegisterEmail] = useState("");

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (isOpen) {
            setView(initialMode);
            setShowConfirm(false);
        }
    }, [isOpen, initialMode]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Can close instantly on login/register start screens, otherwise confirm
    const isStartScreen = view === "login" || view === "register" || view === "register-success";

    const handleRequestClose = useCallback(() => {
        if (isStartScreen) {
            onClose();
        } else {
            setShowConfirm(true);
        }
    }, [isStartScreen, onClose]);

    const handleConfirmClose = useCallback(() => {
        setShowConfirm(false);
        onClose();
    }, [onClose]);

    const handleActualClose = useCallback(() => {
        onClose();
    }, [onClose]);

    if (!mounted || !isOpen) return null;

    // Back button logic
    const backMap: Partial<Record<ModalView, ModalView>> = {
        "login-role": "login",
        "login-org": "login-role",
        "register-role": "register",
        "register-form": "register-role",
        "register-otp": "register-form",
    };
    const canGoBack = view in backMap;

    // Register step index
    const registerStepMap: Partial<Record<ModalView, number>> = {
        register: 0,
        "register-role": 1,
        "register-form": 2,
        "register-otp": 3,
    };
    const isRegisterFlow = view in registerStepMap;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop - no close on click */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Confirm dialog */}
            {showConfirm && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Thoát đăng ký?</h3>
                        <p className="text-sm text-gray-500 mb-6">Các lựa chọn của bạn sẽ không được lưu.</p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 h-11"
                                onClick={() => setShowConfirm(false)}
                            >
                                Ở lại
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 h-11"
                                onClick={handleConfirmClose}
                            >
                                Thoát
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            <div className="relative w-full max-w-[546px] bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {/* Header buttons */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-8 pt-6 bg-white rounded-t-2xl">
                    {canGoBack ? (
                        <button
                            onClick={() => setView(backMap[view]!)}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Quay lại"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </button>
                    ) : (
                        <div />
                    )}
                    <button
                        onClick={handleRequestClose}
                        className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Đóng"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-10 pb-8 pt-2">
                    {/* Logo */}
                    <div className={cn("text-center", isRegisterFlow ? "mb-4" : "mb-6")}>
                        <h1 className="text-3xl font-bold text-primary-600">ForteX</h1>
                        <p className="text-xs tracking-[0.2em] text-muted-foreground mt-1 uppercase">
                            Learn · Leap · Lead
                        </p>
                    </div>

                    {/* Register progress - between logo and form */}
                    {isRegisterFlow && (
                        <StepProgress currentStep={registerStepMap[view]!} />
                    )}

                    {/* Views */}
                    {view === "login" && (
                        <LoginView
                            onClose={handleActualClose}
                            onSwitchToRegister={() => setView("register")}
                            onLoginSuccess={(nextStep) => {
                                // Defer to next tick to allow Zustand store updates to complete
                                setTimeout(() => {
                                    if (nextStep === "direct") {
                                        // Direct login complete - redirect based on latest active role in store
                                        handleActualClose();
                                        const currentRole = useAuthStore.getState().activeRole;
                                        window.location.href = getRoleHomeRoute(currentRole);
                                    } else if (nextStep === "select-org") {
                                        setView("login-org");
                                    } else {
                                        setView("login-role");
                                    }
                                }, 0);
                            }}
                        />
                    )}
                    {view === "login-role" && (
                        <LoginRoleView
                            onNext={() => setView("login-org")}
                            onComplete={handleActualClose}
                        />
                    )}
                    {view === "login-org" && (
                        <LoginOrgView onClose={handleActualClose} />
                    )}
                    {view === "register" && (
                        <RegisterMethodView
                            onSwitchToLogin={() => setView("login")}
                            onEmailSelected={() => setView("register-role")}
                        />
                    )}
                    {view === "register-role" && (
                        <RegisterRoleView onNext={() => setView("register-form")} />
                    )}
                    {view === "register-form" && (
                        <RegisterFormView
                            onSwitchToLogin={() => setView("login")}
                            onNext={(email) => {
                                setRegisterEmail(email);
                                setView("register-otp");
                            }}
                        />
                    )}
                    {view === "register-otp" && (
                        <RegisterOtpView
                            email={registerEmail}
                            onSuccess={() => setView("register-success")}
                        />
                    )}
                    {view === "register-success" && (
                        <RegisterSuccessView
                            onLogin={() => setView("login")}
                            onClose={handleActualClose}
                        />
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

// ─── LOGIN VIEW ─────────────────────────────────────────────────────────────

function LoginView({
    onClose,
    onSwitchToRegister,
    onLoginSuccess,
}: {
    onClose: () => void;
    onSwitchToRegister: () => void;
    onLoginSuccess: (nextStep: "direct" | "select-role" | "select-org") => void;
}) {
    const loginMutation = useLogin();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate(
            { email, password, device_info: getDeviceInfo() },
            {
                onSuccess: (response) => {
                    const data = response.data;

                    // Always show role selection if user has roles
                    // Even single-role users should see the role picker for clarity
                    if (data.system_roles && data.system_roles.length >= 1) {
                        onLoginSuccess("select-role");
                        return;
                    }

                    // requires_org_selection → needs org selection
                    if (data.requires_org_selection) {
                        onLoginSuccess("select-org");
                        return;
                    }

                    // Fallback: direct login (no roles returned)
                    onLoginSuccess("direct");
                },
            }
        );
    };

    return (
        <>
            <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">Đăng nhập</h2>
            <p className="mb-6 text-center text-sm text-gray-500">Chào mừng bạn quay trở lại</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    type="email"
                    label="Email"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    required
                />
                <Input
                    type="password"
                    label="Mật khẩu"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                    required
                />
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Nhớ mật khẩu
                    </label>
                    <Link
                        href={AUTH_ROUTES.FORGOT_PASSWORD}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        onClick={onClose}
                    >
                        Quên mật khẩu?
                    </Link>
                </div>
                <Button type="submit" className="h-12 w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">hoặc đăng nhập với</span>
                <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Social icons only - no text */}
            <div className="flex justify-center gap-4">
                {(["google", "facebook", "apple", "github"] as const).map((provider) => (
                    <SocialLoginButton key={provider} provider={provider} onClick={showComingSoon} iconOnly />
                ))}
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
                Chưa có tài khoản?{" "}
                <button type="button" onClick={onSwitchToRegister} className="font-medium text-primary-600 hover:text-primary-700">
                    Đăng ký
                </button>
            </p>
        </>
    );
}

// ─── LOGIN ROLE VIEW ────────────────────────────────────────────────────────

const roleRoutes: Record<RoleType, string> = {
    student: AUTH_ROUTES.LOGIN_ORGANIZATION,
    parent: AUTH_ROUTES.LOGIN_CHILDREN,
    teacher: AUTH_ROUTES.LOGIN_ORGANIZATION,
    admin: AUTH_ROUTES.LOGIN_ORGANIZATION,
};

function LoginRoleView({ onNext, onComplete }: { onNext: () => void; onComplete: () => void }) {
    const router = useRouter();
    const { systemRoles, sessionToken, token, setActiveRole, setPermissions } = useAuthStore();
    const selectProfile = useSelectProfile();
    const qc = useQueryClient();
    const [selectedRole, setSelectedRole] = useState<SystemRole | null>(null);
    const [isAutoNavigating, setIsAutoNavigating] = useState(false);

    // Ensure systemRoles is always an array (memoized to prevent useEffect dependency issues)
    const roles = useMemo(() => systemRoles ?? [], [systemRoles]);

    // Login already completed (1 role, 0 orgs) → token already set, no sessionToken
    const isAlreadyCompleted = !!token && !sessionToken;

    // Initialize selected role after mount
    useEffect(() => {
        if (roles.length > 0 && !selectedRole) {
            setSelectedRole(roles[0]);
        }
    }, [roles, selectedRole]);

    // Auto-navigate when login is already completed
    useEffect(() => {
        if (isAlreadyCompleted && selectedRole && !isAutoNavigating) {
            setIsAutoNavigating(true);
            setActiveRole(normalizeRole(selectedRole.name));
            authService.getMe()
                .then((me) => setPermissions(me.permissions as Permission[]))
                .catch(() => { /* Non-critical */ })
                .finally(() => {
                    qc.invalidateQueries({ queryKey: authKeys.all });
                    onComplete();
                    router.push(getRoleHomeRoute(selectedRole?.name));
                });
        }
    }, [isAlreadyCompleted, selectedRole, isAutoNavigating, setActiveRole, setPermissions, qc, onComplete, router]);

    const handleContinue = async () => {
        if (!selectedRole || isAutoNavigating) return;

        // Need to call selectProfile with session token
        try {
            await selectProfile.mutateAsync(selectedRole.id);
            setActiveRole(normalizeRole(selectedRole.name));
            onNext();
        } catch (error) {
            console.error("Failed to select profile:", error);
        }
    };

    return (
        <>
            <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
                Đăng nhập với tư cách:
            </h2>
            <p className="mb-6 text-center text-sm text-gray-500">Chọn vai trò của bạn để tiếp tục</p>

            <div className="space-y-3" role="radiogroup" aria-label="Chọn vai trò">
                {roles.length > 0 ? (
                    roles.map((role) => (
                        <RoleCard
                            key={role.id}
                            role={role.name.toLowerCase() as RoleType}
                            selected={selectedRole?.id === role.id}
                            onClick={() => setSelectedRole(role)}
                        />
                    ))
                ) : (
                    <p className="text-center text-sm text-gray-500">
                        Không tìm thấy vai trò nào. Vui lòng đăng nhập lại.
                    </p>
                )}
            </div>

            <Button
                onClick={handleContinue}
                disabled={!selectedRole || selectProfile.isPending || isAutoNavigating}
                className="mt-6 h-12 w-full"
            >
                {(selectProfile.isPending || isAutoNavigating) ? "Đang xử lý..." : "Tiếp tục"}
            </Button>
        </>
    );
}

// ─── LOGIN ORG VIEW ─────────────────────────────────────────────────────────

function LoginOrgView({ onClose }: { onClose: () => void }) {
    const { organizations, setActiveOrg } = useAuthStore();
    const selectOrg = useSelectOrg();
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

    const handleContinue = async () => {
        if (!selectedOrgId) return;
        try {
            await selectOrg.mutateAsync({ organization_id: selectedOrgId });
            const org = organizations.find((o) => o.id === selectedOrgId);
            if (org) {
                setActiveOrg({ id: org.id, name: org.name });
            }
            onClose();
        } catch (error) {
            console.error("Failed to select organization:", error);
        }
    };

    return (
        <>
            <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
                Chọn tổ chức của bạn
            </h2>
            <p className="mb-6 text-center text-sm text-gray-500">
                Chọn tổ chức bạn muốn đăng nhập
            </p>

            <div className="space-y-3" role="radiogroup" aria-label="Chọn tổ chức">
                {organizations.length > 0 ? (
                    organizations.map((org) => (
                        <SelectionCard
                            key={org.id}
                            selected={selectedOrgId === org.id}
                            onClick={() => setSelectedOrgId(org.id)}
                            avatar={org.code?.slice(0, 2) || org.name.slice(0, 2)}
                            title={org.name}
                            subtitle={org.code || ""}
                        />
                    ))
                ) : (
                    <p className="text-center text-sm text-gray-500">
                        Không tìm thấy tổ chức nào.
                    </p>
                )}

                {/* Add new profile / org button */}
                <button
                    type="button"
                    onClick={() => showComingSoon()}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 px-5 py-4 text-sm font-medium text-gray-500 transition-all hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50"
                >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span>Thêm hồ sơ mới</span>
                </button>
            </div>

            <Button
                onClick={handleContinue}
                disabled={!selectedOrgId || selectOrg.isPending}
                className="mt-6 h-12 w-full"
            >
                {selectOrg.isPending ? "Đang xử lý..." : "Tiếp tục"}
            </Button>
        </>
    );
}

// ─── REGISTER METHOD VIEW ───────────────────────────────────────────────────

function RegisterMethodView({
    onSwitchToLogin,
    onEmailSelected,
}: {
    onSwitchToLogin: () => void;
    onEmailSelected: () => void;
}) {
    return (
        <>
            <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
                Đăng ký tài khoản
            </h2>
            <p className="mb-6 text-center text-sm text-gray-500">Chọn phương thức đăng ký</p>

            <div className="space-y-3">
                <SocialLoginButton provider="google" onClick={showComingSoon} />
                <SocialLoginButton provider="facebook" onClick={showComingSoon} />
                <SocialLoginButton provider="apple" onClick={showComingSoon} />
                <SocialLoginButton provider="github" onClick={showComingSoon} />
                <SocialLoginButton provider="email" onClick={onEmailSelected} />
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
                Bạn đã có tài khoản?{" "}
                <button type="button" onClick={onSwitchToLogin} className="font-medium text-primary-600 hover:text-primary-700">
                    Đăng nhập
                </button>
            </p>
        </>
    );
}

// ─── REGISTER ROLE VIEW ─────────────────────────────────────────────────────

function RegisterRoleView({ onNext }: { onNext: () => void }) {
    const setRegisterRole = useAuthStore((s) => s.setRegisterRole);
    const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);

    const handleContinue = () => {
        if (!selectedRole) return;
        setRegisterRole(selectedRole);
        onNext();
    };

    return (
        <>
            <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
                Bạn sử dụng hệ thống với vai trò
            </h2>
            <p className="mb-6 text-center text-sm text-gray-500">Chọn vai trò phù hợp với bạn</p>

            <div className="space-y-3" role="radiogroup" aria-label="Chọn vai trò">
                {(["student", "parent", "teacher", "admin"] as RoleType[]).map((role) => (
                    <RoleCard
                        key={role}
                        role={role}
                        selected={selectedRole === role}
                        onClick={() => setSelectedRole(role)}
                    />
                ))}
            </div>

            <Button onClick={handleContinue} disabled={!selectedRole} className="mt-6 h-12 w-full">
                Tiếp tục
            </Button>
        </>
    );
}

// ─── REGISTER FORM VIEW ─────────────────────────────────────────────────────

function RegisterFormView({
    onSwitchToLogin,
    onNext,
}: {
    onSwitchToLogin: () => void;
    onNext: (email: string) => void;
}) {
    const registerRequest = useRegisterRequest();
    const registerRole = useAuthStore((s) => s.registerRole);
    const [formData, setFormData] = useState({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError("Mật khẩu không khớp");
            return;
        }

        if (formData.password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
            setError(`Mật khẩu phải có ít nhất ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} ký tự`);
            return;
        }

        try {
            // Resolve role ID from selected role
            let roleId = "";
            if (registerRole) {
                const backendRoleName = ROLE_NAME_MAP[registerRole] || registerRole.toUpperCase();
                const systemRoles = await roleService.listSystemRoles();
                const matched = systemRoles.find((r) => r.name === backendRoleName);
                if (matched) {
                    roleId = matched.id;
                }
            }

            await registerRequest.mutateAsync({
                email: formData.email,
                password: formData.password,
                confirm_password: formData.confirmPassword,
                user_name: formData.username,
                full_name: `${formData.lastName} ${formData.firstName}`.trim(),
                role_id: roleId,
            });
            sessionStorage.setItem(STORAGE_KEYS.REGISTER_EMAIL, formData.email);
            onNext(formData.email);
        } catch (err) {
            console.error("Failed to request OTP:", err);
            setError("Đăng ký thất bại. Vui lòng thử lại.");
        }
    };

    return (
        <>
            <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
                Đăng ký tài khoản
            </h2>
            <p className="mb-6 text-center text-sm text-gray-500">Điền thông tin của bạn</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Tên đăng nhập"
                    placeholder="username"
                    value={formData.username}
                    onChange={handleChange("username")}
                    className="h-12"
                    required
                />
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="Họ"
                        placeholder="Nguyễn"
                        value={formData.lastName}
                        onChange={handleChange("lastName")}
                        className="h-12"
                        required
                    />
                    <Input
                        label="Tên"
                        placeholder="Văn A"
                        value={formData.firstName}
                        onChange={handleChange("firstName")}
                        className="h-12"
                        required
                    />
                </div>
                <Input
                    type="email"
                    label="Email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleChange("email")}
                    className="h-12"
                    required
                />
                <Input
                    type="password"
                    label="Mật khẩu"
                    placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
                    value={formData.password}
                    onChange={handleChange("password")}
                    className="h-12"
                    required
                />
                <Input
                    type="password"
                    label="Xác nhận mật khẩu"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    className="h-12"
                    required
                />

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button type="submit" className="h-12 w-full" disabled={registerRequest.isPending}>
                    {registerRequest.isPending ? "Đang gửi mã..." : "Tiếp tục"}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
                Bạn đã có tài khoản?{" "}
                <button type="button" onClick={onSwitchToLogin} className="font-medium text-primary-600 hover:text-primary-700">
                    Đăng nhập
                </button>
            </p>
        </>
    );
}

// ─── REGISTER OTP VIEW ──────────────────────────────────────────────────────

function RegisterOtpView({ email, onSuccess }: { email: string; onSuccess: () => void }) {
    const register = useRegister();

    const handleComplete = async (otpCode: string) => {
        const storedEmail = email || sessionStorage.getItem(STORAGE_KEYS.REGISTER_EMAIL);
        if (!storedEmail) return;

        try {
            await register.mutateAsync({ email: storedEmail, otp: otpCode });
            sessionStorage.removeItem(STORAGE_KEYS.REGISTER_EMAIL);
            onSuccess();
        } catch (error) {
            console.error("Registration failed:", error);
        }
    };

    return (
        <div className="flex flex-col items-center py-4">
            <AuthIconHeader
                icon={<MailIcon size={32} className="text-primary-500" />}
                title="Xác thực OTP"
                description={`Nhập mã 6 chữ số đã được gửi đến ${email}`}
                className="mb-8"
            />
            <OtpInput onComplete={handleComplete} countdown={90} />
            {register.isPending && (
                <p className="mt-4 text-sm text-muted-foreground">Đang xử lý...</p>
            )}
        </div>
    );
}

// ─── REGISTER SUCCESS VIEW ──────────────────────────────────────────────────

function RegisterSuccessView({ onLogin, onClose }: { onLogin: () => void; onClose: () => void }) {
    return (
        <div className="flex flex-col items-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 className="mb-1 text-xl font-semibold text-gray-900">Đăng ký thành công!</h2>
            <p className="mb-6 text-center text-sm text-gray-500">
                Tài khoản của bạn đã được tạo. Hãy đăng nhập để bắt đầu.
            </p>
            <Button onClick={onLogin} className="h-12 w-full">
                Đăng nhập ngay
            </Button>
        </div>
    );
}
