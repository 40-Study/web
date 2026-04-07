"use client";

import { useState } from "react";
import {
  Download,
  DollarSign,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Landmark,
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
import { formatCurrency } from "@/lib/utils";
import { useTeacherWallet, useTeacherTransactions } from "@/hooks/queries/use-wallet";
import type { TeacherTransaction } from "@/services/wallet.service";
import { BankInfoDialog } from "./bank-info-dialog";

// ─── Status display config ───────��───────────────────────────────────────────

type BadgeVariant = "success" | "warning" | "secondary" | "destructive";

const STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  completed: { label: "Hoàn thành", variant: "success" },
  pending: { label: "Chờ xử lý", variant: "warning" },
  cancelled: { label: "Đã huỷ", variant: "secondary" },
  failed: { label: "Thất b��i", variant: "destructive" },
  refunded: { label: "Hoàn tiền", variant: "destructive" },
};

function getStatusConfig(status: string): { label: string; variant: BadgeVariant } {
  return STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as BadgeVariant };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function TeacherWalletPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const limit = 20;

  // Map tab to API type param
  const txTypeParam = activeTab === "income" ? "income" : activeTab === "refund" ? "refund" : "";

  const { data: wallet, isLoading: isWalletLoading } = useTeacherWallet();
  const { data: txResponse, isLoading: isTxLoading } = useTeacherTransactions({
    type: txTypeParam || undefined,
    page,
    limit,
  });

  const isLoading = isWalletLoading || isTxLoading;

  const transactions: TeacherTransaction[] = txResponse?.transactions ?? [];
  const totalPages = txResponse?.total_pages ?? 1;

  // Client-side search filter on top of server-side type filter
  const filteredTransactions = searchQuery
    ? transactions.filter(
        (tx) =>
          tx.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : transactions;

  // Bank info display
  const hasBankInfo = wallet?.bank_name && wallet?.bank_account_number;

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
              <p className="text-3xl font-bold text-green-600 mb-1">
                {formatCurrency(wallet?.available_balance ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Tổng thu nhập: {formatCurrency(wallet?.total_earnings ?? 0)} · Đã rút:{" "}
                {formatCurrency(wallet?.total_paid_out ?? 0)}
              </p>
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
              <p className="text-xs text-muted-foreground">Tổng đơn học sinh đã mua</p>
            </CardContent>
          </Card>

          {/* Bank Account */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Tài khoản nhận tiền</span>
                <Button
                  variant="link"
                  className="h-auto p-0 text-primary-600"
                  onClick={() => setShowBankDialog(true)}
                >
                  {hasBankInfo ? "Thay đổi" : "Thêm TK"}
                </Button>
              </div>
              {hasBankInfo ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-8 bg-green-700 rounded flex items-center justify-center">
                      <Landmark className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{wallet.bank_name}</p>
                      <p className="text-sm text-muted-foreground">
                        **** {wallet.bank_account_number?.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{wallet.bank_account_name}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có tài khoản ngân hàng. Vui lòng thêm để nhận thanh toán.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">Tất cả giao dịch</TabsTrigger>
              <TabsTrigger value="income">Thu nhập</TabsTrigger>
              <TabsTrigger value="refund">Hoàn tiền</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 my-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm mã GD, tên khóa học, tên người mua..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                  <th className="p-3 text-xs font-medium text-muted-foreground">KHÓA HỌC</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">NGƯỜI MUA</th>
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
                    const isRefund = tx.type === "expense";
                    const cfg = getStatusConfig(tx.status);
                    return (
                      <tr key={`${tx.order_id}-${tx.course_id}`} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-3 text-sm font-medium">{tx.order_number}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDate(tx.created_at)}
                        </td>
                        <td className="p-3 text-sm">{tx.course_name}</td>
                        <td className="p-3 text-sm text-muted-foreground">{tx.buyer_name}</td>
                        <td
                          className={`p-3 text-sm text-right font-medium ${isRefund ? "text-red-500" : "text-green-600"}`}
                        >
                          {isRefund ? "-" : "+"}
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
              Trang {page}/{totalPages} · {txResponse?.total_count ?? 0} giao dịch
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="default" size="sm">
                {page}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Info Dialog */}
      <BankInfoDialog
        open={showBankDialog}
        onOpenChange={setShowBankDialog}
        currentBankName={wallet?.bank_name}
        currentAccountNumber={wallet?.bank_account_number}
        currentAccountName={wallet?.bank_account_name}
      />
    </div>
  );
}
