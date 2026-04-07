"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ArrowLeft, Mail, UserCheck, FileText, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { AUTH_CONFIG, STORAGE_KEYS } from "@/lib/constants";
import { showComingSoon } from "@/lib/toast-helpers";
import { startOAuthFlow } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SocialLoginButton } from "@/components/auth/social-login-button";
import { RoleCard } from "@/components/auth/role-card";

import { OtpInput } from "@/components/auth/otp-input";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { MailIcon } from "@/components/icons";
import type { RoleType } from "@/components/auth/role-card";
import { useLogin, useRegisterRequest, useRegister, useSelectRole } from "@/hooks/queries/use-auth";
import { authService, getDeviceInfo } from "@/services/auth.service";
import type { UnifiedRole, SystemRoleOption } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { AUTH_ROUTES, getRoleHomeRoute, normalizeRole } from "@/lib/routes";

// ─── Types ──────────────────────────────────────────────────────────────────

type ModalView =
    | "login"
    | "login-role"
    | "login-org"
    | "register"
    | "register-form"
    | "register-otp"
    | "register-success";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: "login" | "register";
}

/** Map backend role_name to RoleCard display type */
function toRoleType(roleName: string): RoleType {
    const name = roleName.toLowerCase();
    if (name.includes("student")) return "student";
    if (name.includes("teacher")) return "teacher";
    if (name.includes("parent")) return "parent";
    if (name.includes("admin") || name.includes("owner")) return "admin";
    return "student";
}

// ─── Progress Bar ───────────────────────────────────────────────────────────

const REGISTER_STEPS = [
    { label: "Phương thức", icon: Mail },
    { label: "Thông tin", icon: FileText },
    { label: "Xác thực", icon: ShieldCheck },
];

