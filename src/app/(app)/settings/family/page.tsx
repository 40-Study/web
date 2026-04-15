"use client";

/**
 * Family Settings Page - Beautiful design for parent-student connection
 */

import { useState } from "react";
import Image from "next/image";
import { UserPlus, Eye, Bell, MessageCircle, Mail, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteParentModal, SentInvitationsList, PendingInvitationsCard } from "@/components/parent";
import { useSentInvitations } from "@/hooks/queries/use-invitation";
import { useAuthStore } from "@/stores/auth.store";

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

export default function FamilySettingsPage() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { activeRole } = useAuthStore();
  const { data: sentInvitations = [], isLoading } = useSentInvitations();

  const linkedParents = sentInvitations.filter((inv) => inv.status === "accepted");
  const pendingInvitations = sentInvitations.filter((inv) =>
    ["pending", "invited"].includes(inv.status)
  );
  const hasInvitations = linkedParents.length > 0 || pendingInvitations.length > 0;

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
                Kết nối cha mẹ với hành trình học tập của bạn. Chia sẻ tiến độ, nhận sự khích lệ và cùng nhau xây dựng lộ trình thành công tại Fortex.
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

            {/* Hero Image */}
            <div className="w-full max-w-sm lg:max-w-md flex-shrink-0">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/family-learning.jpg"
                  alt="Phụ huynh và con học cùng nhau"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Fallback gradient if image doesn't exist */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <div className="text-center text-white p-6">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-80" />
                    <p className="text-lg font-medium opacity-90">Học cùng gia đình</p>
                  </div>
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
      </div>

      {/* Invitations Section */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            </div>
          ) : hasInvitations ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <SentInvitationsList onInviteClick={() => setIsInviteModalOpen(true)} />
            </div>
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
