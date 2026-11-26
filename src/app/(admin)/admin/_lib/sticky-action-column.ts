/**
 * QA3-05: bảng admin rộng hơn màn 390px đẩy cột hành động ra khỏi tầm nhìn, không có dấu hiệu cuộn.
 * Ghim cột đó vào mép phải (cùng mẫu trang Người dùng): nền đục để hàng không lộ qua khi cuộn ngang,
 * đổ bóng nhẹ bên trái làm dấu hiệu "còn nội dung phía sau". Từ sm trở lên bảng đủ rộng nên giữ nguyên.
 */

/**
 * QA7-A01 (Người dùng): ở 1280px bảng (1038px) rộng hơn khung (942px) nên cột "Hành động" ghim đè lên "Đăng nhập cuối"
 * (mất ngày). Chỉ ghim khi cần hoặc vô hại: dưới `sm` (390px, QA3-05: bảng rộng gấp đôi màn hình, không ghim thì nút
 * Khoá/Mở khoá khuất) và từ `2xl` (1536px). Từ `sm` tới dưới `2xl` là cột cuối bình thường, cuộn ngang được.
 * Dùng cho cả <th> và <td>; nền đục đặt riêng ở từng nơi.
 * QA8-A03: các bảng Đơn hàng/Khoá học/Rút tiền/Kiểm duyệt dùng cùng quy tắc (trước đó ghim từ sm nên ở 1280px đè 35px lên cột Ngày tạo).
 */
export const PIN_BELOW_SM_AND_FROM_2XL = "sticky right-0 z-10 sm:static 2xl:sticky";

const STICKY = `${PIN_BELOW_SM_AND_FROM_2XL} shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.18)] sm:shadow-none`;

/** className cho <th> của cột hành động. */
export const STICKY_ACTION_HEAD = `${STICKY} bg-gray-50 dark:bg-gray-900`;

/** className cho <td> của cột hành động. */
export const STICKY_ACTION_CELL = `${STICKY} bg-white dark:bg-gray-950`;

/**
 * className cho khối nút trong ô hành động có nhiều nút: ở mobile xếp dọc và hẹp để cột ghim không che
 * hết bảng; từ sm xếp ngang như cũ.
 */
export const ACTION_BUTTON_GROUP = "flex min-w-[7.5rem] max-w-[8.5rem] flex-col items-stretch gap-2 sm:min-w-0 sm:max-w-none sm:flex-row sm:flex-wrap";

/**
 * QA4-A10: ở 390px cột ghim vẫn che các cột sát nó (Số tiền/Trạng thái ở Rút tiền, Gửi lúc ở Kiểm duyệt) — đúng
 * những thứ admin cần xem trước khi bấm. Dưới sm, đưa các giá trị đó lên ô đầu (MOBILE_SUMMARY) và ẩn cột riêng
 * của chúng (HIDDEN_BELOW_SM); từ sm trở lên bảng như cũ.
 */
export const HIDDEN_BELOW_SM = "hidden sm:table-cell";
export const MOBILE_SUMMARY = "mt-1 flex flex-wrap items-center gap-2 text-xs sm:hidden";
