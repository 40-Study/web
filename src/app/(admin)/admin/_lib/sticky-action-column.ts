/**
 * QA3-05: bảng admin rộng hơn màn 390px đẩy cột hành động ra khỏi tầm nhìn, không có dấu hiệu cuộn.
 * Ghim cột đó vào mép phải (cùng mẫu trang Người dùng): nền đục để hàng không lộ qua khi cuộn ngang,
 * đổ bóng nhẹ bên trái làm dấu hiệu "còn nội dung phía sau". Từ sm trở lên bảng đủ rộng nên giữ nguyên.
 */
const STICKY = "sticky right-0 z-10 shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.18)] sm:shadow-none";

/** className cho <th> của cột hành động. */
export const STICKY_ACTION_HEAD = `${STICKY} bg-muted/50`;

/** className cho <td> của cột hành động. */
export const STICKY_ACTION_CELL = `${STICKY} bg-card`;

/**
 * className cho khối nút trong ô hành động có nhiều nút: ở mobile xếp dọc và hẹp để cột ghim không che
 * hết bảng; từ sm xếp ngang như cũ.
 */
export const ACTION_BUTTON_GROUP = "flex min-w-[7.5rem] max-w-[8.5rem] flex-col items-stretch gap-2 sm:min-w-0 sm:max-w-none sm:flex-row sm:flex-wrap";
