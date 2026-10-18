# AI Studio, quiz bài học và Judge0

## Các màn đã triển khai

- `/teacher/ai`: trang chat độc lập theo bố cục Open Design, lịch sử hội thoại, đính kèm tài liệu, chọn/tạo/import SKILL.md, preview/chỉnh slide hoặc câu hỏi ở cạnh chat. Mobile chuyển giữa Hội thoại và Kết quả.
- `/teacher/tools`: chuyển tiếp sang AI Studio.
- Khoá học giáo viên → bài học → Thêm nội dung → Bài tập → Trắc nghiệm: trình soạn 4 phương án, đúng 1 đáp án, giải thích, làm thử, tạo câu hỏi bằng AI từ prompt/tài liệu. Kết quả AI được thêm hoặc thay thế sau khi giáo viên chọn áp dụng; chỉ ghi DB khi Lưu bài trắc nghiệm.
- Không có mục Luyện code ở sidebar hay trang `/code`. Monaco chỉ mở khi vào contest code hoặc bài tập code trong khoá học; đề bài, test mẫu, stdin và kết quả nằm cùng màn hình. Link bài tập có `?exercise=<id>` để chọn đúng nội dung cả khi bài học kèm video. Runtime Monaco/worker phục vụ từ `/monaco/vs`, tự chép khi install/dev/build, không phụ thuộc CDN.
- `/teacher/contests/create`: chọn Trắc nghiệm hoặc Lập trình. Đề code có điểm, CPU/RAM, test mẫu và test ẩn; tạo/sửa bản nháp, gửi duyệt theo luồng contest hiện có.
- `/contests/:slug/play`: với CODING, bắt đầu đồng hồ bằng thao tác rõ ràng; chạy thử không tính điểm; nộp chấm mọi test; lịch sử và điểm tốt nhất mỗi bài; xác nhận/cancel kết thúc. Backend giữ hạn nộp và quyền tham gia.
- `/contests/:slug/result`: kết quả code, lịch sử các lần nộp; test ẩn không trả input/output về học sinh.

## Cấu hình

Trong `backend/.env` (không đưa key vào web):

```dotenv
VIETTEL_AI_API_KEY=
VIETTEL_AI_BASE_URL=https://viettelai.vn/model-as-a-service/v1
VIETTEL_AI_MODEL=DeepSeek-V4-Flash
JUDGE0_URL=http://localhost:12358
```

Khởi động lại backend sau khi đổi env. AI adapter gọi MaaS qua `POST <VIETTEL_AI_BASE_URL>/chat/completions`, Bearer API key và model từ env. Ngày 18/10/2026 đã xác nhận `GET /models` trả 200 với key local và có model `DeepSeek-V4-Flash`, đồng thời tạo trắc nghiệm thật trên AI Studio thành công. Không dùng mã `DeepSeek-V4-Flash-0731` từ cấu hình mẫu AIZ vì danh sách model hiện tại không có mã đó. Key local được lấy từ biến `VIETTELAI_API_KEY` của AIZ và đặt vào `VIETTEL_AI_API_KEY` của backend; không ghi key vào source, frontend, tài liệu hoặc log. Khi thiếu cấu hình, trang hiển thị trạng thái chưa cấu hình.

Tạo nội dung chỉ bắt đầu khi giáo viên bấm gửi. Request có timeout, chặn gửi đồng thời và hỗ trợ huỷ upstream; không có polling hoặc retry tự động cho mutation tạo nội dung. AI Studio gọi backend cùng origin; browser không gọi trực tiếp ViettelAI. Kết quả được kiểm tra schema và số lượng trước khi trả về preview. Phiên bản cũ chỉ được thay sau khi nhận kết quả hợp lệ.

### Xác minh ViettelAI thật — 18/10/2026

