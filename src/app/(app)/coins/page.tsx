"use client";

import { useRef, useState } from "react";
import {
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  Circle,
  ArrowRight,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFriends } from "@/hooks/queries/use-friends";
import { friendDisplayName } from "@/services/friend.service";
import {
  useCoinWallet,
  useCoinTransactions,
  useCoinPackages,
  usePurchaseCoins,
  useSendCoinGift,
  useCoinPurchases,
} from "@/hooks/queries/use-coins";
import "@/components/commerce/commerce.css";
import Link from "next/link";
import { QueryState } from "@/components/common/query-state";
import type { CoinPurchase, CoinTransaction } from "@/services/coin.service";
import { CoinPaymentDialog } from "@/components/coins/coin-payment-dialog";

function formatNumber(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

function TransactionRow({ tx }: { tx: CoinTransaction }) {
  const isEarn = tx.amount > 0;
  const TYPE_LABELS: Record<string, string> = {
    EARN_LESSON_COMPLETE: "Hoàn thành bài học",
    EARN_QUIZ_PASS: "Đạt bài quiz",
    EARN_STREAK_BONUS: "Bonus chuỗi ngày",
    EARN_ACHIEVEMENT: "Thành tích",
    EARN_DAILY_LOGIN: "Đăng nhập hàng ngày",
    EARN_REFERRAL: "Giới thiệu bạn bè",
    EARN_PURCHASE: "Mua xu",
    SPEND_COURSE_UNLOCK: "Mở khoá khoá học",
    SPEND_HINT: "Mua gợi ý",
    SPEND_STREAK_FREEZE: "Đóng băng chuỗi ngày",
    SPEND_GIFT: "Tặng xu",
    RECEIVE_GIFT: "Nhận xu từ bạn bè",
    REFUND: "Hoàn xu",
    ADMIN_ADJUST: "Điều chỉnh",
  };

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center",
            isEarn ? "bg-green-100" : "bg-red-100"
          )}
        >
          {isEarn ? (
            <ArrowDownRight className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{TYPE_LABELS[tx.type] ?? tx.description ?? tx.type}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(tx.created_at).toLocaleString("vi-VN")}
          </p>
        </div>
      </div>
      <div className={cn("font-semibold text-sm", isEarn ? "text-green-600" : "text-red-600")}>
        {isEarn ? "+" : ""}
        {formatNumber(tx.amount)}
      </div>
    </div>
  );
}

