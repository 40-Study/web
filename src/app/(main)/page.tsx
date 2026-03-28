"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  MessageSquare,
  Code,
  Activity,
  Cpu,
  BarChart,
  Target,
  Smartphone,
  CheckCircle2,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { siteConfig } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth.store";
import { AnimatedShowcasePanel } from "@/components/landing/animated-showcase-panel";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  // Redirect authenticated users to /home
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/home");
    }
  }, [isAuthenticated, router]);

  // Show nothing while checking auth (avoid flash)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full overflow-x-hidden">
      {/* 3. Hero Section */}
          <section className="relative px-6 py-16 md:py-24 lg:py-32 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 scale-150 bg-primary-400/20 blur-3xl rounded-full pointer-events-none -z-10" />
            
            <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary-200 bg-primary-50/50 text-primary-700 text-xs font-bold tracking-wider rounded-full backdrop-blur-sm">
              NỀN TẢNG HỌC TẬP THÍCH ỨNG
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              <span className="block text-slate-900">Khai phóng Tiềm năng</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">Công nghệ của bạn</span>
            </h1>
            
            <p className="max-w-2xl text-lg md:text-xl text-slate-500 mb-10 leading-relaxed">
              Hệ thống giáo dục cá nhân hóa với trợ lý ảo AI, giúp bạn làm chủ lập trình và thiết kế thông qua các dự án thực tế.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto">
              <Button
                size="lg"
                asChild
                className="group bg-primary-600 hover:bg-primary-700 text-white px-8 h-14 text-base font-semibold shadow-lg shadow-primary-500/20 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-primary-500/30"
              >
                <Link href="/courses" className="inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Khám phá các khóa học
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="group px-8 h-14 text-base font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200 hover:border-primary-300 hover:text-primary-700"
              >
                <Link href="#student-projects" className="inline-flex items-center gap-2">
                  Xem dự án học viên
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            {/* Animated Showcase Panel */}
            <AnimatedShowcasePanel />
          </section>

          {/* 4. Student Outcomes Section */}
          <section id="student-projects" className="py-20 px-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-100 flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/3 space-y-6">
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                  Học viên ForteX đã tự xây dựng:
                </h2>
                <p className="text-slate-500 text-lg">
                  Từ những ứng dụng nhỏ đầu tiên đến các nền tảng phức tạp có hàng nghìn người dùng thực tế.
                </p>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-slate-600">+10,000 học viên</span>
                </div>
              </div>
              
              <div className="lg:w-2/3 w-full bg-primary-600 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400 rounded-full blur-3xl opacity-50 mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-400 rounded-full blur-3xl opacity-50 mix-blend-screen" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  {/* Mobile App Mockup */}
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col" style={{ aspectRatio: '9/16' }}>
                    <div className="bg-slate-100 h-12 w-full flex items-center justify-between px-4">
                      <div className="w-1/3 h-3 bg-slate-200 rounded-full" />
                      <div className="w-6 h-6 rounded-full bg-slate-200" />
                    </div>
                    <div className="p-4 flex-1 space-y-4">
                      <div className="w-full h-32 bg-slate-100 rounded-lg" />
                      <div className="w-3/4 h-4 bg-slate-200 rounded-full" />
                      <div className="w-1/2 h-4 bg-slate-200 rounded-full" />
                    </div>
                  </div>
                  
                  {/* Dashboard Mockup */}
                  <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden flex flex-col transform md:translate-y-8" style={{ aspectRatio: '9/16' }}>
                    <div className="p-4 flex items-center gap-2 border-b border-slate-800">
                      <Activity className="w-4 h-4 text-primary-400" />
                      <div className="w-20 h-2 bg-slate-700 rounded-full" />
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex items-end gap-2 h-24">
                        <div className="flex-1 bg-primary-500/20 rounded-t-sm h-1/3" />
                        <div className="flex-1 bg-primary-500/40 rounded-t-sm h-2/3" />
                        <div className="flex-1 bg-primary-500 rounded-t-sm h-full" />
                        <div className="flex-1 bg-primary-500/60 rounded-t-sm h-3/4" />
                      </div>
                      <div className="w-full h-12 bg-slate-800 rounded-lg" />
                    </div>
                  </div>
                  
                  {/* Game Mockup */}
                  <div className="bg-indigo-950 rounded-xl shadow-xl overflow-hidden border-2 border-indigo-500/30 flex flex-col" style={{ aspectRatio: '9/16' }}>
                    <div className="flex-1 p-4 flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 bg-pink-500 rounded-lg shadow-lg shadow-pink-500/50 rotate-12" />
                      <div className="w-24 h-6 bg-indigo-800 rounded-full" />
                    </div>
                    <div className="h-16 bg-indigo-900/50 flex items-center justify-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-800" />
                      <div className="w-8 h-8 rounded-full bg-indigo-800" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Feature Cards */}
          <section className="py-20 px-6 max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Hệ sinh thái học tập toàn diện</h2>
              <p className="text-slate-500">Mọi công cụ bạn cần để tiến xa hơn trên con đường phát triển sự nghiệp.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Dark */}
              <div className="bg-slate-900 rounded-3xl p-8 lg:p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6">
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-primary-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                </div>
                <div className="relative z-10 w-2/3 pt-4">
                  <h3 className="text-2xl font-bold mb-4">Trợ giảng ảo<br />AI 24/7</h3>
                  <p className="text-slate-400 mb-8">Giải đáp thắc mắc, sửa lỗi code và gợi ý hướng đi lập tức.</p>
                </div>
                
                {/* Chat Mockup */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mt-4 space-y-3 relative z-10 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0" />
                    <div className="bg-slate-700 rounded-2xl rounded-tl-none p-3 text-sm text-slate-300">
                      Làm sao để center một div bằng Tailwind?
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex-shrink-0 flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-primary-600 rounded-2xl rounded-tr-none p-3 text-sm text-white">
                      Bạn có thể dùng `flex items-center justify-center` trên thẻ cha.
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Light */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 lg:p-10 relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 p-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500">
                    <BarChart className="w-6 h-6" />
                  </div>
                </div>
                <div className="relative z-10 w-2/3 pt-4">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Tối ưu<br />Nhịp độ học</h3>
                  <p className="text-slate-500 mb-8">Phân tích dữ liệu học tập để đưa ra gợi ý phù hợp với khả năng.</p>
                </div>
                
                {/* Chart Mockup */}
                <div className="flex items-end gap-3 mt-12 h-32 px-4 relative z-10">
                  {[40, 70, 45, 90, 60, 100, 80].map((height, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-t-md transition-all duration-700 ${i === 3 || i === 5 ? 'bg-orange-500' : 'bg-slate-100'}`}
                      style={{ height: `${height}%`, transitionDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>

              {/* Card 3: Light Blue */}
              <div className="bg-primary-50 border border-primary-100 rounded-3xl p-8 lg:p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm">
                    <Target className="w-6 h-6" />
                  </div>
                </div>
                <div className="relative z-10 w-2/3 pt-4">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 uppercase tracking-tight">LỘ TRÌNH THÍCH ỨNG</h3>
                  <p className="text-slate-600 mb-8">Nội dung tự động điều chỉnh theo kết quả của từng bài kiểm tra.</p>
                </div>
                
                {/* Tracker Mockup */}
                <div className="bg-white rounded-xl p-5 shadow-sm mt-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <div className="flex-1">
                      <div className="w-1/2 h-3 bg-slate-200 rounded-full mb-2" />
                      <div className="w-1/3 h-2 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full border-2 border-orange-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                    </div>
                    <div className="flex-1">
                      <div className="w-3/4 h-3 bg-slate-800 rounded-full mb-2" />
                      <div className="w-1/2 h-2 bg-slate-200 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 opacity-50">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                    <div className="flex-1">
                      <div className="w-2/3 h-3 bg-slate-200 rounded-full mb-2" />
                      <div className="w-1/4 h-2 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: White */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 lg:p-10 relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 p-6">
                  <div className="w-12 h-12 bg-secondary-100 rounded-2xl flex items-center justify-center text-secondary-600">
                    <Smartphone className="w-6 h-6" />
                  </div>
                </div>
                <div className="relative z-10 w-2/3 pt-4">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Đồng hành cùng<br />Phụ huynh</h3>
                  <p className="text-slate-500 mb-8">Theo dõi tiến độ, nhận thông báo ngay trên ứng dụng di động.</p>
                </div>
                
                {/* Notification Mockup */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-8 translate-y-2 group-hover:-translate-y-2 transition-transform duration-500">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-primary-600 font-bold">
                      40
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">Cập nhật tiến độ</h4>
                      <p className="text-slate-500 text-sm mt-1">Minh đã hoàn thành dự án &quot;Web Portfolio&quot; với điểm số xuất sắc!</p>
                      <span className="text-xs text-slate-400 mt-2 block">Vài giây trước</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Instructor CTA Section */}
          <section className="py-20 px-6 max-w-7xl mx-auto">
            <div className="bg-slate-900 rounded-3xl relative overflow-hidden p-10 md:p-16 lg:p-20 flex flex-col md:flex-row items-center gap-12">
              {/* Background Shapes */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-600 rounded-full blur-3xl opacity-40 scale-150" />
                <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-secondary-600 rounded-full blur-3xl opacity-30 scale-150" />
                <div className="absolute top-1/4 right-1/4 w-32 h-32 border border-slate-700 rotate-45 rounded-xl opacity-20" />
                <div className="absolute bottom-1/4 right-10 w-16 h-16 border-2 border-primary-500/20 rounded-full" />
              </div>

              <div className="flex-1 relative z-10">
                <Badge variant="outline" className="mb-6 px-4 py-1.5 border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold tracking-wider rounded-full">
                  DÀNH CHO CHUYÊN GIA
                </Badge>
                <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                  Trở thành<br />
                  Giảng viên Cộng tác.
                </h2>
                <p className="text-slate-400 text-lg mb-10 max-w-md">
                  Chia sẻ kiến thức, mở rộng tầm ảnh hưởng và tạo nguồn thu nhập thụ động cùng nền tảng giáo dục thế hệ mới.
                </p>
                <Button size="lg" className="bg-white hover:bg-slate-100 text-slate-900 px-8 h-14 text-base font-semibold rounded-xl">
                  Đăng ký Hồ sơ ngay
                </Button>
              </div>

              <div className="flex-1 w-full max-w-sm relative z-10">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-white font-medium">Thu nhập tháng này</span>
                    <span className="text-green-400 text-sm font-semibold">+24.5%</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-8">
                    18,500,000<span className="text-xl text-slate-400 font-normal ml-1">đ</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2 text-slate-300">
                        <span>Lượt đăng ký mới</span>
                        <span className="text-white font-medium">142</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-primary-400 h-2 rounded-full w-2/3" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2 text-slate-300">
                        <span>Đánh giá 5 sao</span>
                        <span className="text-white font-medium">98%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full w-11/12" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 7. Footer */}
          <footer className="bg-slate-950 text-slate-400 pt-20 pb-10 px-6 mt-10 border-t border-slate-900">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
              {/* Brand Col */}
              <div className="space-y-6">
                <Link href="/" className="flex items-center gap-2 text-white">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    40
                  </div>
                  <span className="text-xl font-bold tracking-tight">ForteX</span>
                </Link>
                <p className="text-sm leading-relaxed">
                  {siteConfig.description}
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <a href={siteConfig.links.facebook} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors">
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Links Col 1 */}
              <div>
                <h4 className="text-white font-semibold mb-6">Về chúng tôi</h4>
                <ul className="space-y-4 text-sm">
                  <li><a href="#" className="hover:text-primary-400 transition-colors">Giới thiệu ForteX</a></li>
                  <li><a href="#" className="hover:text-primary-400 transition-colors">Tuyển dụng</a></li>
                  <li><a href="#" className="hover:text-primary-400 transition-colors">Tin tức & Blog</a></li>
                  <li><a href="#" className="hover:text-primary-400 transition-colors">Liên hệ</a></li>
                </ul>
              </div>

              {/* Links Col 2 */}
              <div>
                <h4 className="text-white font-semibold mb-6">Học tập</h4>
                <ul className="space-y-4 text-sm">
                  <li><a href="#" className="hover:text-primary-400 transition-colors">Khóa học Lập trình</a></li>
                  <li><a href="#" className="hover:text-primary-400 transition-colors">Khóa học Thiết kế</a></li>
                  <li><a href="#" className="hover:text-primary-400 transition-colors">Chương trình Bootcamp</a></li>
                  <li><a href="#" className="hover:text-primary-400 transition-colors">Dự án Mẫu</a></li>
                </ul>
              </div>

              {/* Newsletter Col */}
              <div>
                <h4 className="text-white font-semibold mb-6">Đăng ký nhận tin</h4>
                <p className="text-sm mb-4">Nhận thông báo về các khóa học mới và ưu đãi đặc biệt.</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      placeholder="Email của bạn" 
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <Button className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4">
                    Gửi
                  </Button>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <p>© {new Date().getFullYear()} ForteX. Đã đăng ký bản quyền.</p>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a>
                <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
              </div>
            </div>
          </footer>
    </div>
  );
}
