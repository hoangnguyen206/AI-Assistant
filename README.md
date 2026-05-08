# 🎓 LMS AI Assistant

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-green)
![Status](https://img.shields.io/badge/Status-Active-success)

Tiện ích mở rộng trên trình duyệt (Chrome Extension) giúp tích hợp AI trực tiếp vào các hệ thống học tập trực tuyến (LMS / Portal VNU). 

## 🌟 Câu chuyện ra đời (Tại sao lại có cái này?)
Bạn đang làm bài tập trên hệ thống...
Thấy một câu khó, thay vì phải làm chuỗi thao tác cồng kềnh:
> *Bôi đen → Copy → Chuyển tab sang ChatGPT/Gemini → Paste → Chờ AI gõ → Chuyển tab lại → Dò kết quả...*

Trông rất là mệt mỏi đúng không? Với **LMS AI Assistant**, bạn chỉ cần bấm đúng **1 NÚT** ngay trên trang làm bài, AI sẽ phân tích đề, tự chọn đáp án và giải thích tường tận ngay dưới câu hỏi luôn. Thời gian tiết kiệm được mời bạn làm thêm ván game hoặc uống ly trà sữa! 🧋

## ✨ Tính năng nổi bật

- 🎯 **Tương thích hoàn hảo**: Hỗ trợ tốt các bài tập dạng trắc nghiệm (Multiple Choice) và điền từ (Fill-in) trên VNU Portal / LMS.
- 🔌 **Hỗ trợ API Đa nguồn**: Không lo hết quota! Bạn có thể cắm key tự do từ nhiều nguồn:
  - Google Gemini
  - OpenAI (ChatGPT)
  - Groq, Anthropic, DeepSeek...
  - 🚀 Đặc biệt tương thích xuất sắc với **[9router](https://github.com/decolua/9router)** — nền tảng gom chung hạ tầng model AI siêu tiện lợi.
- 🎨 **Định dạng hiển thị Đẹp (Rich Output)**: Có thể bật chế độ render công thức toán học chuẩn LaTeX (SVG sắc nét) và Markdown siêu đẹp. Nếu thích tối ưu token, bạn có thể tắt đi để nhận text thuần.
- ⚡ **Auto Ask-All (Hỏi tất cả)**: Chỉ với một click (hoặc phím tắt `Alt + A`), AI sẽ cân hết toàn bộ câu hỏi có trên màn hình.
- 💬 **Khung Chat nổi (Floating Chat)**: Bấm `Alt + C` để mở ngay một khung chat AI có khả năng kéo thả, hỗ trợ cả việc đính kèm hình ảnh để hỏi thêm.
- 📦 **Tối ưu Chi phí**: Tích hợp cơ chế Cache dữ liệu thông minh trong 24h. Hỏi lại câu đã hỏi sẽ không tốn thêm 1 đồng token nào!

---

## 📸 Hình ảnh minh họa (Showcase)

*(⚠️ Ghi chú: Hãy thay link hình ảnh của bạn vào các mục bên dưới để hoàn thiện README nhé!)*

**1. Format Text Thuần vs Định dạng Toán học Đẹp**
> *Với tính năng Rich Output, các công thức được render chuẩn chỉnh thay vì text thuần thô ráp.*
![Minh họa Format](link_anh_minh_hoa_format_dep_va_xau_cua_ban_o_day)

**2. Tính năng "Hỏi tất cả" (Ask-All)**
> *Nút bấm thần thánh: Bấm 1 nhát giải quyết cả đề thi.*
![Hỏi tất cả các câu hỏi](link_anh_minh_hoa_nut_ask_all_cua_ban_o_day)

**3. Khung Chat AI Nổi (Floating Chat)**
> *Trò chuyện trực tiếp và đính kèm hình ảnh ngay trong tab làm bài.*
![Khung chat nổi](link_anh_minh_hoa_floating_chat_cua_ban_o_day)

**4. Thống kê & Quản lý API**
> *Bảng điều khiển trực quan trên Popup.*
![Bảng thống kê](link_anh_minh_hoa_bang_thong_ke_cua_ban_o_day)

---

## 🚀 Hướng dẫn cài đặt

Do đây là extension chạy "cây nhà lá vườn" chưa đưa lên Chrome Web Store, bạn cần tự cài đặt qua Developer Mode:

1. Clone thư mục dự án này về máy hoặc tải xuống file `.zip` và giải nén.
2. Mở trình duyệt Chrome / Cốc Cốc / Edge / Brave.
3. Truy cập vào trang quản lý Tiện ích mở rộng: `chrome://extensions/`
4. Bật công tắc **Developer mode** (Chế độ dành cho nhà phát triển) ở góc trên bên phải màn hình.
5. Nhấn nút **Load unpacked** (Tải tiện ích đã giải nén).
6. Trỏ đến thư mục chứa mã nguồn vừa giải nén. Thế là xong! Tiện ích đã xuất hiện trên trình duyệt của bạn.

---

## 🛠 Hướng dẫn sử dụng

1. **Cấu hình API Key**:
   - Nhấn vào biểu tượng extension ở góc phải trình duyệt.
   - Chọn nhà cung cấp (VD: 9router, Gemini, OpenAI).
   - Chọn Model mong muốn và dán **API Key** của bạn vào.
   - Nhấn **Lưu cài đặt**.
   - **💡 Mẹo cực hay với 9router:** 
     Nếu bạn sử dụng [9router](https://github.com/decolua/9router) để quản lý API, highly recommend dùng **OpenAI Codex** (setup trong mục OAuth). 
     - **Lưu ý xác minh:** OpenAI hiện yêu cầu verify số điện thoại. Mẹo cho bạn là hãy thuê số điện thoại Mỹ ảo (US phone number) trên các trang dịch vụ cho thuê code (SMS active). Chi phí cực kỳ rẻ, chỉ tầm **$0.07 cho 1 tài khoản Gmail** (bạn tự Google tìm hiểu thêm nha).
     - Dù đây chỉ là account **Free**, nhưng cái hay của 9router là bạn có thể add thả ga rất nhiều account để hệ thống tự động **xoay tua (rotate)**. Cứ thế mà dùng xả láng không lo hết quota! 🤑
   
2. **Quẩy thôi**:
   - Truy cập vào bài kiểm tra/quiz trên VNU Portal hoặc LMS.
   - Dưới mỗi câu hỏi giờ đây sẽ xuất hiện thêm một nút **🤖 Hỏi AI**. Nhấn vào để xem điều kỳ diệu.
   - Phím tắt thần thánh:
     - `Alt + A`: Yêu cầu AI làm tất cả câu hỏi trên trang.
     - `Alt + C`: Mở / Đóng nhanh khung Chat nổi.

---

## ⚠️ LỜI CẢNH BÁO (DISCLAIMER)

- **Về tính năng theo dõi của hệ thống (Tracking / Anti-cheat)**: Project này **CHƯA ĐƯỢC TEST** với các cơ chế giám sát kỳ thi phức tạp (như log sự kiện chèn DOM, phát hiện hoạt động extension, blur tab...). 
- **Trách nhiệm pháp lý**: Công cụ này được tạo ra hoàn toàn vì mục đích học tập, nghiên cứu và tối ưu hóa quy trình tra cứu kiến thức cá nhân. **Tác giả KHÔNG CHỊU BẤT CỨ TRÁCH NHIỆM NÀO** (nhận 0 điểm, cấm thi, đình chỉ học...) nếu bạn lạm dụng nó để gian lận trong các bài thi quan trọng hay vi phạm quy chế học tập.
- 👉 **Trách nhiệm hoàn toàn thuộc về người sử dụng! Hãy là một người dùng thông thái!** 😇

---

## 🤝 Đóng góp & Phát triển

Project vẫn đang được cập nhật và tối ưu. Rất hoan nghênh các bản Pull Request sửa lỗi, nâng cấp logic lấy DOM câu hỏi hay làm đẹp thêm giao diện!

Nếu bạn thấy hữu ích, đừng tiếc 1 ⭐️ cho repo nhé! Mọi đóng góp xin vui lòng mở Issue.
