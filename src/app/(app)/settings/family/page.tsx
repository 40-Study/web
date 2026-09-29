"use client";

/**
 * Family Settings Page - Beautiful design for parent-student connection
 */

import { useState } from "react";
import {
  UserPlus, Eye, Bell, MessageCircle, Mail, Users, HeartHandshake, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InviteParentModal, SentInvitationsList, PendingInvitationsCard, LinkChildForm, SentLinkRequests,
  LinkedChildrenList, IncomingLinkRequestsCard, LinkedParentsList,
} from "@/components/parent";
import { useSentInvitations } from "@/hooks/queries/use-invitation";
import { useLinkedParents } from "@/hooks/queries/use-parent-link";
import { useAuthStore } from "@/stores/auth.store";
import { normalizeRole } from "@/lib/routes";
import { siteConfig } from "@/lib/constants";

const features = [
  {
    icon: <Eye className="w-6 h-6" />,
    title: "Theo dõi tiến độ",
    description: "Phụ huynh có thể xem chi tiết tiến độ học tập, điểm số và các chỉ số quan trọng của bạn trên nền tảng theo thời gian thực.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: "Nhận thông báo",
    description: "Cập nhật cho họ về kết quả thi, thông báo từ trường học và các sự kiện, chương trình quan trọng dành cho gia đình.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "Kết nối giáo viên",
    description: "Mở kênh liên lạc trực tiếp và bảo mật giữa phụ huynh và đội ngũ giáo viên, nhằm hỗ trợ tối đa cho việc học tập.",
    color: "bg-green-50 text-green-600",
  },
];

/**
 * Trang "Gia đình" cho vai PHỤ HUYNH — QA 260927 P0: trước đây trang này
 * hiển thị y hệt luồng "học sinh mời phụ huynh" (copy "Mời phụ huynh", "Phụ
 * huynh có thể xem...") cho cả phụ huynh đang xem, không có danh sách con
 * hay link xem tiến độ nào. `FamilyConnectionCard` (widget nhỏ cho sidebar)
 * đã viết đúng logic PARENT nhưng chưa từng được lắp vào trang nào — ở đây
 * dựng lại thành nội dung TRANG ĐẦY ĐỦ (không dùng thẳng card đó vì nó có
 * link "Xem tất cả" trỏ về chính /settings/family — vòng lặp nếu đặt tại đây).
 */
function ParentFamilyView() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-6 py-10 lg:py-12">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Con của tôi
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                Theo dõi tiến độ học tập, điểm số và chuyên cần của con — kết nối cùng
                hành trình học tập tại {siteConfig.name}.
              </p>
            </div>

            <div className="w-full max-w-sm lg:max-w-md flex-shrink-0">
              <div
                role="img"
                aria-label="Phụ huynh theo dõi tiến độ học tập của con"
                className="relative aspect-[4/3] rounded-card overflow-hidden shadow-2xl ring-1 ring-primary-100 bg-gradient-to-br from-primary-100 via-primary-50 to-secondary-100 dark:from-primary-950 dark:via-neutral-900 dark:to-secondary-950 flex items-center justify-center"
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" aria-hidden="true" />
                <div className="absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-secondary-200/40 blur-2xl" aria-hidden="true" />
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-primary-100">
                  <HeartHandshake className="h-14 w-14 text-primary-600" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lời mời từ con đang chờ chấp nhận — PendingInvitationsCard tự chỉ fetch
          khi vai trò là PARENT (usePendingInvitations), giữ nguyên như cũ. */}
      <div className="max-w-4xl mx-auto px-6 pt-10 lg:pt-12 space-y-6">
        <PendingInvitationsCard />
        {/* Q4 (QA vòng 2): phụ huynh tự gửi yêu cầu liên kết, con xác nhận. */}
        <LinkChildForm />
        <SentLinkRequests />
      </div>

      {/* Danh sách con đã liên kết */}
      <div className="max-w-4xl mx-auto px-6 pt-8 pb-12">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Danh sách con</h2>
        <LinkedChildrenList />
      </div>
    </div>
  );
}