function SendGiftDialog({ balance }: { balance: number }) {
  const [open, setOpen] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const sendGift = useSendCoinGift();
  // Chỉ tải bạn bè khi mở hộp thoại; backend giới hạn limit 100 nên đủ cho danh sách chọn.
  const { data: friendsData, isLoading: friendsLoading } = useFriends({ limit: 100 }, open);
  const friends = friendsData?.friends ?? [];

  const sending = useRef(false);
  const [validationError, setValidationError] = useState("");
  const handleSend = async () => {
    if (sending.current) return;
    const quantity = Number(amount);
    if (!receiverId || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > balance) {
      setValidationError(`Chọn người nhận và nhập số xu nguyên từ 1 đến ${formatNumber(balance)}.`);
      return;
    }
    sending.current = true;
    setValidationError("");
    try {
      await sendGift.mutateAsync({ receiverId, amount: quantity, message: message || undefined });
      setOpen(false);
      setReceiverId("");
      setAmount("");
      setMessage("");
    } catch {
      /* API error is displayed by the mutation. */
    } finally {
      sending.current = false;
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Gift className="h-4 w-4 mr-2" />
        Tặng xu
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!sending.current) {
            setOpen(value);
            setValidationError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tặng xu cho bạn bè</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* A-19: trước đây bắt nhập UUID thô, sai thì chỉ báo "Không thể tặng xu". Chọn từ danh sách bạn bè. */}
            <div className="space-y-2">
              <Label>Người nhận</Label>
              {friendsLoading ? (
                <p className="text-sm text-muted-foreground">Đang tải danh sách bạn bè...</p>
              ) : friends.length === 0 ? (
                <p className="text-sm text-muted-foreground" data-testid="gift-no-friends">
                  Bạn chưa có bạn bè nào để tặng xu. Hãy kết bạn trước.
                </p>
              ) : (
                <Select value={receiverId} onValueChange={setReceiverId}>
                  <SelectTrigger aria-label="Người nhận">
                    <SelectValue placeholder="Chọn một người bạn" />
                  </SelectTrigger>
                  <SelectContent>
                    {friends.map((f) => (
                      <SelectItem key={f.user.user_id} value={f.user.user_id}>
                        {friendDisplayName(f.user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gift-coins">Số xu</Label>
              <Input
                id="gift-coins"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                min={1}
                step={1}
                max={balance}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gift-message">Lời nhắn (tuỳ chọn)</Label>
              <Input
                id="gift-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Chúc bạn học tốt!"
              />
            </div>
            {validationError && (
              <p role="alert" className="text-xs text-red-600">
                {validationError}
              </p>
            )}
            <Button
              className="w-full"
              onClick={() => void handleSend()}
              disabled={sendGift.isPending || !receiverId || !amount}
            >
              {sendGift.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Gift className="h-4 w-4 mr-2" />
              )}
              Gửi tặng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function CoinsPage() {
  const [tab, setTab] = useState("packages");
  const [selectedID, setSelectedID] = useState("");
  const [page, setPage] = useState(1);
  const wallet = useCoinWallet();
  const transactions = useCoinTransactions({ limit: 50 }, tab === "transactions");
  const packages = useCoinPackages();
  const purchases = useCoinPurchases(page, tab === "purchases");
  const purchaseCoins = usePurchaseCoins();
  const buying = useRef(false);
  const [paymentPurchase, setPaymentPurchase] = useState<CoinPurchase | null>(null);
  const selected =
    packages.data?.find((p) => p.id === selectedID) ??
    packages.data?.find((p) => p.is_featured) ??
    packages.data?.[0];
  async function purchase() {
    if (!selected || buying.current) return;
    buying.current = true;
    try {
      setPaymentPurchase(
        await purchaseCoins.mutateAsync({ packageId: selected.id, paymentMethod: "bank_transfer" })
      );
    } catch {
      /* The mutation displays the API error. */
    } finally {
      buying.current = false;
    }
  }
  const statusLabel = {
    PENDING: "Chờ thanh toán",
    COMPLETED: "Đã cộng xu",
    FAILED: "Không thành công",
    REFUNDED: "Đã hoàn tiền",
  };
  return (
    <div className="commerce-page">
      <div className="commerce-heading">
        <div>
          <div className="commerce-eyebrow">FORTEX / TÀI KHOẢN</div>
          <h1>Ví xu của bạn</h1>
          <p>Nạp thêm xu, theo dõi giao dịch và tặng bạn bè.</p>
        </div>
        <SendGiftDialog balance={wallet.data?.balance ?? 0} />
      </div>
      {wallet.isError ? (
        <QueryState isError error={wallet.error} onRetry={() => wallet.refetch()}>
          {null}
        </QueryState>
      ) : (
        <section className="commerce-balance" aria-label="Số dư ví xu">
          <div>
            <small>XU HIỆN CÓ</small>
            <strong>
              {wallet.isLoading ? "…" : formatNumber(wallet.data?.balance ?? 0)} <span>xu</span>
            </strong>
          </div>
          <div className="commerce-balance-stats">
            <div>
              <small>Tổng xu đã nhận</small>
              <b>{wallet.isLoading ? "…" : formatNumber(wallet.data?.total_earned ?? 0)}</b>
            </div>
            <div>
              <small>Xu đã sử dụng</small>
              <b>{wallet.isLoading ? "…" : formatNumber(wallet.data?.total_spent ?? 0)}</b>
            </div>
          </div>
        </section>
      )}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="packages">
            <Coins className="mr-2 h-3.5 w-3.5" />
            Nạp xu
          </TabsTrigger>
          <TabsTrigger value="purchases">
            <ShoppingBag className="mr-2 h-3.5 w-3.5" />
            Đơn nạp xu
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <History className="mr-2 h-3.5 w-3.5" />
            Biến động số dư
          </TabsTrigger>
        </TabsList>
        <TabsContent value="packages">
          <QueryState
            isLoading={packages.isLoading}
            isError={packages.isError}
            error={packages.error}
            onRetry={() => packages.refetch()}
          >
            <div className="commerce-checkout-grid">
              <section>
                <h2 className="mb-2 text-base font-semibold">Chọn gói xu phù hợp</h2>
                <p className="mb-5 text-xs text-slate-400">
                  Số xu nhận được đã bao gồm xu tặng thêm.
                </p>
                <div className="coin-package-grid">
                  {packages.data?.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      className="coin-package-choice"
                      aria-pressed={selected?.id === pkg.id}
                      disabled={purchaseCoins.isPending}
                      onClick={() => setSelectedID(pkg.id)}
                      aria-label={`Chọn ${pkg.name}: ${formatNumber(pkg.total_coins)} xu`}
                    >
                      <span className="text-[11px] text-slate-500">{pkg.name}</span>
                      {selected?.id === pkg.id ? (
                        <CheckCircle2 className="coin-choice-indicator h-4 w-4" />
                      ) : (
                        <Circle className="coin-choice-indicator h-4 w-4" />
                      )}
                      <strong>
                        {formatNumber(pkg.total_coins)} <small>xu</small>
                      </strong>
                      <span className="coin-bonus">
                        {pkg.bonus_amount > 0
                          ? `Tặng thêm ${formatNumber(pkg.bonus_amount)} xu`
                          : "Gói xu tiêu chuẩn"}
                      </span>
                      <div className="coin-package-price">
                        {formatNumber(Number(pkg.price))} ₫{" "}
                        {pkg.is_featured && (
                          <span className="ml-1 rounded bg-indigo-50 px-2 py-1 text-[9px] text-indigo-500">
                            Phổ biến
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {packages.data?.length === 0 && (
                  <div className="commerce-panel p-10 text-center text-sm text-slate-400">
                    Hiện chưa có gói xu. Vui lòng quay lại sau.
                  </div>
                )}
              </section>
              <aside className="commerce-panel commerce-summary">
                <div className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-500">
                  <Coins className="h-5 w-5" />
                </div>
                <h2>Thông tin nạp xu</h2>
                <dl>
                  <div>
                    <dt>Gói đã chọn</dt>
                    <dd>{selected?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Xu trong gói</dt>
                    <dd>{formatNumber(selected?.coin_amount ?? 0)} xu</dd>
                  </div>
                  <div>
                    <dt>Xu tặng thêm</dt>
                    <dd className="text-emerald-600">
                      +{formatNumber(selected?.bonus_amount ?? 0)} xu
                    </dd>
                  </div>
                  <div>
                    <dt>Tổng xu nhận</dt>
                    <dd className="font-semibold">{formatNumber(selected?.total_coins ?? 0)} xu</dd>
                  </div>
                  <div className="commerce-total">
                    <dt>Thanh toán</dt>
                    <dd>{formatNumber(Number(selected?.price ?? 0))} ₫</dd>
                  </div>
                </dl>
                <Button
                  className="w-full"
                  onClick={() => void purchase()}
                  disabled={!selected || purchaseCoins.isPending}
                >
                  {purchaseCoins.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Tiếp tục nạp xu
                </Button>
                <p className="commerce-help">
                  Chuyển khoản bằng VND. Xu được cộng sau khi ngân hàng xác nhận. Bạn có thể mở lại
                  đơn trong “Đơn nạp xu”.
                </p>
                <Link href="/orders" className="mt-5 block border-t pt-4 text-xs text-indigo-600">
                  Xem đơn mua khoá học →
                </Link>
              </aside>
            </div>
          </QueryState>
        </TabsContent>
        <TabsContent value="purchases">
          <QueryState
            isLoading={purchases.isLoading}
            isError={purchases.isError}
            error={purchases.error}
            onRetry={() => purchases.refetch()}
          >
            <div className="commerce-panel overflow-x-auto">
              <table className="commerce-table">
                <thead>
                  <tr>
                    <th>ĐƠN NẠP XU</th>
                    <th>SỐ TIỀN</th>
                    <th>TRẠNG THÁI</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {purchases.data?.purchases.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{formatNumber(item.coin_amount + item.bonus_amount)} xu</strong>
                        <p className="coin-ref">
                          {new Date(item.created_at).toLocaleString("vi-VN")}
                        </p>
                        <p className="coin-ref">{item.payment_reference}</p>
                      </td>
                      <td className="whitespace-nowrap">{formatNumber(Number(item.price))} ₫</td>
                      <td>
                        <Badge
                          variant={
                            item.status === "COMPLETED"
                              ? "success"
                              : item.status === "PENDING"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {statusLabel[item.status]}
                        </Badge>
                      </td>
                      <td>
                        {item.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPaymentPurchase(item)}
                          >
                            Tiếp tục thanh toán
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!purchases.data?.purchases.length && (
                <p className="p-10 text-center text-sm text-slate-400">Bạn chưa có đơn nạp xu.</p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-end gap-3 text-xs text-slate-500">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1 || purchases.isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              Trang {page}
              <Button
                size="sm"
                variant="outline"
                disabled={page * 10 >= (purchases.data?.total_count ?? 0) || purchases.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </QueryState>
        </TabsContent>
        <TabsContent value="transactions">
          <QueryState
            isLoading={transactions.isLoading}
            isError={transactions.isError}
            error={transactions.error}
            onRetry={() => transactions.refetch()}
          >
            <div className="commerce-panel p-5">
              {transactions.data?.transactions.length ? (
                transactions.data.transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
              ) : (
                <p className="p-8 text-center text-sm text-slate-400">Chưa có biến động số dư.</p>
              )}
            </div>
          </QueryState>
        </TabsContent>
      </Tabs>
      <CoinPaymentDialog
        purchase={paymentPurchase}
        open={!!paymentPurchase}
        onOpenChange={(open) => {
          if (!open) setPaymentPurchase(null);
        }}
      />
    </div>
  );
}
