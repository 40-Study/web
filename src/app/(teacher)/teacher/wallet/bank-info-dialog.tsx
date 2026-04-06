"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUpdateBankInfo } from "@/hooks/queries/use-wallet";

interface BankInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBankName?: string;
  currentAccountNumber?: string;
  currentAccountName?: string;
}

export function BankInfoDialog({
  open,
  onOpenChange,
  currentBankName,
  currentAccountNumber,
  currentAccountName,
}: BankInfoDialogProps) {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const { mutate: updateBankInfo, isPending } = useUpdateBankInfo();

  // Sync form with current values when dialog opens
  useEffect(() => {
    if (open) {
      setBankName(currentBankName ?? "");
      setAccountNumber(currentAccountNumber ?? "");
      setAccountName(currentAccountName ?? "");
    }
  }, [open, currentBankName, currentAccountNumber, currentAccountName]);

  const isValid = bankName.trim() && accountNumber.trim() && accountName.trim();

  function handleSubmit() {
    if (!isValid) return;
    updateBankInfo(
      {
        bank_name: bankName.trim(),
        bank_account_number: accountNumber.trim(),
        bank_account_name: accountName.trim(),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thông tin tài khoản ngân hàng</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Tên ngân hàng</label>
            <Input
              placeholder="VD: Vietcombank, MB Bank, ..."
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Số tài khoản</label>
            <Input
              placeholder="Nhập số tài khoản..."
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tên chủ tài khoản</label>
            <Input
              placeholder="Nhập tên chủ tài khoản..."
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
            Lưu thông tin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
