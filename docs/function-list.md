# ForteX Web - Function List

> Tổng hợp toàn bộ chức năng theo giao diện người dùng web frontend.
> Mỗi chức năng được mapping đến API backend tương ứng.
> Cập nhật: 2026-08-08 (đối chiếu lại với route thực tế `backend/internal/router/*.go`)

---

## Mục lục

1. [Public (Không cần đăng nhập)](#1-public-không-cần-đăng-nhập)
2. [Authentication (Đăng nhập / Đăng ký)](#2-authentication-đăng-nhập--đăng-ký)
3. [Student Dashboard](#3-student-dashboard)
4. [Khám phá khóa học](#4-khám-phá-khóa-học)
5. [Học tập (Course Player)](#5-học-tập-course-player)
6. [Bài tập & Nộp bài](#6-bài-tập--nộp-bài)
7. [Lịch học](#7-lịch-học)
8. [Gamification (Thành tích & Xếp hạng)](#8-gamification-thành-tích--xếp-hạng)
9. [Ví xu (Coins)](#9-ví-xu-coins)
10. [AI Chat Tutor](#10-ai-chat-tutor)
11. [Bạn bè & Nhắn tin](#11-bạn-bè--nhắn-tin)
12. [Nhóm (Groups)](#12-nhóm-groups)
13. [Giỏ hàng & Thanh toán](#13-giỏ-hàng--thanh-toán)
14. [Vouchers của tôi](#14-vouchers-của-tôi)
15. [Cuộc thi (Contests)](#15-cuộc-thi-contests)
16. [Cài đặt tài khoản](#16-cài-đặt-tài-khoản)
17. [Gia đình (Family)](#17-gia-đình-family)
18. [Diễn đàn (Discussions)](#18-diễn-đàn-discussions)
19. [Teacher Workspace](#19-teacher-workspace)
20. [Live Classroom](#20-live-classroom)
21. [Parent Dashboard](#21-parent-dashboard)
22. [Admin Dashboard](#22-admin-dashboard)

---

## 1. Public (Không cần đăng nhập)

### 1.1 Landing Page `/`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Hero section | Giới thiệu nền tảng ForteX, CTA đăng ký | Không |
| Feature cards | Hiển thị tính năng nổi bật | Không |
| Student outcomes | Số liệu học viên thành công | Không |
| Instructor CTA | Kêu gọi giảng viên tham gia | Không |
| Thanh điều hướng public | Trang chủ, Khóa học, Giới thiệu, Liên hệ | Không |

### 1.2 Khám phá khóa học `/courses`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách khóa học | Hiển thị tất cả courses dạng grid | `GET /courses` |
| Banner carousel | Banner giới thiệu khóa học nổi bật | `GET /courses` |
| Tìm kiếm | Search khóa học theo từ khóa | `GET /courses?search=` |
| Lọc theo danh mục | Filter courses theo category | `GET /courses?category_id=` |
| Lọc theo giá | Filter miễn phí / trả phí | `GET /courses?is_free=` |
| Lọc theo đánh giá | Filter theo rating | `GET /courses?rating=` |
| Danh sách categories | Hiển thị tất cả danh mục | `GET /categories` |

### 1.3 Chi tiết khóa học `/courses/[slug]`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Thông tin khóa học | Tiêu đề, mô tả, objectives, requirements | `GET /courses/slug/:slug` |
| Thông tin giảng viên | Tên, avatar, bio của instructor | `GET /teachers/:id` |
| Syllabus | Danh sách sections + lessons | `GET /courses/:id/sections`, `GET /sections/:id/lessons` |
| Đánh giá (Reviews) | Danh sách đánh giá + rating | `GET /courses/:id/reviews` |
| Sidebar CTA | Giá, nút Enroll / Thêm vào giỏ / Mua ngay | `POST /courses/:id/enroll`, `POST /cart` |
| Nhập voucher | Áp dụng mã giảm giá trong sidebar | `GET /vouchers/code/:code` |

### 1.4 Diễn đàn `/discussions`, `/discussions/[slug]`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách bài viết | Feed các bài thảo luận | `GET /discussions` |
| Lọc theo category | Filter theo chủ đề | `GET /discussions?category=` |
| Chi tiết bài viết | Xem nội dung + comments | `GET /discussions/:slug` |
| Sidebar chủ đề | Danh sách chủ đề nổi bật | `GET /discussions` |
| Top thành viên | Thành viên tích cực nhất | `GET /leaderboard` |

### 1.5 Footer chung
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Về chúng tôi | Giới thiệu, Đội ngũ, Tin tức, Tuyển dụng | Không |
| Học tập | Lộ trình học, Khóa học AI, STEAM, Chứng chỉ | `GET /courses`, `GET /certificates` |
| Điều khoản | Điều khoản dịch vụ, Chính sách bảo mật | Không |

---

## 2. Authentication (Đăng nhập / Đăng ký)

### 2.1 Đăng ký `/register` → `/register/role` → `/register/form` → `/register/success`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Gửi OTP đăng ký | Nhập email nhận mã OTP | `POST /auth/register/request` |
| Xác thực OTP | Nhập mã OTP để xác thực | `POST /auth/register` |
| Chọn role | Chọn Student / Teacher / Parent | N/A (client-side) |
| Form đăng ký | Nhập thông tin cá nhân (họ tên, mật khẩu...) | `POST /auth/register` |
| Đăng ký thành công | Màn hình xác nhận | Không |

### 2.2 Đăng nhập `/login` → `/login/role`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Đăng nhập email/password | Form login cơ bản | `POST /auth/login` |
| Chọn role sau login | Chọn role nếu user có nhiều role | `POST /auth/select-role` |
| Đăng nhập organization | Login với context tổ chức | `POST /auth/login` + `POST /auth/select-role` |
| Chọn tài khoản con | Parent chọn child account để giám sát | `GET /me/children` |
| OAuth login | Đăng nhập qua Google/Facebook/GitHub | `GET /auth/oauth/:provider` |
| Linked accounts | Xem tài khoản liên kết | `GET /auth/linked-accounts` |
| Hủy liên kết OAuth | Gỡ liên kết tài khoản mạng xã hội | `DELETE /auth/linked-accounts/:provider` |

### 2.3 Quên mật khẩu `/forgot-password` → `/forgot-password/otp` → `/reset-password`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Yêu cầu reset | Gửi email nhận OTP | `POST /auth/reset-password/request` |
| Xác thực OTP | Nhập OTP để xác thực | `POST /auth/reset-password/request` |
| Đặt mật khẩu mới | Nhập mật khẩu mới | `POST /auth/reset-password` |

### 2.4 Chấp nhận lời mời `/accept-invitation`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Validate token | Kiểm tra token hợp lệ | `GET /invitations/validate/:token` |
| Phản hồi lời mời | Đồng ý / Từ chối | `POST /invitations/:id/respond` |

---

## 3. Student Dashboard

### 3.1 Trang chủ `/home`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Lời chào | Hiển thị tên + role người dùng | `GET /auth/me` |
| Hero banner | Banner khóa học đang học dở | `GET /enrollments` |
| Khóa học đã đăng ký | Grid các course cards với progress | `GET /enrollments` |
| Biểu đồ hoạt động | Thống kê thời gian học, XP | Không |
| Mini calendar | Lịch học sắp tới | `GET /me/timetable` |
| Upcoming schedule | Danh sách buổi học / deadline sắp tới | `GET /me/timetable` |
| Stats widgets | Số khóa học, giờ học, XP, achievements | `GET /enrollments`, `GET /achievements/me` |
| Chuyển đổi role | Switch giữa các role (Student/Teacher/Parent) | `POST /auth/switch-role`, `GET /auth/my-roles` |

### 3.2 Khóa học của tôi `/my-courses`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Hero khóa học hiện tại | Khóa học đang học dở (tiến độ cao nhất) | `GET /enrollments` |
| Danh sách khóa học | Tất cả khóa học đã enroll | `GET /enrollments` |
| Thanh tiến độ | Progress bar cho mỗi khóa học | `PUT /lessons/:id/progress` |
| Chứng chỉ | Danh sách chứng chỉ đã nhận | `GET /certificates` |
| Sidebar khóa học khác | Danh sách khóa học đang học khác | `GET /enrollments` |
| Sidebar thành tích | Achievement badges | `GET /achievements/me` |

### 3.3 Bài tập của tôi `/my-assignments`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Tabs phân loại | Tất cả / Đang làm / Sắp tới / Đã kết thúc | `GET /submissions/my/:assignmentId` |
| Danh sách bài tập | Tên, course, deadline, trạng thái | `GET /assignments` |
| Nộp bài | Submit code / file | `POST /submissions` |
| Trạng thái nộp bài | Đã nộp / Chưa nộp / Quá hạn | `GET /submissions/my/:assignmentId` |

---

## 4. Khám phá khóa học

### 4.1 Danh sách khóa học `/courses`
*Đã mô tả ở section 1.2*

### 4.2 Chi tiết khóa học `/courses/[slug]`
*Đã mô tả ở section 1.3. Khi đã đăng nhập có thêm:*

| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Đăng ký học | Enroll vào khóa học | `POST /courses/:id/enroll` |
| Hủy đăng ký | Unenroll khóa học | `DELETE /courses/:id/enroll` |
| Thêm vào giỏ hàng | Add course vào cart | `POST /cart` |
| Mua ngay | Tạo order trực tiếp | `POST /orders` |
| Kiểm tra trong giỏ | Check xem course đã có trong cart chưa | `GET /cart/check/:courseId` |
| Viết đánh giá | Tạo review cho khóa học | `POST /courses/:id/reviews` |
| Reaction review | Helpful / Not helpful | `POST /reviews/:id/reaction` |

---

## 5. Học tập (Course Player)

### 5.1 Course Player `/courses/[slug]/learn`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Video player | Xem video bài giảng (HLS) | `GET /hls/:upload_id/master.m3u8`, `GET /hls/:upload_id/:quality/:segment` |
| Lesson navigation | Sidebar phân cấp sections + lessons | `GET /courses/:id/sections`, `GET /sections/:id/lessons` |
| Trạng thái hoàn thành | Checkbox hoàn thành lesson | `PUT /lessons/:id/progress` |
| Lesson content tabs | Nội dung bài học (TOC) | `GET /lessons/:id/contents` |
| Video position tracking | Ghi nhớ vị trí video đang xem | `PUT /lessons/:id/progress` |

### 5.2 Bài tập trong khóa học `/courses/[slug]/exercises`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách exercises | Tất cả bài tập của khóa học | `GET /exercises` |
| Chi tiết bài tập | Đề bài, testcases | `GET /exercises/:id`, `GET /exercises/:id/testcases` |
| Làm bài tập coding | Code sandbox | `POST /exercises/:id/submit` |
| Chạy thử | Run code | `POST /submissions/run`, `POST /submissions/run-custom` |
| Nộp bài | Submit lời giải | `POST /exercises/:id/submit` |
| Kết quả | Danh sách submissions | `GET /exercises/:id/submissions`, `GET /exercises/:id/my-submissions` |
| Tiến độ content | Theo dõi hoàn thành | `GET /content-progress/:lessonContentId` |

---

## 6. Bài tập & Nộp bài

### 6.1 Làm bài tập coding
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Xem đề bài | Đọc yêu cầu bài tập | `GET /assignments/:id` |
| Code editor | Viết code trong sandbox | `GET /assignments/:id/sandbox` |
| Chạy thử với test | Run code với test cases có sẵn | `POST /submissions/run` |
| Chạy thử với custom input | Run code với input tự nhập | `POST /submissions/run-custom` |
| Chạy code tự do | Execute code không giới hạn | `POST /submissions/execute` |
| Nộp bài | Submit chính thức để chấm điểm | `POST /submissions` |
| Xem kết quả | Xem chi tiết submission (pass/fail test cases) | `GET /submissions/:id` |
| Lịch sử nộp bài | Xem tất cả lần nộp trước | `GET /submissions/my/:assignmentId` |

### 6.2 Làm quiz
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Bắt đầu quiz | Start quiz attempt | `POST /quizzes/:id/start` |
| Hiển thị câu hỏi | Từng câu hỏi một hoặc tất cả | `GET /quizzes/:quizId/questions` |
| Lưu câu trả lời | Auto-save / manual save | `POST /attempts/:attemptId/save-answer` |
| Tiến độ làm bài | Xem đã làm bao nhiêu câu | `GET /attempts/:attemptId/progress` |
| Nộp quiz | Submit toàn bộ bài quiz | `POST /quizzes/:id/submit` |
| Xem kết quả | Điểm số, đáp án đúng/sai | `GET /quizzes/:id/results` |
| Lịch sử làm quiz | Tất cả lần làm trước | `GET /quizzes/:id/attempts` |

> ⚠️ `quizService.getByLesson` (`GET /lessons/:lessonId/quizzes`), `getBySession` (`GET /sessions/:sessionId/quizzes`) và `trigger` (`POST /quizzes/:id/trigger`) **KHÔNG có route trong backend router** — web gọi sẽ 404 trừ khi backend implement.

---

## 7. Lịch học

### 7.1 Lịch học cá nhân `/schedule`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Calendar tuần | Hiển thị lịch dạng weekly grid (time columns) | `GET /me/timetable` |
| Thêm sự kiện cá nhân | Tạo personal event | `POST /me/events` |
| Sửa sự kiện | Cập nhật event | `PUT /me/events/:id` |
| Xóa sự kiện | Xóa event | `DELETE /me/events/:id` |
| Màu sắc theo môn | Color-coded theo khóa học | N/A (client-side) |
| Recurring events | Sự kiện lặp lại hàng tuần | `GET /classes/:classId/schedules` (sessionService) |
| Schedule events | Sự kiện từ lớp học, livestream | `GET /schedule/events` ⚠️ chưa có trong backend |
| Event tooltip | Xem chi tiết khi hover | `GET /schedule/events/:id` ⚠️ chưa có trong backend |

> ⚠️ `ScheduleService` (`/schedule/events/*`) gọi endpoint **chưa được register trong backend router** — lịch sự kiện có thể không load được. Lịch học (recurring) thực tế lấy từ `sessionService` (`/classes/:classId/schedules`, `/me/timetable`).

### 7.2 Điểm danh của tôi `/my-attendance`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Lịch sử điểm danh | Các buổi học + trạng thái có mặt/vắng | `GET /me/attendances` |
| Check-in | Điểm danh vào buổi học | `POST /sessions/:sessionId/check-in` |
| Check-out | Điểm danh ra buổi học | `POST /sessions/:sessionId/check-out` |

---

## 8. Gamification (Thành tích & Xếp hạng)

### 8.1 Bảng xếp hạng `/leaderboard`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Bảng xếp hạng | Top users theo XP | `GET /leaderboard` |
| Lọc theo thời gian | Ngày / Tuần / Tháng / Tất cả | `GET /leaderboard?period=` |
| Rank của tôi | Vị trí hiện tại của user | `GET /leaderboard/me` |
| League badges | Thẻ hạng (Đồng/Bạc/Vàng/Kim cương) | N/A (client-side từ XP) |
| XP hiển thị | Điểm kinh nghiệm của mỗi user | `GET /leaderboard` |

### 8.2 Thành tích `/achievements`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Tất cả achievements | Danh sách huy hiệu (common/rare/epic/legendary) | `GET /achievements` |
| Achievements của tôi | Huy hiệu đã đạt được | `GET /achievements/me` |
| Mở khóa achievement | Unlock khi đạt điều kiện | `POST /achievements/:id/unlock` |
| Skill tracking | Kỹ năng đã phát triển | `GET /achievements/me` |
| Certificates hiển thị | Chứng chỉ đã nhận | `GET /certificates` |

### 8.3 Public Profile `/profile/[userId]`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Thông tin công khai | Avatar, tên, bio | `GET /users/:id/public-profile` |
| Thành tích nổi bật | Featured achievements | `GET /users/:id/public-profile` |
| Hoạt động gần đây | Activity feed | `GET /users/:id/public-profile` |
| Stats | Số khóa học, XP, rank | `GET /users/:id/public-profile` |

---

## 9. Ví xu (Coins)

### 9.1 Ví xu `/coins`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Số dư xu | Hiển thị balance | `GET /coins/wallet` |
| Lịch sử giao dịch | Danh sách transactions (nhận, gửi, mua) | `GET /coins/wallet/transactions` |
| Mua gói xu | Danh sách packages để mua | `GET /coins/packages` |
| Chi tiết gói | Giá, số xu, mô tả | `GET /coins/packages/:id` |
| Tạo purchase | Chọn gói và thanh toán | `POST /coins/purchases` |
| Xác nhận mua | Verify purchase sau thanh toán | `POST /coins/purchases/:id/verify` |
| Lịch sử mua | Danh sách purchases | `GET /coins/purchases` |
| Tặng xu | Gửi xu cho bạn bè | `POST /coins/gift` |

---

## 10. AI Chat Tutor

### 10.1 AI Chat `/ai-chat`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Chat với AI | Giao diện chat với AI tutor | API riêng |
| Voice input | Nhập bằng giọng nói | Client-side Web Speech API |
| File attachments | Gửi file đính kèm | `POST /upload/any` |
| Chat history | Lịch sử hội thoại | API riêng |

---

## 11. Bạn bè & Nhắn tin

### 11.1 Bạn bè `/friends`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách bạn bè | Tất cả bạn bè đã kết nối | API riêng |
| Gợi ý kết bạn | Suggested friends | API riêng |
| Lời mời kết bạn | Pending friend requests | API riêng |
| Gửi lời mời | Add friend | API riêng |
| Nhắn tin nhanh | Mở conversation với bạn | `POST /conversations/direct` |

### 11.2 Nhắn tin `/messages`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách conversations | Tất cả cuộc trò chuyện | `GET /conversations` |
| Tin nhắn chưa đọc | Badge + danh sách | `GET /messages/unread` |
| Direct chat | Nhắn tin 1-1 | `GET /conversations/:id/messages` |
| Gửi tin nhắn | Soạn và gửi | `POST /conversations/:id/messages` |
| Sửa tin nhắn | Chỉnh sửa tin đã gửi | `PUT /conversations/:id/messages/:msgId` |
| Xóa tin nhắn | Xóa tin | `DELETE /conversations/:id/messages/:msgId` |
| Ghim tin nhắn | Pin message quan trọng | `POST /conversations/:id/messages/:msgId/pin` |
| Bỏ ghim | Unpin | `POST /conversations/:id/messages/:msgId/unpin` |
| Reaction | Emoji reaction vào tin nhắn | `POST /conversations/:id/messages/:msgId/reactions` |
| Xóa reaction | Gỡ reaction | `DELETE /conversations/:id/messages/:msgId/reactions/:emoji` |
| Đánh dấu đã đọc | Mark conversation as read | `POST /conversations/:id/read` |
| Tắt thông báo | Mute conversation | `POST /conversations/:id/mute` |
| Bật thông báo | Unmute conversation | `POST /conversations/:id/unmute` |
| Ghim hội thoại | Pin conversation | `POST /conversations/:id/pin` |
| Bỏ ghim hội thoại | Unpin conversation | `POST /conversations/:id/unpin` |
| Tìm kiếm tin nhắn | Search trong messages | `GET /messages/search` |

---

## 12. Nhóm (Groups)

### 12.1 Danh sách nhóm `/groups`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Khám phá nhóm | Tất cả groups public | `GET /groups` |
| Nhóm đã tham gia | Groups của tôi | `GET /groups/me/joined` |
| Nhóm sở hữu | Groups tôi tạo | `GET /groups/me/owned` |
| Tạo nhóm | Tạo group mới (public/private) | `POST /groups` |
| Chi tiết nhóm | Xem group detail | `GET /groups/:slug` |
| Tham gia nhóm | Join public group | `POST /groups/:id/join` |
| Rời nhóm | Leave group | `POST /groups/:id/leave` |
| Quản lý thành viên | Danh sách members | `GET /groups/:id/members` |
| Mời thành viên | Invite người khác | `POST /groups/:id/members/invite` |
| Phân quyền member | Set role (admin/member) | `PUT /groups/:id/members/:userId/role` |
| Xóa thành viên | Kick member | `DELETE /groups/:id/members/:userId` |
| Chặn thành viên | Ban member | `POST /groups/:id/members/:userId/ban` |
| Bỏ chặn | Unban member | `POST /groups/:id/members/:userId/unban` |
| Duyệt yêu cầu | Phê duyệt join request | `POST /groups/:id/requests/:reqId/approve` |
| Từ chối yêu cầu | Reject join request | `POST /groups/:id/requests/:reqId/reject` |
| Xem yêu cầu | Danh sách pending requests | `GET /groups/:id/requests` |

---

## 13. Giỏ hàng & Thanh toán

### 13.1 Giỏ hàng `/cart`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Xem giỏ hàng | Danh sách courses trong giỏ | `GET /cart` |
| Thêm vào giỏ | Add course vào cart | `POST /cart` |
| Xóa khỏi giỏ | Remove course | `DELETE /cart` |
| Xóa toàn bộ | Clear cart | `DELETE /cart/clear` |
| Chọn/Bỏ chọn | Select courses để thanh toán | N/A (client-side) |
| Áp dụng voucher | Nhập mã giảm giá | `GET /vouchers/code/:code` |
| Tính tổng tiền | Subtotal, discount, total | Client-side từ giá course + voucher |
| Chuyển đến checkout | Đi đến trang thanh toán | Chuyển hướng `/checkout` |

### 13.2 Thanh toán `/checkout`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Tóm tắt đơn hàng | Danh sách courses, giá, tổng | N/A (từ cart store) |
| Chọn phương thức TT | Thẻ / MoMo / Banking | Client-side |
| Nhập mã voucher | Áp dụng mã giảm giá | `GET /vouchers/code/:code` |
| Tạo đơn hàng | Submit order | `POST /orders` |
| Tạo payment intent | Khởi tạo thanh toán | `POST /orders/:id/payment-intent` |
| Kiểm tra thanh toán | Polling/waiting trạng thái | `GET /orders/:id/payment-status`, `POST /orders/:id/check-payment` |
| Hủy đơn | Cancel order | `POST /orders/:id/cancel` |

### 13.3 Thanh toán thành công `/checkout/success`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Xác nhận đơn hàng | Hiển thị order ID, trạng thái | `GET /orders/:id` |

### 13.4 Lịch sử đơn hàng
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách đơn hàng | Tất cả orders của user | `GET /orders/me` |

---

## 14. Vouchers của tôi

### 14.1 `/my-vouchers`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách vouchers đã lưu | Vouchers của tôi | `GET /vouchers/me` |
| Lưu voucher | Save voucher để dùng sau | `POST /vouchers/:id/save` |
| Bỏ lưu | Unsave voucher | `DELETE /vouchers/:id/save` |
| Vouchers công khai | Xem vouchers public | `GET /vouchers/public` |
| Nhập mã voucher | Tìm voucher theo code | `GET /vouchers/code/:code` |
| Trạng thái voucher | Active / Expired / Inactive | `GET /vouchers/me` |

---

## 15. Cuộc thi (Contests)

### 15.1 Danh sách cuộc thi `/contests`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách contests | Tất cả cuộc thi đang/sắp diễn ra | `GET /contests` |
| Chi tiết contest | Xem contest theo slug | `GET /contests/:slug` |
| Cuộc thi của tôi | Contests đã tham gia | `GET /contests/me` |
| Tìm kiếm / Lọc | Search + filter theo trạng thái | `GET /contests?search=&status=` |

### 15.2 Chi tiết cuộc thi `/contests/[slug]`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách bài toán | Problems của contest | `GET /contests/:id/problems` |
| Bảng xếp hạng | Leaderboard của contest | `GET /contests/:id/leaderboard` |
| Tham gia contest | Join contest | `POST /contests/:id/join` |
| Khu vực code | Code editor + submit | `POST /contests/:id/problems/:problemId/submit` |
| Timer | Đếm ngược thời gian | N/A (client-side) |
| Bài nộp của tôi | Submissions đã nộp | `GET /contests/:id/submissions/me` |

---

## 16. Cài đặt tài khoản

### 16.1 Settings Hub `/settings`
*Sidebar điều hướng đến tất cả mục cài đặt bên dưới*

### 16.2 Tài khoản (Account)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Đổi email | Cập nhật email | `PUT /auth/me` |
| Đổi mật khẩu | Change password | `PUT /auth/change-password` |
| Bảo mật | Cài đặt bảo mật | `PUT /auth/me` |
| Xóa tài khoản | Soft delete | `DELETE /auth/me` |

### 16.3 Hồ sơ (Profile)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Cập nhật tên | Display name | `PUT /auth/me` |
| Cập nhật avatar | Upload ảnh đại diện | `POST /upload` → `PUT /auth/me` |
| Cập nhật bio | Tiểu sử | `PUT /auth/me` |

### 16.4 Thông báo (Notifications)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Cài đặt email | Bật/tắt email notifications | `PUT /notifications/settings` |
| Cài đặt push | Bật/tắt push notifications | `PUT /notifications/settings` |
| Cài đặt reminder | Nhắc nhở lịch học, deadline | `GET /reminders/settings`, `PUT /reminders/settings` |

### 16.5 Giao diện (Appearance)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Chủ đề | Light / Dark mode | Client-side (localStorage) |
| Phông chữ | Chọn font chữ | Client-side |
| Ngôn ngữ | Tiếng Việt / English | Client-side |

### 16.6 Quyền riêng tư (Privacy)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Hiển thị profile | Public / Private | `GET /preferences/privacy`, `PUT /preferences/privacy` |
| Hiển thị hoạt động | Activity visibility | `PUT /preferences/privacy` |

### 16.7 Thiết bị (Devices) `/settings/devices`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách thiết bị | Các thiết bị đã đăng nhập | `GET /auth/devices` |
| Đăng xuất thiết bị | Logout 1 device | `POST /auth/logout` |
| Đăng xuất tất cả | Logout tất cả thiết bị khác | `POST /auth/logout-all` |

### 16.8 Liên kết tài khoản (Linked Accounts)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách liên kết | Google, Facebook, GitHub | `GET /auth/linked-accounts` |
| Liên kết mới | Thêm OAuth provider | `GET /auth/oauth/:provider` |
| Hủy liên kết | Disconnect OAuth | `DELETE /auth/linked-accounts/:provider` |

### 16.9 Trợ giúp `/help`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Help center | Trung tâm trợ giúp | Không |

---

## 17. Gia đình (Family)

### 17.1 Quản lý gia đình `/settings/family`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Mời phụ huynh | Gửi invitation đến parent | `POST /invitations/invite` |
| Danh sách đã gửi | Invitations đã gửi | `GET /invitations/sent` |
| Danh sách chờ | Invitations đang chờ phản hồi | `GET /invitations/pending` |
| Thu hồi lời mời | Revoke invitation | `POST /invitations/:id/revoke` |
| Danh sách con | Xem children đã liên kết | `GET /me/children` |

---

## 18. Diễn đàn (Discussions)

### 18.1 `/discussions`, `/discussions/[slug]`
*Đã liệt kê ở section 1.4. Khi đã đăng nhập có thêm:*

| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Tạo bài viết | Viết post mới | `POST /discussions` |
| Thêm bình luận | Comment vào post | `POST /discussions/:slug/comments` |
| Vote | Upvote/downvote post hoặc comment | `POST /discussions/:id/vote` |
| Bỏ vote | Remove vote | `DELETE /discussions/:id/vote` |
| Xóa bài viết | Delete post của mình | `DELETE /discussions/:id` |

---

## 19. Teacher Workspace

### 19.1 Lịch giảng dạy `/teacher/schedule`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Calendar hàng tuần | Xem lịch dạy theo tuần | `GET /schedule/events` ⚠️ chưa có trong backend |
| Thêm sự kiện | Tạo event giảng dạy | `POST /schedule/events` ⚠️ chưa có trong backend |
| Sửa sự kiện | Cập nhật event | `PUT /schedule/events/:id` ⚠️ chưa có trong backend |
| Xóa sự kiện | Xóa event | `DELETE /schedule/events/:id` ⚠️ chưa có trong backend |
| Dời lịch | Reschedule event | `PATCH /schedule/events/:id/reschedule` ⚠️ chưa có trong backend |
| Xem lịch lớp | Lịch classes đang dạy | `GET /class-schedules/teacher` ⚠️ chưa có; backend có `GET /classes/:classId/schedules` |

> ⚠️ Màn hình lịch giảng dạy phụ thuộc endpoint `/schedule/events` và `/class-schedules/teacher` **chưa được register trong backend**.

### 19.2 Quản lý khóa học `/teacher/courses`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách khóa học | Courses của teacher với search/filter | `GET /courses?instructor_id=` |
| Lọc theo trạng thái | Published / Draft / Archived | `GET /courses?status=` |
| Lọc theo loại | Video / Livestream / Hybrid | `GET /courses?type=` |
| Tạo khóa học mới | Multi-step wizard | `POST /courses` |

### 19.3 Tạo khóa học `/teacher/courses/create` (Wizard)
| Bước | Chức năng | API |
|------|-----------|-----|
| Basic info | Tiêu đề, mô tả, category, level, language | `POST /courses` |
| Thumbnail | Upload ảnh bìa khóa học | `POST /upload` |
| Pricing | Giá, discount, free/paid | `POST /courses` / `PUT /courses/:id` |
| Curriculum builder | Tạo sections, lessons kéo thả | `POST /courses/:id/sections`, `POST /sections/:id/lessons` |
| Sắp xếp sections | Reorder kéo thả | `PUT /courses/:id/sections/reorder` |
| Sắp xếp lessons | Reorder kéo thả | `PUT /sections/:id/lessons/reorder` |
| Video upload | Upload video bài giảng | `POST /videos/upload/init` → presigned URLs → chunks → complete |
| Theo dõi upload | Progress bar upload chunk | `GET /videos/upload/:upload_id/status` |
| Resume upload | Tiếp tục upload dang dở | `GET /videos/upload/:upload_id/resume` |
| Hủy upload | Abort upload | `DELETE /videos/upload/:upload_id` |

### 19.4 Chỉnh sửa khóa học `/teacher/courses/[id]/edit`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Sửa thông tin | Update course info | `PUT /courses/:id` |
| Sửa curriculum | Thêm/sửa/xóa sections, lessons | `PUT /courses/:id/sections/:id`, `DELETE /courses/:id/sections/:id` |
| Xóa khóa học | Delete course | `DELETE /courses/:id` |
| Thêm tags | Gán tags cho khóa học | `PUT /courses/:id` |

### 19.5 Quản lý bài giảng `/teacher/courses/[id]/lessons/[lessonId]`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Sửa lesson | Cập nhật nội dung lesson | `PUT /lessons/:id` |
| Thêm content | Tạo video/article/exercise content | `POST /lessons/:id/contents` |
| Sửa content | Cập nhật content | `PUT /lessons/:id/contents/:id` |
| Xóa content | Delete content | `DELETE /lessons/:id/contents/:id` |
| Sắp xếp content | Reorder nội dung | `PUT /lessons/:id/contents/reorder` |
| Thêm quiz | Tạo quiz cho lesson | `POST /quizzes` |
| Sửa quiz | Cập nhật quiz | `PUT /quizzes/:id` |
| Thêm câu hỏi | Tạo question cho quiz | `POST /quizzes/:id/questions` |
| Xóa câu hỏi | Delete question | `DELETE /quizzes/:id/questions/:qId` |
| Kích hoạt quiz | Trigger quiz cho học sinh | `POST /quizzes/:id/trigger` |

### 19.6 Quản lý lớp học (Classes)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Tạo lớp học | Tạo class trong course | `POST /courses/:id/classes` |
| Xem lớp học | Danh sách classes trong course | `GET /courses/:id/classes` |
| Sửa lớp | Cập nhật class info | `PUT /classes/:id` |
| Xóa lớp | Delete class | `DELETE /classes/:id` |
| Lịch học | Tạo lịch định kỳ cho class | `POST /classes/:id/schedules` |
| Buổi học | Tạo session cho class | `POST /classes/:id/sessions` |
| Generate sessions | Tự động tạo buổi học từ lịch | `POST /classes/:id/sessions/generate` |
| Gán giáo viên | Assign teacher vào class | `POST /classes/:id/teachers` |
| Gán học sinh | Enroll student vào class | `POST /classes/:id/students` |
| Xem danh sách | Students / Teachers trong class | `GET /classes/:id/students`, `GET /classes/:id/teachers` |
| Lên lịch content | Gán lesson content vào class với schedule | `POST /lesson-contents/:id/classes` |

### 19.7 Quản lý học sinh `/teacher/students`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách học sinh | Tất cả students của teacher | `GET /teachers/me/students` |
| Tìm kiếm | Search student theo tên/email | `GET /teachers/me/students?search=` |
| Lọc theo khóa học | Filter theo course | `GET /teachers/me/students?course_id=` |
| Lọc theo trạng thái | Active / Inactive | `GET /teachers/me/students?status=` |
| Gửi thông báo | Bulk notification đến students | `POST /notifications/send` |
| Xuất danh sách | Export student list | Không có API |

### 19.8 Chi tiết học sinh `/teacher/students/[id]`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Tiến độ học tập | Progress từng khóa học | `GET /enrollments?user_id=` |
| Bảng điểm | Điểm các bài tập, quiz | `GET /classes/:id/grades/student/:id` |
| Hoạt động | Activity log | Không |

### 19.9 Quản lý bài tập `/teacher/assignments`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách bài tập | Tất cả assignments của teacher | `GET /assignments` |
| Tạo bài tập | Chọn loại (quiz/code/document) | `POST /assignments` |
| Sửa bài tập | Cập nhật assignment | `PUT /assignments/:id` |
| Xóa bài tập | Delete assignment | `DELETE /assignments/:id` |
| Thêm test cases | Tạo test case cho code assignment | `POST /assignments/:id/testcases` |
| Import test cases | Import từ file | `POST /assignments/:id/testcases/import` |
| Xóa test case | Delete test case | `DELETE /assignments/:id/testcases/:tcId` |
| Publish | Công khai assignment cho học sinh | `POST /assignments/:id/publish` |
| Unpublish | Ẩn assignment | `POST /assignments/:id/unpublish` |
| Gán vào lớp | Assign assignment vào class | Thông qua class schedule |

### 19.10 Chấm bài `/teacher/assignments/[id]/submissions`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách bài nộp | Submissions của assignment | `GET /submissions/assignment/:id` |
| Xem bài nộp | Chi tiết submission của học sinh | `GET /submissions/:id` |
| Chấm điểm | Grade submission (manual) | Thông qua grade system |
| Nhận xét | Feedback cho học sinh | Thông qua grade system |

### 19.11 Quản lý cuộc thi `/teacher/contests`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách contests | Tất cả contests của teacher | `GET /contests/me` |
| Tạo contest | Multi-step contest builder | `POST /contests` |
| Sửa contest | Cập nhật contest | `PUT /contests/:id` |
| Xóa contest | Delete contest | `DELETE /contests/:id` |
| Publish / Unpublish | Quản lý trạng thái contest | `POST /contests/:id/publish` |
| Quản lý bài toán | CRUD problems trong contest | `GET/POST /contests/:id/problems`, `PUT/DELETE /contests/:id/problems/:problemId` |
| Xem kết quả | Leaderboard contest | `GET /contests/:id/leaderboard` |

### 19.12 Phân tích `/teacher/analytics`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Analytics livestream | Số người tham gia, thời gian xem | `GET /analytics/livestream/:sessionId` |
| Analytics assignment | Tỉ lệ nộp bài, điểm trung bình | `GET /analytics/assignment/:assignmentId` |
| Analytics participants | Thống kê học sinh tham gia | `GET /analytics/participants/:sessionId` |
| Biểu đồ (recharts) | Trực quan hóa dữ liệu | N/A (client-side) |

> ⚠️ Dashboard analytics của teacher còn gọi các endpoint `/teacher/stats`, `/teacher/courses`, `/teacher/activity`, `/teacher/analytics`, `/teacher/assignments`, `/teacher/exams` (qua `use-teacher.ts`) **KHÔNG có trong backend router** — phần stats/biểu đồ có thể không load được.

### 19.13 Ví giảng viên `/teacher/wallet`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Số dư ví | Teacher wallet balance | `GET /wallet/teacher/me` |
| Lịch sử giao dịch | Transactions của teacher | `GET /wallet/teacher/transactions` |
| Cập nhật bank info | Thông tin tài khoản ngân hàng | `PUT /wallet/teacher/bank-info` |

### 19.14 Quản lý học viên khóa học `/teacher/courses/[id]/members`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách học viên | Enrolled students | `GET /enrollments?course_id=` |
| Bulk operations | Thao tác hàng loạt | Không |

---

## 20. Live Classroom

### 20.1 Phòng học trực tuyến `/rooms/[roomName]`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Video conferencing | LiveKit video call nhiều người | LiveKit SDK; token + serverUrl truyền qua query params |
| Tạo phòng | Khởi tạo LiveKit room | `POST /livekit/rooms` ⚠️ chưa có trong backend |
| Thông tin phòng | Lấy thông tin room | `GET /livekit/rooms/:name` ⚠️ chưa có trong backend |

> ⚠️ `livekitService` (`/livekit/*`) gọi endpoint **chưa register trong backend router**. Phòng live thực tế nhận `token`/`serverUrl` qua URL (`/rooms/[roomName]?token=...&serverUrl=...`), nên flow video vẫn chạy nếu token được cấp từ nguồn khác (vd. server riêng / LiveKit Cloud).
| Whiteboard | Bảng vẽ tương tác real-time | `GET /whiteboard/:sessionId/snapshot`, `POST /whiteboard/:sessionId/event` |
| Lưu whiteboard | Save snapshot | `POST /whiteboard/:sessionId/snapshot` |
| Con trỏ real-time | Hiển thị vị trí chuột của participants | WebSocket |
| Screen sharing | Chia sẻ màn hình | `POST /livestream/:id/screenshare/start`, `POST /livestream/:id/screenshare/stop` |
| Recording | Ghi lại buổi học | LiveKit recording |
| Chat trong lớp | Chat real-time | `POST /chat/send`, `GET /chat/:sessionId/messages` |
| Ghim tin nhắn | Pin message quan trọng | `POST /chat/:id/pin`, `POST /chat/:id/unpin` |
| Xóa tin nhắn | Delete chat message | `DELETE /chat/:id` |
| Quản lý lớp học | Mute, kick participants | `POST /livestream/:id/mute`, `POST /livestream/:id/kick` |
| Khóa whiteboard | Chỉ teacher vẽ được | `POST /livestream/:id/lock-whiteboard`, `POST /livestream/:id/unlock-whiteboard` |
| Keyboard shortcuts | Phím tắt điều khiển | Client-side |

### 20.2 Tabs trong phòng Live (Teacher)
| Tab | Chức năng | API |
|-----|-----------|-----|
| Chat | Quản lý chat lớp học | `GET /chat/:sessionId/messages` |
| Whiteboard | Bảng vẽ + lock/unlock | `GET /whiteboard/:sessionId/snapshot` |
| Participants | Danh sách người tham gia | `GET /livestream/:id/participants` |
| Assignment | Giao bài tập trực tiếp | `POST /assignments` |
| Host Tools | Công cụ điều khiển lớp | `POST /livestream/:id/mute`, kick, screenshare |

### 20.3 Livestream Management
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Tạo livestream | Lên lịch buổi live | `POST /livestream` |
| Bắt đầu live | Start stream | `POST /livestream/:id/start` |
| Kết thúc live | End stream | `POST /livestream/:id/end` |
| Tham gia | Join livestream | `POST /livestream/:id/join` |
| Rời đi | Leave livestream | `POST /livestream/:id/leave` |
| Thông tin livestream | Xem chi tiết | `GET /livestream/:id` |

---

## 21. Parent Dashboard

### 21.1 Xem thông tin con `/parent/children/[id]`
*Tabs cho parent xem thông tin học tập của con:*

#### Tab: Tổng quan (Overview)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Stats tổng quan | Số khóa học, giờ học, streak, XP | `GET /parent/children/:id/overview` |
| Khóa học đang học | Danh sách courses với progress | `GET /parent/children/:id/overview` |

#### Tab: Khóa học (Courses)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách khóa học | Courses con đã enroll | `GET /parent/children/:id/courses` |
| Tiến độ từng khóa | Progress bar mỗi course | `GET /parent/children/:id/courses` |

#### Tab: Điểm số (Grades)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Bảng điểm | Điểm các môn học | `GET /parent/children/:id/grades` |

#### Tab: Lịch học (Schedule)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Lịch hàng tuần | Timetable của con | `GET /parent/children/:id/schedule`, `GET /parent/children/:id/timetable` |

#### Tab: Điểm danh (Attendance)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Thống kê điểm danh | Số buổi có mặt/vắng/muộn | `GET /parent/children/:id/attendance` |
| Lịch sử điểm danh | Chi tiết từng buổi | `GET /parent/children/:id/attendance` |

#### Tab: Bài tập (Assignments)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Thống kê bài tập | Số bài đã nộp/chưa nộp/quá hạn | `GET /parent/children/:id/assignments` |
| Danh sách bài tập | Chi tiết từng assignment | `GET /parent/children/:id/assignments` |

---

## 22. Admin Dashboard

### 22.1 Tổng quan `/admin`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Stats cards | Tổng số organizations, roles, permissions | `GET /organizations`, `GET /system-roles`, `GET /permissions` |
| Activity feed | Hoạt động gần đây trong hệ thống | Không |

### 22.2 Quản lý vai trò `/admin/roles`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách system roles | Tất cả roles hệ thống | `GET /system-roles` |
| Tạo role mới | Create system role | `POST /system-roles` |
| Xem chi tiết role | Role info + permissions + users | `GET /system-roles/:id` |
| Sửa role | Update role | `PUT /system-roles/:id` |
| Xóa role | Soft delete | `DELETE /system-roles/:id` |
| Khôi phục role | Restore deleted role | `PATCH /system-roles/:id/restore` |
| Gán permissions | Add/set permissions cho role | `POST /system-roles/:id/permissions`, `PUT /system-roles/:id/permissions` |
| Xóa permissions | Remove permissions khỏi role | `DELETE /system-roles/:id/permissions` |
| Xem users của role | Users có role này | `GET /system-roles/:id/users` |

### 22.3 Quản lý tổ chức `/admin/organizations`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách organizations | Tất cả tổ chức | `GET /organizations` |
| Tạo organization | Create org mới | `POST /organizations` |
| Xem chi tiết | Org info + members | `GET /organizations/:id` |
| Sửa organization | Update org | `PUT /organizations/:id` |
| Xóa organization | Delete org | `DELETE /organizations/:id` |
| Quản lý members | Xem members của org | `GET /organizations/:id/members` |
| Quản lý org roles | CRUD org roles | `POST /org-roles`, `GET /org-roles`, `PUT /org-roles/:id`, `DELETE /org-roles/:id` |
| Gán permissions org role | Quản lý permissions của org role | `POST /org-roles/:id/permissions`, `PUT /org-roles/:id/permissions` |
| Users theo org role | Xem users với org role | `GET /organizations/:id/roles/:role_id/users` |

### 22.4 Quản lý phân quyền `/admin/permissions`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách permissions | Tất cả permissions theo category | `GET /permissions` |
| Xem chi tiết | Permission detail | `GET /permissions/:id` |
| Sửa permission | Update permission | `PUT /permissions/:id` |

### 22.5 Báo cáo hệ thống `/admin/reports`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Báo cáo tài chính | Transaction reports | API riêng |
| Lọc theo thời gian | Period filter | API riêng |
| Lọc theo trạng thái | Status filter | API riêng |

### 22.6 Nhật ký hoạt động `/admin/audit-logs`
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách audit logs | Xem log hoạt động admin | API riêng |
| Mức độ | INFO / WARN / CRITICAL | API riêng |

### 22.7 Quản lý báo cáo nội dung (Content Reports)
| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách reports | Tất cả báo cáo nội dung vi phạm | `GET /reports` |
| Xem chi tiết | Report detail | `GET /reports/:id` |
| Cập nhật trạng thái | Xử lý report | `PUT /reports/:id/status` |
| Xóa report | Delete report | `DELETE /reports/:id` |

---

## Phụ lục: Notification System (Dùng chung)

| Chức năng | Mô tả | API |
|-----------|-------|-----|
| Danh sách thông báo | Notifications của user | `GET /notifications` |
| Số thông báo chưa đọc | Badge count trên header | `GET /notifications/unread-count` |
| Đánh dấu đã đọc | Mark 1 notification as read | `PATCH /notifications/:id/read` |
| Đánh dấu tất cả đã đọc | Mark all as read | `PATCH /notifications/read-all` |
| Xóa thông báo | Delete notification | `DELETE /notifications/:id` |
| Cài đặt thông báo | Notification preferences | `GET /notifications/settings`, `PUT /notifications/settings` |

---

## Tổng kết

| Vai trò | Số màn hình chính | Số chức năng |
|---------|-------------------|--------------|
| Public (không login) | 6 | ~30 |
| Auth (login/register) | 15 | ~25 |
| Student | 20 (thêm: exercises, contests, my-attendance) | ~160 |
| Teacher | 14 | ~90 |
| Parent | 1 (6 tabs) | ~18 |
| Admin | 6 | ~35 |
| Live Classroom | 1 (đa tab) | ~18 |
| **Tổng** | **~63 màn hình** | **~380 chức năng** |

### Ghi chú (cập nhật 2026-08-08)
- ⚠️ **Chưa có trong backend router** — web gọi endpoint không được register trong `backend/internal/router/` (sẽ 404). Các module này gồm: `/live-sessions/*`, `/livekit/*`, `/schedule/events/*`, `/parent-notifications/*`, `/class-schedules/*`, `/teacher/*` (stats/courses/activity/analytics/assignments/exams), `/auth/select-org`, `/live/rooms/:name/token`, `GET /lessons/:lessonId/quizzes`, `GET /sessions/:sessionId/quizzes`, `POST /quizzes/:id/trigger`, và contract upload cũ của `video.service.ts`.
- Các chức năng thuần client-side (theme, font, language) không yêu cầu API.
- Đối chiếu chi tiết từng endpoint xem `docs/api-checklist.md`.