- Browser đăng nhập giáo viên, tạo 2 câu hỏi Python qua dịch vụ thật; mỗi câu có 4 phương án và giải thích. Làm thử đạt 2/2, trạng thái chấm chỉ lưu ở browser.
- Tạo 3 slide Python thành công khoảng 5 giây. Chrome DevTools Network xác nhận bấm đúp Gửi chỉ có một `POST /api/open-design/generate` trả 200; preview có đúng 3 slide, phiên bản v1.
- Phát hiện và sửa bấm đúp Dừng: khi huỷ nhanh, nút đổi thành Gửi trước cú bấm thứ hai, gây gửi lại. Kiểm thử hồi quy xác nhận cú bấm thứ hai bị chặn, lần bấm Gửi tiếp theo vẫn hoạt động.
- Kiểm tra lại DevTools Network sau sửa: một `GET /api/open-design/status` 200 khi tải trang, một generate bị cancelled và một `POST /api/open-design/cancel` 200 khi bấm đúp Dừng. Không phát sinh generate thứ hai hoặc refetch status; bản v1 với 3 slide còn nguyên và UI mở khoá.
- Console Chrome không có runtime error; chỉ có thông tin React DevTools/WebSocket. Browser trong app không có warning/error. Quét key thật trong 206 JavaScript chunks không có kết quả; `.env` backend được Git bỏ qua.
- Go tests `TestOpenDesign` tại service/router đạt. Frontend composer/project/preview: 7 tests đạt; lint composer và typecheck đạt.
- Chứng cứ và phạm vi chi tiết: `test-artifacts/viettel-ai/verification.md`. Đây là xác minh tạo quiz/slide và huỷ request; chưa kiểm thử upload tài liệu hoặc export với kết quả từ provider thật trong lượt này.

Judge0 dùng `JUDGE0_URL`; mặc định dev là `http://localhost:2358`, Docker là `http://judge_server:2358`. Compose hiện tại của máy này ánh xạ cổng 12358. Khởi động bằng `docker compose up -d judge_server judge_worker` trong backend. Web gọi `/api/lessons/:lessonId/exercises/:id/{run,submit}` và `/api/contests/:id/code/{run,submit}`, không gọi RapidAPI trực tiếp và không cần public Judge key.

Judge0 gửi/nhận text qua Base64 để lỗi biên dịch có byte không phải UTF-8 vẫn đọc được. Một job chỉ POST một lần; nếu Judge trả trạng thái queued, backend chỉ GET token đó đến hết hạn. Code chạy với network tắt. Lỗi hạ tầng không được ghi thành điểm 0 hay Accepted.

## Dữ liệu và phạm vi

- Chat, phiên bản, tài liệu trích xuất và custom skills AI hiện lưu localStorage theo user, tối đa 8 cuộc chat / 10 phiên bản mỗi cuộc; chưa đồng bộ DB qua thiết bị. Nháp IDE cũng lưu trong trình duyệt. Quiz bài học, contest, bài nộp và điểm thật lưu DB.
- Skills là hướng dẫn tạo nội dung; không thực thi shell, cài plugin hay cho AI quyền chạy code. Chỉ hai output có schema: slide và quiz một đáp án đúng.
- PDF có text, DOCX, PPTX, TXT, MD; mỗi file tối đa 3 MB, tối đa 3 tài liệu trong chat và tổng 60.000 ký tự. Chưa có OCR cho PDF scan.
- Slide có 3 theme, ghi chú, trình chiếu, phiên bản, xuất PPTX và HTML. Quiz có sửa câu/đáp án/giải thích, làm thử, chấm điểm, xuất HTML/JSON. HTML quiz là form luyện tập offline, chứa đáp án để tự chấm; không dùng làm đề thi bảo mật.
- Contest code: 1–10 bài, 1–10 test/bài, ít nhất một test công khai, CPU 1–10 giây, RAM 32–256 MB; tổng một lần chấm tối đa 60 giây. Tính điểm theo tỷ lệ test đạt, giữ lần có điểm tốt nhất mỗi bài. Form tạo code chưa cung cấp giải voucher/chứng nhận; việc xếp hạng dùng chung pipeline contest.
- Tài khoản demo do seeder tạo: `teacher1@demo.com`, `student1@demo.com`, mật khẩu `Demo@123`; ngoài ra có teacher2/student2/admin/parent demo. `go run ./cmd/seed` tạo dữ liệu demo idempotent; không reset bài nộp của người đã làm.
- Contest demo: `/contests/demo-code-judge0`.

## Open Design và design token

Repo nguồn được clone tại `../open-design`, commit `ae321ab2e6097e15d42f41412a40e82540ecba79`. UI được chuyển sang Next/React của ForteX theo các pattern composer, plus menu, conversation/artifact split và slide rail của Open Design. Không chạy nguyên daemon/CLI Open Design.

`npm run design:sync` đọc token ForteX, tạo DESIGN.md/tokens.css cho web và backend. Các token bổ sung chỉ scope trong teaching tools. License và attribution tại `src/components/open-design/OPEN-DESIGN-LICENSE` và `NOTICE.md`.

## Kiểm thử thực tế ngày 15/10/2026

Đã chạy browser với tài khoản DB thật và dữ liệu demo. AI được kiểm thử bằng provider fixture local, có thông báo DEMO; fixture đã tắt sau kiểm thử. Judge0 dùng container thật.