/** Trang "Gia đình" cho vai HỌC SINH — luồng mời phụ huynh (giữ nguyên như cũ). */
function StudentFamilyView() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { data: sentInvitations = [], isLoading: isLoadingInvitations } = useSentInvitations();
  // Review #38 W1: "đang liên kết" lấy từ quan hệ active (/family/parents), không suy từ lời mời
  // "accepted" — lời mời không biết liên kết đã bị huỷ hay được tạo qua yêu cầu của phụ huynh.
  const {
    data: linkedParents = [], isLoading: isLoadingParents, isError: isParentsError,
  } = useLinkedParents();
  const isLoading = isLoadingInvitations || isLoadingParents;

  const pendingInvitations = sentInvitations.filter((inv) =>
    ["pending", "invited"].includes(inv.status)
  );
  // Empty state chỉ khi thật sự chưa có ai liên kết VÀ không có lời mời nào đang chờ. Khi không
  // đọc được /family/parents thì KHÔNG biết có ai liên kết hay không, nên không được khẳng định
  // "chưa kết nối" (review #38 vòng 2, W-a) — LinkedParentsList đã hiện lỗi kèm "Thử lại".
  const isEmpty = !isParentsError && linkedParents.length === 0 && pendingInvitations.length === 0;
  const hasInvitations = sentInvitations.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-6 py-10 lg:py-12">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Gia đình
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                Kết nối cha mẹ với hành trình học tập của bạn. Chia sẻ tiến độ, nhận sự khích lệ và cùng nhau xây dựng lộ trình thành công tại {siteConfig.name}.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="h-12 px-6 rounded-xl text-base"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Mời phụ huynh
                </Button>
                <Button
                  variant="outline"
                  className="h-12 px-6 rounded-xl text-base"
                  onClick={() => {
                    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Tìm hiểu thêm
                </Button>
              </div>
            </div>

            {/* Hero visual — khối trang trí tự chứa, không dùng asset ngoài */}
            <div className="w-full max-w-sm lg:max-w-md flex-shrink-0">
              <div
                role="img"
                aria-label="Phụ huynh và con học cùng nhau"
                className="relative aspect-[4/3] rounded-card overflow-hidden shadow-2xl ring-1 ring-primary-100 bg-gradient-to-br from-primary-100 via-primary-50 to-secondary-100 dark:from-primary-950 dark:via-neutral-900 dark:to-secondary-950 flex items-center justify-center"
              >
                {/* Vòng tròn nền giúp khối không bị trống khi phóng to; icon giữ vai trò minh hoạ. */}
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" aria-hidden="true" />
                <div className="absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-secondary-200/40 blur-2xl" aria-hidden="true" />
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-primary-100">
                  <HeartHandshake className="h-14 w-14 text-primary-600" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-4xl mx-auto px-6 py-10 lg:py-12">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Đặc quyền dành cho phụ huynh
          </h2>
          <p className="text-slate-500">
            Khi được kết nối, phụ huynh sẽ có thể
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-primary-100 hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                {feature.icon}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations for Parents */}
      <div className="max-w-4xl mx-auto px-6">
        <PendingInvitationsCard className="mb-6" />
        {/* Q4: yêu cầu liên kết phụ huynh gửi tới — con tự xác nhận/từ chối; và phụ huynh đang
            liên kết (có huỷ liên kết). */}
        <IncomingLinkRequestsCard className="mb-6" />
        <LinkedParentsList className="mb-6" />
      </div>

      {/* Invitations Section */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            </div>
          ) : !isEmpty ? (
            hasInvitations && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <SentInvitationsList onInviteClick={() => setIsInviteModalOpen(true)} />
              </div>
            )
          ) : (
            /* Empty State */
            <div className="bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-100 p-10 text-center">
              <div className="max-w-md mx-auto">
                {/* Illustration */}
                <div className="relative w-28 h-28 mx-auto mb-6">
                  <div className="absolute inset-0 bg-primary-100 rounded-full" />
                  <div className="absolute inset-3 bg-primary-50 rounded-full flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary-500" />
                  </div>
                  {/* Decorative dots */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-300 rounded-full" />
                  <div className="absolute -bottom-1 -left-2 w-2.5 h-2.5 bg-green-300 rounded-full" />
                </div>

                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Chưa có lời mời nào
                </h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  Hiện tại bạn chưa kết nối với thành viên gia đình nào. Hãy bắt đầu bằng việc gửi lời mời qua email hoặc số điện thoại.
                </p>

                <Button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="h-11 px-6 rounded-full text-base"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Mời phụ huynh ngay
                </Button>

                <p className="mt-5 text-xs text-slate-400">
                  Phụ huynh sẽ nhận email và có hướng dẫn chi tiết để kích hoạt tài khoản theo dõi học tập của bạn.
                </p>
              </div>
            </div>
          )}
      </div>

      {/* Invite Modal */}
      <InviteParentModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}

export default function FamilySettingsPage() {
  const { activeRole } = useAuthStore();
  // QA 260927 P0: rẽ nhánh theo activeRole — trước đây trang luôn render luồng
  // "học sinh mời phụ huynh" bất kể ai đang xem.
  return normalizeRole(activeRole) === "PARENT" ? <ParentFamilyView /> : <StudentFamilyView />;
}
