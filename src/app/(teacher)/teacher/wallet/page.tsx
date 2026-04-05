"use client";

import { useState } from "react";
import {
  Download,
  DollarSign,
  Clock,
  Search,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useWallet, useWalletTransactions } from "@/hooks/queries/use-wallet";
import type { WalletTransaction, TransactionStatus } from "@/services/wallet.service";

// ─── Status display config ───────────────────────────────────────────────────

type BadgeVariant = "success" | "warning" | "secondary" | "destructive";

const STATUS_CONFIG: Record<TransactionStatus, { label: string; variant: BadgeVariant }> = {
  completed: { label: "Khả dụng", variant: "success" },
  pending: { label: "Chờ đối soát", variant: "warning" },
  cancelled: { label: "Đã huỷ", variant: "secondary" },
  failed: { label: "Thất bại", variant: "destructive" },
};

function getStatusConfig(status: string): { label: string; variant: BadgeVariant } {
  return (
    STATUS_CONFIG[status as TransactionStatus] ?? {
      label: status,
      variant: "secondary" as BadgeVariant,
    }
  );
}

/**
 * Format ISO date string to dd/MM/yyyy
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN");
}

/**
 * Derive transaction type from WalletTransaction
 * "purchase" / "credit" = income; "withdrawal" / "refund" = outgoing
 */
function getTxType(tx: WalletTransaction): "income" | "withdrawal" {
  return tx.type === "withdrawal" || tx.type === "refund" ? "withdrawal" : "income";
}

export default function TeacherWalletPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("this-month");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: wallet, isLoading: isWalletLoading } = useWallet();
  const { data: txResponse, isLoading: isTxLoading } = useWalletTransactions();

  const isLoading = isWalletLoading || isTxLoading;

  // Unwrap paginated response — API returns { transactions[], total, page, limit }
  const transactions: WalletTransaction[] = txResponse?.transactions ?? [];

  // Derive balance figures from wallet data
  const totalSpent = wallet?.total_spent ?? 0;
  // Use total_spent as available balance proxy; pending is unknown from current API shape
  const availableBalance = totalSpent;

  const filteredTransactions = transactions.filter((tx) => {
    const type = getTxType(tx);
    if (activeTab === "income" && type !== "income") return false;
    if (activeTab === "withdrawal" && type !== "withdrawal") return false;
    if (
      searchQuery &&
      !tx.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !tx.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tài chính & Đối soát</h1>
          <p className="text-muted-foreground">
            Quản lý thu nhập và các giao dịch thanh toán của bạn.
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Xuất biên lai Excel
        </Button>
      </div>

      {/* Balance Cards */}
      {isWalletLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Available Balance */}
          <Card className="border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-muted-foreground">Số dư khả dụng</span>
              </div>
              <p className="text-3xl font-bold text-green-600 mb-4">
                {formatCurrency(availableBalance)}
              </p>
              <Button className="w-full" onClick={() => setShowWithdrawModal(true)}>
                Rút tiền về NH
              </Button>
            </CardContent>
          </Card>

          {/* Order count */}
          <Card className="border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-muted-foreground">Số đơn hàng</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {wallet?.order_count ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Tổng đơn đã xử lý</p>
            </CardContent>
          </Card>

          {/* Bank Account */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Tài khoản nhận tiền</span>
                <Button variant="link" className="h-auto p-0 text-primary-600">
                  Thay đổi
                </Button>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-8 bg-green-700 rounded flex items-center justify-center text-white text-xs font-bold">
                  VCB
                </div>
                <div>
                  <p className="font-medium flex items-center gap-1">
                    Vietcombank <CheckCircle className="w-4 h-4 text-green-500" />
                  </p>
                  <p className="text-sm text-muted-foreground">**** **** 1290</p>
                </div>
              </div>
              <p className="text-xs text-green-600">Tài khoản đã xác thực chính chủ.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Tất cả giao dịch</TabsTrigger>
              <TabsTrigger value="income">Tiền vào</TabsTrigger>
              <TabsTrigger value="withdrawal">Rút tiền</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 my-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm kiếm mã giao dịch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">Tháng này</SelectItem>
                <SelectItem value="last-month">Tháng trước</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isTxLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3 text-xs font-medium text-muted-foreground">MÃ GD</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">NGÀY</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">NỘI DUNG</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">PHƯƠNG THỨC</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground text-right">
                    SỐ TIỀN
                  </th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground text-sm">
                      Không có giao dịch nào.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const type = getTxType(tx);
                    const isOutgoing = type === "withdrawal";
                    const cfg = getStatusConfig(tx.status);
                    return (
                      <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-3 text-sm font-medium">
                          {tx.order_number ?? tx.id}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDate(tx.created_at)}
                        </td>
                        <td className="p-3 text-sm">{tx.description ?? "-"}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {tx.payment_method ?? "-"}
                        </td>
                        <td
                          className={`p-3 text-sm text-right font-medium ${isOutgoing ? "text-red-500" : "text-green-600"}`}
                        >
                          {isOutgoing ? "-" : "+"}
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="p-3">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Hiển thị {filteredTransactions.length} giao dịch
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="default" size="sm">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdraw Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rút tiền về tài khoản</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Số tiền rút</label>
              <Input
                type="number"
                placeholder="Nhập số tiền..."
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Số dư khả dụng: {formatCurrency(availableBalance)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Tài khoản nhận</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-green-700 rounded text-white text-xs font-bold flex items-center justify-center">
                  VCB
                </div>
                <div>
                  <p className="text-sm font-medium">Vietcombank</p>
                  <p className="text-xs text-muted-foreground">**** **** 1290</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Phí rút tiền: Miễn phí. Thời gian xử lý: 1-2 ngày làm việc.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawModal(false)}>
              Hủy
            </Button>
            <Button
              disabled={!withdrawAmount || Number(withdrawAmount) > availableBalance}
            >
              Xác nhận rút tiền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
