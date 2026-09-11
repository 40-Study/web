"use client";

import { useState } from "react";
import {
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  ShoppingBag,
  Loader2,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useCoinWallet,
  useCoinTransactions,
  useCoinPackages,
  usePurchaseCoins,
  useSendCoinGift,
} from "@/hooks/queries/use-coins";
import type { CoinPackage, CoinPurchase, CoinTransaction } from "@/services/coin.service";
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
    SPEND_COURSE_UNLOCK: "Mở khóa khóa học",
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
          <p className="text-sm font-medium">
            {TYPE_LABELS[tx.type] ?? tx.description ?? tx.type}
          </p>
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

function PackageCard({
  pkg,
  onPurchase,
}: {
  pkg: CoinPackage;
  onPurchase: (id: string) => void;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-lg cursor-pointer",
        pkg.is_featured && "border-primary ring-1 ring-primary/20"
      )}
    >
      {pkg.is_featured && (
        <Badge className="absolute top-2 right-2 bg-primary text-xs gap-1">
          <Sparkles className="h-3 w-3" />
          Phổ biến
        </Badge>
      )}
      <CardContent className="p-5 space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">
            {formatNumber(pkg.total_coins)}
          </div>
          <p className="text-sm text-muted-foreground">xu</p>
          {pkg.bonus_amount > 0 && (
            <Badge variant="outline" className="mt-1 text-xs text-green-600 border-green-200">
              +{formatNumber(pkg.bonus_amount)} bonus
            </Badge>
          )}
        </div>

        <div className="text-center">
          {pkg.discount_percent > 0 && (
            <span className="text-xs line-through text-muted-foreground mr-2">
              {formatNumber(pkg.price * (100 / (100 - pkg.discount_percent)))}đ
            </span>
          )}
          <span className="text-lg font-bold">{formatNumber(pkg.price)}đ</span>
        </div>

        <Button className="w-full" onClick={() => onPurchase(pkg.id)}>
          <ShoppingBag className="h-4 w-4 mr-2" />
          Mua ngay
        </Button>
      </CardContent>
    </Card>
  );
}

function SendGiftDialog() {
  const [open, setOpen] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const sendGift = useSendCoinGift();

  const handleSend = () => {
    if (!receiverId || !amount) return;
    sendGift.mutate(
      { receiverId, amount: parseInt(amount), message: message || undefined },
      { onSuccess: () => { setOpen(false); setReceiverId(""); setAmount(""); setMessage(""); } }
    );
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Gift className="h-4 w-4 mr-2" />
        Tặng xu
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Tặng xu cho bạn bè</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ID người nhận</Label>
            <Input value={receiverId} onChange={(e) => setReceiverId(e.target.value)} placeholder="Nhập ID người nhận" />
          </div>
          <div className="space-y-2">
            <Label>Số xu</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" min={1} />
          </div>
          <div className="space-y-2">
            <Label>Lời nhắn (tùy chọn)</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Chúc bạn học tốt!" />
          </div>
          <Button className="w-full" onClick={handleSend} disabled={sendGift.isPending || !receiverId || !amount}>
            {sendGift.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gift className="h-4 w-4 mr-2" />}
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
  const { data: wallet, isLoading: walletLoading } = useCoinWallet();
  const { data: txData, isLoading: txLoading } = useCoinTransactions({ limit: 50 });
  const { data: packages } = useCoinPackages();
  const purchaseCoins = usePurchaseCoins();
  const [paymentPurchase, setPaymentPurchase] = useState<CoinPurchase | null>(null);

  const transactions = txData?.transactions ?? [];

  return (
    <div className="container max-w-5xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-7 w-7 text-yellow-500" />
            Ví xu
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý xu và mua sắm</p>
        </div>
        <SendGiftDialog />
      </div>

      {/* Wallet summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Số dư</p>
              <p className="text-2xl font-bold">{walletLoading ? "..." : formatNumber(wallet?.balance ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Đã kiếm</p>
              <p className="text-2xl font-bold text-green-600">{walletLoading ? "..." : formatNumber(wallet?.total_earned ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Đã tiêu</p>
              <p className="text-2xl font-bold text-red-600">{walletLoading ? "..." : formatNumber(wallet?.total_spent ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="packages">Mua xu</TabsTrigger>
          <TabsTrigger value="transactions">Lịch sử giao dịch</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(packages ?? []).map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onPurchase={(id) =>
                  purchaseCoins.mutate(
                    { packageId: id, paymentMethod: "bank_transfer" },
                    { onSuccess: (purchase) => setPaymentPurchase(purchase) }
                  )
                }
              />
            ))}
          </div>
          {(!packages || packages.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có gói xu nào</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="p-4">
                {txLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Chưa có giao dịch nào
                  </p>
                ) : (
                  transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
                )}
              </div>
            </CardContent>
          </Card>
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
