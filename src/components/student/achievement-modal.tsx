"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { 
  Star, 
  Box, 
  Database, 
  Zap, 
  Flame, 
  Shield, 
  Activity, 
  CalendarDays, 
  Award, 
  CheckCircle2 
} from "lucide-react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";
import { useRouter } from "next/navigation";

interface AchievementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const radarData = [
  { subject: 'FRONTEND', A: 90, fullMark: 100 },
  { subject: 'BACKEND', A: 85, fullMark: 100 },
  { subject: 'SYSTEM', A: 70, fullMark: 100 },
  { subject: 'DATABASE', A: 95, fullMark: 100 },
  { subject: 'CLOUD', A: 98, fullMark: 100 },
];

const heatmapData = Array.from({length: 364}).map((_, i) => {
  const pseudo = (i * 137 + 23) % 100;
  if (pseudo > 90) return "bg-blue-600";
  if (pseudo > 70) return "bg-blue-500";
  if (pseudo > 50) return "bg-blue-400";
  if (pseudo > 30) return "bg-blue-200";
  return "bg-slate-100";
});

function CustomTick({ payload, x, y, textAnchor, stroke, radius }: any) {
  return (
    <g className="recharts-polar-angle-axis-tick">
      <rect 
        x={x - 36} 
        y={y - 12} 
        width="72" 
        height="24" 
        fill="white" 
        rx="12" 
        stroke="#e2e8f0" 
        strokeWidth="1"
        style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.06))" }}
      />
      <text 
        x={x} 
        y={y + 3.5} 
        textAnchor="middle" 
        fill="#334155" 
        fontSize="9" 
        fontWeight="800" 
        letterSpacing="0.05em"
      >
        {payload.value}
      </text>
    </g>
  );
}

