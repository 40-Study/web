# Ví xu và thanh toán khoá học

Giữ ví xu; khoá học thanh toán trực tiếp bằng VND. Không có ví số dư VND.

## Luồng đã sửa

- `/coins`: chọn gói, tổng xu gốc + thưởng, số tiền VND, tạo hoặc tiếp tục đơn đang chờ; lịch sử đơn nạp có phân trang và nút mở lại. Biến động ví tải khi mở tab.
- `/cart`: tổng tiền chỉ tính khoá được chọn; không chọn thì tổng 0 và chặn thanh toán.
- `/checkout`: chống double submit, giữ idempotency key khi retry, tiếp tục đơn đã tạo, khoá voucher sau tạo đơn. Backend xoá đúng khoá đã đặt khỏi giỏ; frontend không gọi xoá toàn bộ giỏ.
- Đơn miễn phí chỉ chuyển thành công sau khi backend trả `completed`; không tạo yêu cầu chuyển khoản.
- `/checkout/success`: đọc trạng thái đơn thật; URL không phải bằng chứng thanh toán. Chỉ đơn completed có nút vào khoá học.
- Hộp chuyển khoản dùng thông tin ngân hàng từ backend, hỗ trợ sao chép, loading, lỗi có retry, đóng để thanh toán sau; cuộn được trên màn hình thấp.
- Verify xu dừng sau thành công/lỗi/đóng; cập nhật ví và lịch sử không invalidate chính query xác nhận. Kiểm tra thủ công đơn học không tự tạo thêm một lượt GET do invalidation.

## Cấu hình

Backend dùng `MB_BANK_NAME`, `MB_ACCOUNT_NO`, `BANK_ACCOUNT_NAME` và `TRANSACTION_SERVICE_HOST`, `TRANSACTION_SERVICE_PORT`, `TRANSACTION_SERVICE_TOKEN` theo cấu hình dự án. Không điền tài khoản ngân hàng mẫu khi env thiếu. Không đặt token đối soát trong biến NEXT_PUBLIC.

Không có luồng thanh toán thẻ/MoMo hoặc QR ngân hàng được xác nhận trong đợt sửa này. Thông tin chuyển khoản phải được cấu hình trước khi nhận tiền thật.

## Xác minh local ngày 15/10/2026

Chạy browser bằng tài khoản demo, khoá học QA và gRPC ngân hàng giả lập cục bộ. Không chuyển tiền thật; không bật RabbitMQ gửi email.

- Nạp 100 xu: số dư demo 590 → 690; lịch sử có một dòng +100, DB có đúng một bút toán cho purchase. Đóng và mở lại giữ cùng mã đơn.
- Mua một khoá QA giá 100.000 VND: double click tạo một order, một payment intent; đóng/mở lại giữ mã. Giả lập xác nhận → màn thành công, DB một enrollment. Hai khoá chưa chọn còn trong giỏ.
- Đăng ký QA miễn phí: double click tạo một order completed, một enrollment, không payment intent. Màn kết quả hiển thị Đăng ký thành công / Miễn phí.
- Tặng xu: đã kiểm tra trạng thái chưa có bạn bè và đóng dialog; chưa kiểm tra gửi tặng thành công trên browser.
- DevTools Network Chrome: `/api/coins/purchases` 201 một lần, `/api/coins/purchases/:id/verify` lỗi ngân hàng giả lập rồi retry 200, các lượt polling cách 5 giây; `/api/coins/wallet` 200 một lần sau completed. Không có vòng verify do cập nhật ví. Console có lỗi request khi chủ động giả lập ngân hàng unavailable; không có lỗi JS trên các tab cart/checkout/coins IAB đã đọc logs.
- Order endpoints đã đối chiếu log Next/server và DB; chưa quan sát trực tiếp toàn bộ flow order trong DevTools Network. Không coi bước này đã được xác nhận đầy đủ theo AGENTS.
- Kiểm thử tự động: 53 test giao dịch/frontend; thêm 3 test trạng thái trang kết quả. Backend kiểm thử PG cho tạo đơn xu đồng thời, sai số tiền, quyền sở hữu, cộng đúng một lần và không tự bịa tài khoản ngân hàng.

Đã dừng fixture và chạy lại API bằng env bình thường sau test. Các khoản QA là dữ liệu giả, không chứng minh đối soát ngân hàng thật hoạt động.