- AI: upload TXT, gắn/import skill, tạo slide/quiz, dùng ngữ cảnh tài liệu và lịch sử, hiểu số lượng trong prompt, chuyển slide sang quiz; edit/lưu phiên bản; rollback confirm/cancel; trình chiếu chuyển slide; PPTX tải được và kiểm tra 3 slide/3 notes/nội dung sửa; quiz preview 1/2 và 2/2, đổi đáp án; tải HTML; dừng tác vụ và lỗi provider giữ phiên bản cũ.
- Bài học: giáo viên tạo quiz 2 câu bằng AI, đổi key và nội dung phương án, preview 2/2, lưu; học sinh bắt đầu/làm/nộp, server trả 100%, đáp án và giải thích đúng, tiến độ 5/5 bài. Phát hiện và sửa refetch enrollment hai lần; sửa chọn lại cùng đáp án lưu lặp; lỗi nộp giữ câu trả lời và cho thử lại.
- Contest: tạo/sửa bản nháp code với test ẩn, gửi duyệt và xem đề đã khoá; học sinh đăng ký, bắt đầu, chạy thử, nộp sai/đúng/lỗi runtime/lỗi biên dịch. DB xác nhận 4 bài nộp tương ứng, một Accepted 100 điểm và điểm tổng vẫn 100 sau các lần lỗi. Double click chỉ tạo một bản nháp/một bài nộp; kết thúc confirm/cancel và trạng thái cuối đúng.
- Monaco contextual: giáo viên tạo bài tập Python, lưu đúng starter/ngôn ngữ/test mẫu/test ẩn; học sinh vào từ danh sách bài tập khoá học, chạy thử stdout `5`, nộp sai 0/2 và đúng 2/2, hoàn thành bài; double click không tạo hai bài nộp. Tắt Judge hiển thị lỗi, giữ mã/điểm và không ghi bài nộp; bật lại thử nộp thành công. Contest Monaco đổi C++/Python giữ nháp riêng, reload giữ mã; lỗi biên dịch chỉ tạo một job Judge cho cả bộ test, giữ điểm tốt nhất; kết thúc confirm/cancel và khoá nộp đúng.
- Console: không có runtime error trong các luồng mới; session học sinh dùng 127.0.0.1 có cảnh báo WS đổi host, và màn khoá học cũ có cảnh báo tối ưu ảnh.
- Network: đối chiếu request proxy Next và request upstream fixture/Judge, cùng trạng thái DB. Các mutation generate/documents/cancel, contest/code, quiz/create/start/submit và execute đã kiểm tra. Không thấy gửi mutation lặp trong luồng cuối; polling của Judge là GET token sau queued, không POST lại job.
- Giới hạn xác minh: chưa điều khiển được tab DevTools Network bằng công cụ hiện tại; log request không thay thế việc xác nhận trực tiếp tab Network theo AGENTS.md. Chưa chạy dịch vụ Viettel AI thật. Browser chặn mở `file://` cho HTML export nên chỉ xác nhận file tải và nội dung, chưa chạy bản HTML tải về trong tab độc lập. PDF/PPTX upload chưa test đầy đủ trên UI; parser DOCX/TXT và kiểm tra cấu trúc PPTX được test riêng. Không coi đây là kiểm thử mọi màn cũ của toàn nền tảng.

## Livestream demo

`cd backend && go run ./cmd/seed-livestream` tạo riêng workspace demo, chạy lại giữ nguyên ID và trạng thái buổi học. Tài khoản `teacher.live@demo.com`, mật khẩu `Demo@123`, có hồ sơ giáo viên, khoá `demo-lop-hoc-truc-tiep`, lớp DEMO-LIVE, hai học sinh `student1@demo.com`/`student2@demo.com` đã ghi danh, bài học liên kết đúng session livestream. Không reset tài khoản có sẵn nếu không khớp danh tính demo. Lệnh từ chối môi trường production.

Livestream QA: giáo viên demo đăng nhập, mở lịch và bắt đầu buổi bằng nút mới trong chi tiết sự kiện; học sinh vào từ bài học cùng session. LiveKit thật kết nối 2 người; giơ tay đến giáo viên, chat gửi/lưu/nhận thời gian thực. Đã sửa đếm local participant hai lần, tắt Next prefetch cho link phòng (tránh join trước click), sửa API lớp live gọi cùng-origin proxy và dùng chung refresh cookie; effect đọc user không còn gọi lại GET session/assignments. Cấu hình ICE local tại `backend/docker-compose.livekit-local.yaml`; xem hướng dẫn backend để khởi động. Camera/mic, chia sẻ màn hình và ghi hình chưa được xác nhận bằng thiết bị thật.

