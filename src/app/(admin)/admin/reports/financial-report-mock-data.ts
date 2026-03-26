export type PaymentStatus = "Succeeded" | "Pending" | "Failed" | "Refunded";

export interface FinancialRecord {
  id: string;
  transactionId: string;
  courseName: string;
  studentName: string;
  studentEmail: string;
  amount: number;
  fee: number;
  gateway: "MOMO" | "VNPAY" | "SEPAY" | "BANK_TRANSFER";
  status: PaymentStatus;
  paidAt: string;
  note?: string;
}

export const financialReportMockData: FinancialRecord[] = [
  { id: "1", transactionId: "TXN-52001", courseName: "Advanced React & Tailwind", studentName: "Nguyen Minh Anh", studentEmail: "anh.nguyen@fortex.vn", amount: 1990000, fee: 29000, gateway: "SEPAY", status: "Succeeded", paidAt: "2026-03-26T09:15:00Z", note: "Đóng học phí đợt 1" },
  { id: "2", transactionId: "TXN-52002", courseName: "Data Science Masterclass", studentName: "Tran Gia Bao", studentEmail: "bao.tran@fortex.vn", amount: 2490000, fee: 35000, gateway: "VNPAY", status: "Pending", paidAt: "2026-03-26T10:20:00Z" },
  { id: "3", transactionId: "TXN-52003", courseName: "Go Backend Frameworks", studentName: "Le Hoang Linh", studentEmail: "linh.le@fortex.vn", amount: 1790000, fee: 25000, gateway: "MOMO", status: "Succeeded", paidAt: "2026-03-25T13:00:00Z" },
  { id: "4", transactionId: "TXN-52004", courseName: "Product Management 101", studentName: "Pham Quang Huy", studentEmail: "huy.pham@fortex.vn", amount: 1290000, fee: 18000, gateway: "BANK_TRANSFER", status: "Failed", paidAt: "2026-03-25T14:11:00Z", note: "Bank timeout" },
  { id: "5", transactionId: "TXN-52005", courseName: "UI/UX Design Systems", studentName: "Vo Khai Tam", studentEmail: "tam.vo@fortex.vn", amount: 1590000, fee: 22000, gateway: "SEPAY", status: "Succeeded", paidAt: "2026-03-24T15:45:00Z" },
  { id: "6", transactionId: "TXN-52006", courseName: "Python for AI", studentName: "Bui Nhat Nam", studentEmail: "nam.bui@fortex.vn", amount: 2290000, fee: 32000, gateway: "VNPAY", status: "Succeeded", paidAt: "2026-03-24T18:33:00Z" },
  { id: "7", transactionId: "TXN-52007", courseName: "Machine Learning Ops", studentName: "Dang Thanh Ha", studentEmail: "ha.dang@fortex.vn", amount: 2790000, fee: 39000, gateway: "MOMO", status: "Pending", paidAt: "2026-03-24T19:10:00Z" },
  { id: "8", transactionId: "TXN-52008", courseName: "System Design Interview", studentName: "Ngo Duc Dat", studentEmail: "dat.ngo@fortex.vn", amount: 2090000, fee: 30000, gateway: "SEPAY", status: "Succeeded", paidAt: "2026-03-23T08:25:00Z" },
  { id: "9", transactionId: "TXN-52009", courseName: "Cloud Native with Kubernetes", studentName: "Do Mai Nhi", studentEmail: "nhi.do@fortex.vn", amount: 2690000, fee: 38000, gateway: "VNPAY", status: "Refunded", paidAt: "2026-03-23T11:42:00Z", note: "Refund theo yêu cầu phụ huynh" },
  { id: "10", transactionId: "TXN-52010", courseName: "TypeScript From Zero", studentName: "Nguyen Thanh Son", studentEmail: "son.nguyen@fortex.vn", amount: 990000, fee: 15000, gateway: "BANK_TRANSFER", status: "Succeeded", paidAt: "2026-03-22T16:55:00Z" },
  { id: "11", transactionId: "TXN-52011", courseName: "Advanced React & Tailwind", studentName: "Pham Gia Linh", studentEmail: "linh.pham@fortex.vn", amount: 1990000, fee: 29000, gateway: "SEPAY", status: "Succeeded", paidAt: "2026-03-21T09:17:00Z" },
  { id: "12", transactionId: "TXN-52012", courseName: "Data Science Masterclass", studentName: "Le Duc Anh", studentEmail: "anh.le@fortex.vn", amount: 2490000, fee: 35000, gateway: "MOMO", status: "Failed", paidAt: "2026-03-21T11:05:00Z", note: "3DS verify failed" },
  { id: "13", transactionId: "TXN-52013", courseName: "Go Backend Frameworks", studentName: "Tran Quoc Tuan", studentEmail: "tuan.tran@fortex.vn", amount: 1790000, fee: 25000, gateway: "SEPAY", status: "Succeeded", paidAt: "2026-03-20T08:40:00Z" },
  { id: "14", transactionId: "TXN-52014", courseName: "UI/UX Design Systems", studentName: "Huynh Minh Chau", studentEmail: "chau.huynh@fortex.vn", amount: 1590000, fee: 22000, gateway: "VNPAY", status: "Succeeded", paidAt: "2026-03-20T14:22:00Z" },
  { id: "15", transactionId: "TXN-52015", courseName: "Python for AI", studentName: "Nguyen Nhu Y", studentEmail: "y.nguyen@fortex.vn", amount: 2290000, fee: 32000, gateway: "SEPAY", status: "Pending", paidAt: "2026-03-19T17:20:00Z" },
  { id: "16", transactionId: "TXN-52016", courseName: "Machine Learning Ops", studentName: "Ta Thanh Truc", studentEmail: "truc.ta@fortex.vn", amount: 2790000, fee: 39000, gateway: "BANK_TRANSFER", status: "Succeeded", paidAt: "2026-03-19T19:15:00Z" },
  { id: "17", transactionId: "TXN-52017", courseName: "System Design Interview", studentName: "Luong Dang Khoa", studentEmail: "khoa.luong@fortex.vn", amount: 2090000, fee: 30000, gateway: "MOMO", status: "Succeeded", paidAt: "2026-03-18T09:30:00Z" },
  { id: "18", transactionId: "TXN-52018", courseName: "Product Management 101", studentName: "Vu Bao Ngan", studentEmail: "ngan.vu@fortex.vn", amount: 1290000, fee: 18000, gateway: "SEPAY", status: "Refunded", paidAt: "2026-03-18T16:40:00Z", note: "Lớp đổi lịch" },
  { id: "19", transactionId: "TXN-52019", courseName: "Cloud Native with Kubernetes", studentName: "Hoang Tien Dat", studentEmail: "dat.hoang@fortex.vn", amount: 2690000, fee: 38000, gateway: "VNPAY", status: "Succeeded", paidAt: "2026-03-17T12:18:00Z" },
  { id: "20", transactionId: "TXN-52020", courseName: "TypeScript From Zero", studentName: "Trinh Nhat Quang", studentEmail: "quang.trinh@fortex.vn", amount: 990000, fee: 15000, gateway: "MOMO", status: "Succeeded", paidAt: "2026-03-17T18:27:00Z" },
];