function StepProgress({ currentStep }: { currentStep: number }) {
    return (
        <div className="mb-8">
            <p className="text-center text-sm text-gray-500 mb-5">3 bước dễ dàng</p>
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
        "register-form": "register",
        "register-otp": "register-form",
    };
    const canGoBack = view in backMap;

    // Register step index
    const registerStepMap: Partial<Record<ModalView, number>> = {
        register: 0,
        "register-form": 1,
        "register-otp": 2,
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
                                setTimeout(() => {
                                    if (nextStep === "needs-role") {
                                        setView("login-role");
                                    } else if (nextStep === "direct") {
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
                            onEmailSelected={() => setView("register-form")}
                        />
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
    onLoginSuccess: (nextStep: "direct" | "select-role" | "select-org" | "needs-role") => void;
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

                    // User chưa có role → redirect chọn role đăng ký
                    if (data.needs_role_registration) {
                        onLoginSuccess("needs-role");
                        return;
                    }

                    // Direct login (1 role, có access_token) → vào app
                    if (data.access_token && !data.session_token) {
                        onLoginSuccess("direct");
                        return;
                    }

                    // Multi-role → có session_token + roles → chọn role
                    if (data.session_token && data.roles && data.roles.length > 0) {
                        onLoginSuccess("select-role");
                        return;
                    }

                    // Fallback
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
                {(["google", "facebook", "github"] as const).map((provider) => (
                    <SocialLoginButton key={provider} provider={provider} onClick={() => startOAuthFlow(provider)} iconOnly />
                ))}
                <SocialLoginButton provider="apple" onClick={showComingSoon} iconOnly />
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

function LoginRoleView({ onNext: _onNext, onComplete }: { onNext: () => void; onComplete: () => void }) {
    const router = useRouter();
    const { roles: unifiedRoles, sessionToken, token } = useAuthStore();
    const selectRoleMutation = useSelectRole();
    const [selectedRole, setSelectedRole] = useState<UnifiedRole | null>(null);
    const [showAddRole, setShowAddRole] = useState(false);
    const [allSystemRoles, setAllSystemRoles] = useState<SystemRoleOption[]>([]);
    const [selectedSystemRole, setSelectedSystemRole] = useState<SystemRoleOption | null>(null);
    const [loadingRoles, setLoadingRoles] = useState(false);

    const hasRoles = unifiedRoles.length > 0;
    const isAlreadyCompleted = !!token && !sessionToken;

    // 0 roles → fetch all available system roles
    useEffect(() => {
        if (!hasRoles) fetchAllSystemRoles();
    }, [hasRoles]);

    useEffect(() => {
        if (unifiedRoles.length > 0 && !selectedRole) setSelectedRole(unifiedRoles[0]);
    }, [unifiedRoles, selectedRole]);

    // If already logged in with token (direct login), just navigate
    useEffect(() => {
        if (isAlreadyCompleted && !selectRoleMutation.isPending) {
            onComplete();
            const currentRole = useAuthStore.getState().activeRole;
            router.push(getRoleHomeRoute(currentRole));
        }
    }, [isAlreadyCompleted, selectRoleMutation.isPending, onComplete, router]);

    async function fetchAllSystemRoles() {
        setLoadingRoles(true);
        try {
            const data = await authService.getAllSystemRoles();
            setAllSystemRoles(data.system_roles || []);
        } catch { setAllSystemRoles([]); }
        finally { setLoadingRoles(false); }
    }

    const existingRoleNames = unifiedRoles.map((r) => r.role_name.toUpperCase());
    const availableNewRoles = allSystemRoles.filter((r) => !existingRoleNames.includes(r.name.toUpperCase()));
    const isNewRoleMode = !hasRoles || showAddRole;

    const handleContinue = async () => {
        if (selectedRole) {
            selectRoleMutation.mutate(
                { roleId: selectedRole.id, roleType: selectedRole.type, organizationId: selectedRole.organization_id },
                {
                    onSuccess: () => {
                        onComplete();
                    },
                }
            );
        } else if (selectedSystemRole) {
            selectRoleMutation.mutate(
                { roleId: selectedSystemRole.id, roleType: "system" },
                {
                    onSuccess: () => {
                        onComplete();
                    },
                }
            );
        }
    };

    const title = !hasRoles ? "Chọn vai trò của bạn" : showAddRole ? "Thêm vai trò mới" : "Đăng nhập với tư cách:";
    const subtitle = !hasRoles ? "Chọn vai trò để bắt đầu" : showAddRole ? "Chọn vai trò bạn muốn thêm" : "Chọn vai trò của bạn để tiếp tục";

    return (
        <>
            <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">{title}</h2>
            <p className="mb-6 text-center text-sm text-gray-500">{subtitle}</p>

            <div className="space-y-3" role="radiogroup" aria-label="Chọn vai trò">
                {isNewRoleMode ? (
                    loadingRoles ? (
                        <div className="flex justify-center py-4">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                        </div>
                    ) : availableNewRoles.length > 0 ? (
                        availableNewRoles.map((role) => (
                            <RoleCard
                                key={role.id}
                                role={toRoleType(role.name)}
                                selected={selectedSystemRole?.id === role.id}
                                onClick={() => { setSelectedSystemRole(role); setSelectedRole(null); }}
                            />
                        ))
                    ) : (
                        <p className="text-center text-sm text-gray-500">
                            {showAddRole ? "Bạn đã có tất cả vai trò." : "Không tìm thấy vai trò nào."}
                        </p>
                    )
                ) : (
                    unifiedRoles.map((role) => (
                        <RoleCard
                            key={role.id}
                            role={toRoleType(role.role_name)}
                            selected={selectedRole?.id === role.id}
                            onClick={() => { setSelectedRole(role); setSelectedSystemRole(null); }}
                            label={role.display_name}
                            subtitle={role.type === "organization" && role.organization_name ? role.organization_name : undefined}
                        />
                    ))
                )}
            </div>

            <div className="mt-6 space-y-3">
                <Button
                    onClick={handleContinue}
                    disabled={(!selectedRole && !selectedSystemRole) || selectRoleMutation.isPending}
                    className="h-12 w-full"
                >
                    {selectRoleMutation.isPending ? "Đang xử lý..." : "Tiếp tục"}
                </Button>

                {hasRoles && !showAddRole && (
                    <Button variant="outline" onClick={() => { setShowAddRole(true); setSelectedRole(null); if (allSystemRoles.length === 0) fetchAllSystemRoles(); }} className="h-12 w-full">
                        + Thêm vai trò mới
                    </Button>
                )}

                {showAddRole && (
                    <Button variant="outline" onClick={() => { setShowAddRole(false); setSelectedSystemRole(null); setSelectedRole(unifiedRoles[0] || null); }} className="h-12 w-full">
                        Quay lại chọn vai trò
                    </Button>
                )}
            </div>
        </>
    );
}

// ─── LOGIN ORG VIEW ─────────────────────────────────────────────────────────

/**
 * LoginOrgView - DEPRECATED
 * Org selection is now embedded in the unified role selection.
 * Org roles appear as "Role - OrgName" in LoginRoleView.
 */
function LoginOrgView({ onClose }: { onClose: () => void }) {
    const router = useRouter();

    useEffect(() => {
        onClose();
        router.push(getRoleHomeRoute(useAuthStore.getState().activeRole));
    }, [onClose, router]);

    return (
        <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        </div>
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
                <SocialLoginButton provider="google" onClick={() => startOAuthFlow("google")} />
                <SocialLoginButton provider="facebook" onClick={() => startOAuthFlow("facebook")} />
                <SocialLoginButton provider="apple" onClick={showComingSoon} />
                <SocialLoginButton provider="github" onClick={() => startOAuthFlow("github")} />
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

// ─── REGISTER FORM VIEW ─────────────────────────────────────────────────────

function RegisterFormView({
    onSwitchToLogin,
    onNext,
}: {
    onSwitchToLogin: () => void;
    onNext: (email: string) => void;
}) {
    const registerRequest = useRegisterRequest();
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
            await registerRequest.mutateAsync({
                email: formData.email,
                password: formData.password,
                confirm_password: formData.confirmPassword,
                user_name: formData.username,
                full_name: `${formData.lastName} ${formData.firstName}`.trim(),
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