Kiểm tra bổ sung bảng vẽ: mở/đóng và đổi quyền không còn tự POST bảng trống; chỉ sau một thao tác vẽ hình mới có một POST snapshot. Hình nhận được ở học sinh và còn nguyên khi mở lại; backend lưu một phần tử. Đã thêm kiểm thử chặn echo từ remote, không ghi snapshot khi load/đổi viewport và huỷ debounce khi unmount.

## Cập nhật UI ngày 15/10/2026

AI Studio dùng layout và sidebar giáo viên tại `/teacher/ai`. Trang đầu có composer trung tâm, thẻ bắt đầu slide/quiz/skill; khi có hội thoại, chat và preview nằm cạnh nhau. Lịch sử mở theo yêu cầu; câu trả lời có thẻ mở bản tạo, sao chép và trạng thái chờ/huỷ dựa trên request thật. Retry cùng prompt/file/skill không thêm trùng tin nhắn hoặc lặp tin nhắn đó trong history gửi provider. Đã đối chiếu HomeHero, ExecutionShell và chat styles của repo Open Design; attribution trong NOTICE.

Contest code có màn làm bài tập trung, đề và Monaco hai cột, editor sáng/tối, console đầu vào/kết quả, xem từng test, lịch sử bài nộp và tổng kết sau kết thúc. Bảng xếp hạng coding mở từ lúc bắt đầu cuộc thi, gồm người có ít nhất một bài nộp; quiz vẫn giữ chính sách công bố riêng. Không thêm polling BXH: nộp/kết thúc chỉ đánh dấu cache cũ, tải khi người dùng mở tab. Bài code trong bài học dùng chung editor và kết quả Judge0, giữ nháp và tiến trình.

Lịch dùng FullCalendar với tháng/tuần/ngày, mini-calendar, lọc nguồn, chọn/kéo khung giờ và dialog giữ lỗi khi lưu thất bại. Lịch học sinh và phụ huynh bao gồm livestream theo lớp. Worker nhắc trước 15 phút và đến giờ tới giáo viên, học sinh đang học trong lớp và phụ huynh có quyền theo dõi chuyên cần; ID thông báo chống tạo trùng khi retry/chạy đồng thời. Huỷ/đổi giờ không dùng lịch cũ để gửi nhắc.

Kiểm thử bổ sung bằng browser: tạo lịch, sửa giờ, kéo đổi ngày, chặn lịch quá khứ, validation giờ kết thúc, cancel/confirm xoá; học sinh nhận thông báo vào phòng và phụ huynh mở đúng lịch của con. Monaco bài học chạy thử và double-click nộp; contest mới `demo-code-studio` đăng ký, bắt đầu, sai 0/3, chạy thử đúng, nộp 3/3 = 100 điểm, xem test ẩn, xem BXH khi đang thi, huỷ xác nhận, kết thúc, lịch sử và tổng kết. DB cuối: 2 bài nộp, 100 điểm, có finished_at. Proxy ghi đúng 1 start, 1 run, 2 submit cho hai lần nộp chủ động, 1 finish; double-click không tạo thêm mutation. Log tại `test-artifacts/code-ai-ui-2026-10-15.log`.

AI browser: tạo slide, chat chỉnh v2, lỗi provider, retry giữ một tin nhắn, huỷ yêu cầu chậm giữ bản cũ; tạo quiz từ thẻ khởi tạo, chặn nộp thiếu đáp án và chấm thử 3/3 đúng. Provider local nhận một request mỗi thao tác, có đúng current/history/skill; huỷ upstream được xác nhận. Provider kiểm thử đã tắt và backend trả về env thật, chưa có cấu hình Viettel AI. Không xác nhận chất lượng/nội dung của dịch vụ Viettel thật.

Typecheck và lint các file đổi đạt; 17 test frontend liên quan đạt; backend kiểm thử PostgreSQL contest code/live leaderboard, nhắc lịch và Judge polling đạt. Console các màn code không có runtime error; có cảnh báo đổi host WebSocket do dùng 127.0.0.1. Trong lúc khởi động lại backend có GET 502 và retry, đã tải lại thành công. Console AI không có lỗi runtime. Chưa xác nhận trực tiếp DevTools Network: browser connector không cung cấp Network, Chrome connector lỗi tải policy; số request trên dựa vào log proxy/provider và DB, không coi là đã hoàn tất bước DevTools theo AGENTS.md.