export function AchievementModal({ open, onOpenChange }: AchievementModalProps) {
  const router = useRouter();

  const handleViewAllAchievements = () => {
    onOpenChange(false);
    router.push("/achievements");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] sm:max-w-7xl max-h-[90vh] overflow-y-auto bg-slate-50 border-0 p-6 md:p-8 rounded-[2rem]">
        <DialogHeader className="sr-only">
          <DialogTitle>Thành tích học tập</DialogTitle>
        </DialogHeader>
        
        {/* Top Banner Profile Card */}
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white p-8 md:p-10 mb-6 shadow-xl">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center md:items-end justify-between gap-6 z-10 w-full">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-8 text-center md:text-left">
              <div className="relative shrink-0">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-1">
                  <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img src="https://api.dicebear.com/7.x/open-peeps/svg?seed=MaiHoangTung" alt="Profile" className="w-full h-full object-cover bg-blue-50" /> 
                  </div>
                </div>
                <div className="absolute -bottom-3 -right-3 bg-blue-600 rounded-full p-1.5 ring-4 ring-slate-950">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <div className="flex flex-col mb-1 pt-2">
                <h2 className="text-3xl md:text-[2.5rem] font-extrabold tracking-tight mb-2">Mai Hoàng Tùng</h2>
                <div className="flex items-center gap-3">
                  <div className="h-[2px] w-8 bg-cyan-400 rounded-full"></div>
                  <p className="text-cyan-400 font-bold tracking-[0.15em] text-xs uppercase">The Microservices Pioneer</p>
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-6 text-sm font-semibold mt-6">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="text-white text-base">245 <span className="text-slate-400 font-medium text-xs uppercase tracking-wider ml-1">Days</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <span className="text-white text-base">18 <span className="text-slate-400 font-medium text-xs uppercase tracking-wider ml-1">Badges</span></span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center md:text-right w-full md:w-auto mt-6 md:mt-0">
              <div className="flex items-baseline justify-center md:justify-end gap-3 mb-2 italic">
                <span className="text-4xl font-black italic tracking-tighter uppercase" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)", color: "transparent" }}>Level</span>
                <span className="text-[5rem] font-black italic tracking-tighter text-cyan-400 leading-none drop-shadow-lg">42</span>
              </div>
              <div className="space-y-2 mt-6 max-w-sm mx-auto md:mx-0">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  <span>Experience Points</span>
                  <span>12,500 / 15,000 XP</span>
                </div>
                <div className="h-2.5 w-full md:w-72 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full w-[83%] relative">
                    <div className="absolute inset-0 bg-white/20 blur-[2px] opacity-0 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 p-6 md:p-8 rounded-[2rem] shadow-sm border-slate-200/60 bg-white">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <Award className="w-6 h-6 text-blue-500" />
                Bộ sưu tập Huy hiệu
              </h3>
              <button 
                onClick={handleViewAllAchievements}
                className="text-xs md:text-sm px-5 py-2 bg-blue-50 text-blue-600 font-bold rounded-full hover:bg-blue-100 transition-colors"
              >
                Xem tất cả
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="flex flex-col items-center justify-start py-8 px-6 bg-slate-50/50 rounded-[1.5rem] border border-dashed border-slate-200 text-center group hover:bg-yellow-50/30 hover:border-yellow-200 transition-all cursor-pointer h-full">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full mb-5 flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-10 h-10 text-white fill-white" />
                </div>
                <h4 className="font-bold text-slate-800 text-[15px] mb-3">React Native Master</h4>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Legendary Gold</span>
                </div>
                <p className="text-[13px] text-slate-500/90 leading-relaxed font-medium">Đã hoàn thành 5 dự án ứng dụng di động thực tế.</p>
              </div>
              
              <div className="flex flex-col items-center justify-start py-8 px-6 bg-slate-50/50 rounded-[1.5rem] border border-dashed border-slate-200 text-center group hover:bg-slate-100/50 transition-all cursor-pointer h-full">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-300 to-slate-400 rounded-2xl rotate-[15deg] mb-5 flex items-center justify-center shadow-lg shadow-slate-500/10 group-hover:scale-110 group-hover:rotate-0 transition-all duration-300">
                  <Box className="w-10 h-10 text-white fill-white/20" />
                </div>
                <h4 className="font-bold text-slate-800 text-[15px] mb-3">Docker & CI/CD</h4>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-200 text-slate-700 rounded-full mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Elite Silver</span>
                </div>
                <p className="text-[13px] text-slate-500/90 leading-relaxed font-medium">Làm chủ quy trình triển khai tự động hóa.</p>
              </div>

              <div className="flex flex-col items-center justify-start py-8 px-6 bg-slate-50/50 rounded-[1.5rem] border border-dashed border-slate-200 text-center group hover:bg-orange-50/30 hover:border-orange-200 transition-all cursor-pointer h-full">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl mb-5 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Database className="w-10 h-10 text-white" />
                </div>
                <h4 className="font-bold text-slate-800 text-[15px] mb-3">DB MongoDB</h4>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Core Bronze</span>
                </div>
                <p className="text-[13px] text-slate-500/90 leading-relaxed font-medium">Xây dựng cấu trúc dữ liệu NoSQL tối ưu.</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 md:p-8 rounded-[2rem] shadow-sm border-slate-200/60 bg-white flex flex-col justify-between items-center text-center">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-2 w-full justify-start text-slate-900">
              <Activity className="w-5 h-5 text-blue-500" />
              Phân tích Năng lực
            </h3>
            <div className="w-full h-[300px] mb-2 -mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                  <defs>
                    <linearGradient id="colorRadar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <PolarGrid gridType="polygon" stroke="#e2e8f0" strokeWidth={1.5} />
                  <PolarAngleAxis dataKey="subject" tick={<CustomTick />} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar 
                    name="Student" 
                    dataKey="A" 
                    stroke="#2563eb" 
                    strokeWidth={3} 
                    fill="url(#colorRadar)" 
                    dot={{ r: 4, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full pt-4 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5">Top Stat</p>
              <p className="text-[13px] font-black text-blue-600 uppercase tracking-wide">Cloud Architecture (98%)</p>
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-3 p-6 md:p-8 rounded-[2rem] shadow-sm border-slate-200/60 bg-white overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <CalendarDays className="w-5 h-5 text-blue-500" />
                Tần suất học tập
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Less</span>
                <div className="flex gap-1.5 ml-1 mr-1">
                  <div className="w-3.5 h-3.5 rounded-[4px] bg-slate-100"></div>
                  <div className="w-3.5 h-3.5 rounded-[4px] bg-blue-200"></div>
                  <div className="w-3.5 h-3.5 rounded-[4px] bg-blue-400"></div>
                  <div className="w-3.5 h-3.5 rounded-[4px] bg-blue-500"></div>
                  <div className="w-3.5 h-3.5 rounded-[4px] bg-blue-700"></div>
                </div>
                <span>More</span>
              </div>
            </div>
            
            <div className="w-full overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
               <div className="flex gap-[5px] min-w-max pr-4">
                  {Array.from({length: 52}).map((_, col) => (
                     <div key={col} className="flex flex-col gap-[5px]">
                        {Array.from({length: 7}).map((_, row) => {
                           const index = col * 7 + row;
                           return <div key={`${col}-${row}`} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] sm:rounded-[4px] ${heatmapData[index]}`}></div>
                        })}
                     </div>
                  ))}
               </div>
               <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-5 px-1 min-w-max w-full">
                 <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
               </div>
            </div>
          </Card>

          <div className="flex flex-col justify-between gap-4">
            <Card className="p-6 rounded-[1.5rem] flex items-center gap-4 bg-white shadow-sm hover:shadow-md transition-shadow h-full border-slate-200/60">
              <div className="w-14 h-14 rounded-2xl bg-blue-50/80 text-blue-600 flex items-center justify-center shrink-0">
                <Zap className="w-7 h-7 fill-blue-600/20 stroke-blue-600" />
              </div>
              <div className="min-w-0">
                <h5 className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-1.5 truncate">Total XP</h5>
                <div className="text-[1.35rem] font-black text-slate-900 leading-none">12,500</div>
              </div>
            </Card>

            <Card className="p-6 rounded-[1.5rem] flex items-center gap-4 bg-white shadow-sm hover:shadow-md transition-shadow h-full border-slate-200/60">
              <div className="w-14 h-14 rounded-2xl bg-orange-50/80 text-orange-500 flex items-center justify-center shrink-0">
                <Flame className="w-7 h-7 fill-orange-500/20 stroke-orange-500" />
              </div>
              <div className="min-w-0">
                <h5 className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-1.5 truncate">Longest Streak</h5>
                <div className="text-[1.35rem] font-black text-slate-900 leading-none truncate">42 Days</div>
              </div>
            </Card>

            <Card className="p-6 rounded-[1.5rem] flex items-center gap-4 bg-white shadow-sm hover:shadow-md transition-shadow h-full border-slate-200/60">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50/80 text-emerald-600 flex items-center justify-center shrink-0">
                <Shield className="w-7 h-7 fill-emerald-600/20 stroke-emerald-600" />
              </div>
              <div className="min-w-0">
                <h5 className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-1.5 truncate">Certificates</h5>
                <div className="text-[1.35rem] font-black text-slate-900 leading-none truncate">12 Active</div>
              </div>
            </Card>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
