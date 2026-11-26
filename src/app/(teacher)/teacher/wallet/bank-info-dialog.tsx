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
import {
  BANK_ACCOUNT_NAME_MAX_LENGTH,
  BANK_NAME_MAX_LENGTH,
  validateBankInfo,
  type BankInfoInput,
} from "@/lib/bank-info-validation";

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
  // Lỗi chỉ hiện sau khi người dùng rời ô hoặc bấm Lưu, để không đỏ ngay khi mới mở hộp thoại.
  const [touched, setTouched] = useState<Partial<Record<keyof BankInfoInput, boolean>>>({});

  const { mutate: updateBankInfo, isPending } = useUpdateBankInfo();

  // Sync form with current values when dialog opens
  useEffect(() => {
    if (open) {
      setBankName(currentBankName ?? "");
      setAccountNumber(currentAccountNumber ?? "");
      setAccountName(currentAccountName ?? "");
      setTouched({});
    }
  }, [open, currentBankName, currentAccountNumber, currentAccountName]);

  const errors = validateBankInfo({ bankName, accountNumber, accountName });
  const shown = (field: keyof BankInfoInput) => (touched[field] ? errors[field] : undefined);
  const touch = (field: keyof BankInfoInput) => setTouched((prev) => ({ ...prev, [field]: true }));

  function handleSubmit() {
    if (Object.keys(errors).length > 0) {
      setTouched({ bankName: true, accountNumber: true, accountName: true });
      return;
    }
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
            <label htmlFor="bank-name" className="text-sm font-medium">Tên ngân hàng</label>
            <Input
              id="bank-name"
              placeholder="VD: Vietcombank, MB Bank, ..."
              value={bankName}
              maxLength={BANK_NAME_MAX_LENGTH}
              aria-invalid={!!shown("bankName")}
              aria-describedby={shown("bankName") ? "bank-name-error" : undefined}
              onChange={(e) => setBankName(e.target.value)}
              onBlur={() => touch("bankName")}
              className="mt-1"
            />
            <FieldError id="bank-name-error" message={shown("bankName")} />
          </div>
          <div>
            <label htmlFor="bank-account-number" className="text-sm font-medium">Số tài khoản</label>
            <Input
              id="bank-account-number"
              placeholder="Nhập số tài khoản..."
              inputMode="numeric"
              autoComplete="off"
              value={accountNumber}
              // Không đặt maxLength: dán số quá dài sẽ bị trình duyệt cắt lặng lẽ thành một số tài khoản KHÁC mà vẫn hợp lệ;
              // để validateBankInfo báo "6 đến 20 chữ số".
              aria-invalid={!!shown("accountNumber")}
              aria-describedby={shown("accountNumber") ? "bank-account-number-error" : undefined}
              onChange={(e) => setAccountNumber(e.target.value)}
              onBlur={() => touch("accountNumber")}
              className="mt-1"
            />
            <FieldError id="bank-account-number-error" message={shown("accountNumber")} />
          </div>
          <div>
            <label htmlFor="bank-account-name" className="text-sm font-medium">Tên chủ tài khoản</label>
            <Input
              id="bank-account-name"
              placeholder="Nhập tên chủ tài khoản..."
              value={accountName}
              maxLength={BANK_ACCOUNT_NAME_MAX_LENGTH}
              aria-invalid={!!shown("accountName")}
              aria-describedby={shown("accountName") ? "bank-account-name-error" : undefined}
              onChange={(e) => setAccountName(e.target.value)}
              onBlur={() => touch("accountName")}
              className="mt-1"
            />
            <FieldError id="bank-account-name-error" message={shown("accountName")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
            Lưu thông tin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-destructive">
      {message}
    </p>
  );
}
