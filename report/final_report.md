# BÁO CÁO ĐỒ ÁN: HỆ THỐNG QUẢN LÝ NHÀ HÀNG THÔNG MINH (SMART RESTAURANT)

## 1. Tổng quan dự án (Project Overview)

### 1.1. Giới thiệu

Smart Restaurant là hệ thống quản lý nhà hàng thông minh, được phát triển nhằm số hóa toàn bộ quy trình vận hành của một nhà hàng hiện đại. Hệ thống giải quyết các vấn đề thường gặp trong mô hình nhà hàng truyền thống như: sai lệch đơn hàng do ghi chép thủ công, thời gian chờ đợi lâu, khó khăn trong theo dõi trạng thái món ăn, và thiếu công cụ phân tích doanh thu.

Với Smart Restaurant, khách hàng có thể tự đặt món bằng cách quét mã QR tại bàn, theo dõi trạng thái đơn hàng theo thời gian thực và thanh toán trực tuyến. Nhân viên phục vụ nhận thông báo tức thời trên điện thoại, bếp có màn hình hiển thị chuyên dụng để quản lý các món cần chế biến, và quản lý có dashboard tổng hợp để theo dõi hoạt động kinh doanh.

### 1.2. Mục tiêu dự án

Mục tiêu chính:
- Xây dựng hệ thống đặt món tự phục vụ (self-ordering) qua mã QR
- Tạo kênh giao tiếp thời gian thực giữa khách hàng, nhân viên và bếp
- Cung cấp công cụ quản lý menu, bàn, đơn hàng và báo cáo cho quản lý nhà hàng

Mục tiêu phụ:
- Giảm thiểu sai sót trong quá trình ghi nhận đơn hàng
- Rút ngắn thời gian từ khi đặt món đến khi phục vụ
- Cung cấp dữ liệu để phân tích xu hướng kinh doanh

### 1.3. Đối tượng người dùng

Hệ thống phục vụ 4 nhóm người dùng chính:

| Đối tượng | Vai trò | Giao diện sử dụng |
|-----------|---------|-------------------|
| Khách hàng (Customer) | Xem menu, đặt món, theo dõi đơn hàng, thanh toán | Customer Web App (Mobile) |
| Nhân viên phục vụ (Waiter) | Xác nhận đơn, phục vụ món, xử lý thanh toán | Waiter Dashboard |
| Nhân viên bếp (Kitchen Staff) | Xem danh sách món cần nấu, cập nhật trạng thái | Kitchen Display System |
| Quản lý (Admin) | Quản lý menu, bàn, nhân viên, xem báo cáo | Admin Dashboard |

### 1.4. Kiến trúc hệ thống

Hệ thống được thiết kế theo mô hình 3 lớp (3-Tier Architecture):

Lớp trình diễn (Presentation Tier):
- Customer Web App: Xây dựng bằng Next.js 16.1, thiết kế Mobile-First, hỗ trợ PWA
- Admin Dashboard: Xây dựng bằng Next.js 16, giao diện Desktop-First với responsive tablet

Lớp xử lý (Application Tier):
- Backend API: Phát triển trên NestJS 11, kiến trúc module hóa
- Real-time Engine: Socket.io 4.8 cho thông báo thời gian thực
- Authentication: JWT với access token và refresh token
- Payment Gateway: Tích hợp VNPay sandbox

Lớp dữ liệu (Data Tier):
- MySQL 8.0: Lưu trữ dữ liệu quan hệ với 23 bảng
- TypeORM: ORM để tương tác với database
- Binary Storage: Lưu hình ảnh trực tiếp trong database (LONGBLOB)

### 1.5. Công nghệ sử dụng

| Thành phần | Công nghệ | Phiên bản |
|------------|-----------|-----------|
| Frontend Framework | Next.js | 16.0 / 16.1 |
| UI Library | React | 19.0 |
| Styling | Tailwind CSS | 4.0 |
| Backend Framework | NestJS | 11.0 |
| Runtime | Node.js | 20+ |
| Database | MySQL | 8.0 |
| ORM | TypeORM | 0.3 |
| Real-time | Socket.io | 4.8 |
| Authentication | JWT, bcrypt | - |
| Payment | VNPay | Sandbox |
| Package Manager | Yarn | 4.12.0 |
| Language | TypeScript | 5.0 |
---

## 2. Team Information (Thông tin nhóm)
- **Nguyễn Minh Hiếu** (23120124) - Team Lead & Customer App Architect
- **Huỳnh Thái Toàn** (23120175) - System Architect & Payment Specialist
- **Phạm Quốc Nam Anh** (23120111) - Backend Specialist & Reporting
---

## 3. Kế hoạch thực hiện (Project Plan)

### 3.1. Tổng quan tiến độ

Dự án được triển khai trong 9 tuần, bắt đầu từ giai đoạn phân tích yêu cầu đến khi hoàn thiện triển khai và báo cáo. Quy trình phát triển theo mô hình Agile với các sprint ngắn, cho phép điều chỉnh linh hoạt theo phản hồi.

### 3.2. Lộ trình chi tiết theo tuần

| Tuần | Giai đoạn | Công việc chính | Kết quả đầu ra |
|------|-----------|-----------------|----------------|
| 1 | Khởi tạo & Phân tích | Xác định phạm vi dự án, phân tích yêu cầu từ 4 nhóm người dùng, khảo sát các hệ thống tương tự | Hiểu rõ yêu cầu, phạm vi dự án |
| 2 | Thiết kế kiến trúc | Thiết kế kiến trúc 3-tier, thiết kế ERD với 23 bảng, định nghĩa API endpoints | Sơ đồ kiến trúc, ERD, API Specs |
| 3 | Thiết kế UI/UX | Xây dựng Design System "Bento Minimalist", thiết kế wireframe và prototype | DESIGN_SYSTEM.md, Mockup các màn hình |
| 4 | Backend Core | Thiết lập NestJS, triển khai Authentication (JWT), phân quyền RBAC, kết nối MySQL | Backend API cơ bản với auth hoạt động |
| 5 | Admin Frontend | Phát triển giao diện quản trị: quản lý menu, danh mục, bàn ăn, sinh QR code | Admin Dashboard MVP |
| 6 | Customer Frontend | Phát triển giao diện khách hàng: xem menu, giỏ hàng, đặt món qua QR | Customer Web App MVP |
| 7 | Real-time & Payment | Tích hợp Socket.io cho thông báo realtime, tích hợp VNPay, Kitchen Display System | Hệ thống realtime và thanh toán |
| 8 | Testing & Optimization | Kiểm thử chức năng, sửa lỗi, tối ưu hiệu năng, responsive mobile | Hệ thống ổn định, đã test |
| 9 | Deployment & Report | Triển khai public, viết hướng dẫn sử dụng, hoàn thiện báo cáo | Hệ thống live, báo cáo hoàn chỉnh |

### 3.3. Các mốc quan trọng (Milestones)

| Mốc | Tuần | Tiêu chí hoàn thành |
|-----|------|---------------------|
| M1: Thiết kế hoàn tất | Tuần 3 | ERD được duyệt, Design System hoàn chỉnh, API Specs đầy đủ |
| M2: Backend MVP | Tuần 4 | Đăng nhập/đăng ký hoạt động, CRUD menu/table/order hoạt động |
| M3: Frontend MVP | Tuần 6 | Khách có thể quét QR, xem menu, đặt món thành công |
| M4: Integration | Tuần 7 | Realtime hoạt động giữa Customer-Waiter-Kitchen, VNPay thanh toán được |
| M5: Production Ready | Tuần 9 | Hệ thống deploy thành công, không có lỗi critical |

### 3.4. Công cụ quản lý dự án

Quản lý source code: GitHub repository với nhánh chính là main và phát triển trên các feature branches

Giao tiếp: Discord cho trao đổi hàng ngày, Google Meet cho họp

Quản lý task: GitHub Issues

Tài liệu: Markdown files trong repository

---

## 4. Functionalities Analysis (Phân tích tính năng)

Dựa trên yêu cầu nghiệp vụ, hệ thống được thiết kế với các nhóm tính năng cốt lõi sau. Trong phần này, các tính năng nổi bật và phức tạp sẽ được mô tả chi tiết về cách triển khai, còn các chức năng CRUD cơ bản sẽ được giới thiệu tổng quan.

---

### 4.1. Nhóm tính năng dành cho Khách hàng (Customer)

#### 4.1.1. Đặt món qua QR Code (Tính năng nổi bật)

Đây là tính năng cốt lõi của hệ thống, cho phép khách hàng tự đặt món mà không cần gọi nhân viên. Quy trình hoạt động như sau:

**Bước 1 - Tạo QR Code cho bàn:**
Khi admin tạo một bàn mới trong hệ thống, backend sẽ tự động sinh ra một mã token duy nhất cho bàn đó. Token này được tạo bằng cách mã hóa ID của bàn và ID nhà hàng, đảm bảo mỗi bàn có một mã không thể đoán được. Sau đó, hệ thống sử dụng thư viện qrcode để tạo hình ảnh QR Code chứa đường link: https://customer.app/menu?token=abc123xyz

**Bước 2 - Khách hàng quét QR:**
Khi khách hàng dùng điện thoại quét mã QR tại bàn, trình duyệt sẽ mở trang menu với token trong URL. Frontend gửi token này lên backend để xác thực.

**Bước 3 - Backend giải mã và nhận diện bàn:**
Backend nhận token, giải mã để lấy ra ID bàn và ID nhà hàng. Nếu token hợp lệ và bàn đang hoạt động, hệ thống trả về thông tin bàn (số bàn, vị trí) để hiển thị cho khách. Nếu token sai hoặc bàn đã bị vô hiệu hóa, hệ thống từ chối truy cập.

**Bước 4 - Liên kết đơn hàng với bàn:**
Khi khách đặt món, hệ thống tự động gán đơn hàng vào đúng bàn dựa trên token đã xác thực. Điều này loại bỏ hoàn toàn việc nhân viên phải hỏi "Bàn số mấy?" và giảm thiểu sai sót.

**Lợi ích của cách triển khai này:**
- Token có thể được làm mới định kỳ để tăng bảo mật
- Mỗi bàn có QR riêng, không thể dùng lẫn
- Khách không cần tải app, chỉ cần quét QR là dùng được ngay
- Nhà hàng có thể theo dõi bàn nào đang có khách qua trạng thái đơn hàng

#### 4.1.2. Giỏ hàng thông minh với lưu trữ cục bộ (Tính năng nổi bật)

Giỏ hàng được thiết kế để hoạt động mượt mà ngay cả khi mất kết nối mạng tạm thời, đồng thời không làm mất dữ liệu khi khách vô tình đóng trình duyệt.

**Cách triển khai:**
Hệ thống sử dụng Session Storage của trình duyệt để lưu giỏ hàng. Mỗi khi khách thêm, sửa, hoặc xóa món, dữ liệu được đồng bộ ngay lập tức xuống storage. Điểm đặc biệt là hệ thống chỉ lưu thông tin tối thiểu cần thiết (ID món, tên, giá, số lượng, ghi chú) thay vì toàn bộ dữ liệu món ăn. Điều này giúp tiết kiệm dung lượng lưu trữ và tăng tốc độ đọc/ghi.

**Tính năng ghi chú đặc biệt:**
Mỗi món trong giỏ hàng có thể kèm theo ghi chú riêng. Ví dụ: khách gọi Phở Bò và ghi "Ít hành, thêm giá, nước béo riêng". Ghi chú này sẽ được hiển thị rõ ràng trên màn hình bếp để đầu bếp chế biến đúng yêu cầu.

**Tính giá tự động:**
Khi khách chọn các tùy chọn bổ sung (ví dụ: size lớn +10.000đ, thêm trứng +5.000đ), hệ thống tự động tính lại tổng giá của món và cập nhật tổng tiền giỏ hàng ngay lập tức.

#### 4.1.3. Thanh toán điện tử qua VNPay (Tính năng nổi bật)

Tích hợp cổng thanh toán VNPay cho phép khách thanh toán trực tuyến mà không cần chờ nhân viên mang máy POS đến bàn.

**Quy trình thanh toán:**

Bước 1 - Khách nhấn nút Thanh toán: Frontend gửi yêu cầu lên backend kèm theo mã đơn hàng, tổng tiền, và địa chỉ IP của khách.

Bước 2 - Backend tạo URL thanh toán: Sử dụng thư viện VNPay chính thức, backend tạo ra một URL thanh toán có chữ ký số (signature) bằng thuật toán HMAC-SHA512. URL này chứa các thông tin: mã giao dịch, số tiền, thông tin đơn hàng, và địa chỉ callback. Chữ ký số đảm bảo không ai có thể sửa đổi số tiền hay thông tin giao dịch.

Bước 3 - Khách được chuyển hướng đến VNPay: Trình duyệt mở trang thanh toán của VNPay. Khách chọn ngân hàng, nhập thông tin thẻ hoặc quét mã QR của ngân hàng.

Bước 4 - VNPay xử lý giao dịch: Sau khi khách xác nhận OTP, VNPay xử lý giao dịch với ngân hàng và chuyển khách về trang kết quả của nhà hàng kèm theo các tham số xác nhận.

Bước 5 - Backend xác minh kết quả: Backend nhận các tham số từ VNPay, kiểm tra lại chữ ký số để đảm bảo dữ liệu không bị giả mạo. Nếu hợp lệ và giao dịch thành công, hệ thống cập nhật trạng thái đơn hàng thành "Đã thanh toán".

Bước 6 - IPN (Instant Payment Notification): Song song với bước 5, VNPay cũng gửi một thông báo trực tiếp đến backend (không qua trình duyệt của khách). Đây là cơ chế dự phòng quan trọng - nếu khách đóng trình duyệt trước khi callback hoàn tất, đơn hàng vẫn được cập nhật nhờ IPN.

**Bảo mật:**
- Mọi URL thanh toán đều có chữ ký số, không thể giả mạo
- Backend luôn xác minh chữ ký trước khi xử lý kết quả
- Số tiền trong đơn hàng được kiểm tra khớp với số tiền VNPay trả về
- Mỗi mã giao dịch chỉ được xử lý một lần (chống replay attack)

#### 4.1.4. Theo dõi đơn hàng thời gian thực (Tính năng nổi bật)

Khách hàng có thể xem trạng thái đơn hàng cập nhật liên tục mà không cần refresh trang.

**Cách triển khai:**
Hệ thống sử dụng WebSocket (thông qua Socket.io) để tạo kênh giao tiếp hai chiều giữa server và trình duyệt của khách. Khi khách đặt món xong, frontend tự động "đăng ký" (subscribe) theo dõi đơn hàng đó.

Mỗi khi trạng thái đơn hàng thay đổi (nhân viên xác nhận, bếp bắt đầu nấu, món đã sẵn sàng), backend gửi thông báo qua WebSocket đến tất cả các client đang theo dõi đơn hàng đó. Frontend nhận được thông báo và cập nhật giao diện ngay lập tức.

**Các trạng thái đơn hàng:**
1. Chờ xác nhận - Đơn mới được tạo, đang chờ nhân viên kiểm tra
2. Đã xác nhận - Nhân viên đã duyệt, đơn được chuyển vào bếp
3. Đang chế biến - Bếp đang nấu món
4. Sẵn sàng phục vụ - Món đã nấu xong, chờ mang ra bàn
5. Đã phục vụ - Nhân viên đã mang món ra bàn khách
6. Hoàn thành - Khách đã thanh toán

Khách có thể nhìn thấy từng bước thay đổi trong thời gian thực, tạo cảm giác tin tưởng và giảm lo lắng khi chờ đợi.

#### 4.1.5. Các tính năng cơ bản khác

**Xem thực đơn:** Hiển thị danh sách món ăn theo danh mục, có hình ảnh, giá, mô tả. Hỗ trợ tìm kiếm theo tên món và lọc theo danh mục.

**Tùy biến món ăn (Modifiers):** Cho phép chọn các tùy chọn đi kèm như kích cỡ (S/M/L), độ cay (không cay/ít cay/cay vừa/cay nhiều), topping bổ sung. Mỗi tùy chọn có thể có giá riêng.

**Đánh giá và phản hồi:** Sau khi hoàn thành đơn hàng, khách có thể đánh giá từ 1-5 sao và viết nhận xét. Dữ liệu này giúp nhà hàng cải thiện chất lượng dịch vụ.

---

### 4.2. Nhóm tính năng Quản lý (Admin/Manager)

#### 4.2.1. Báo cáo và Phân tích doanh thu (Tính năng nổi bật)

Hệ thống cung cấp dashboard báo cáo trực quan giúp chủ nhà hàng đưa ra quyết định kinh doanh dựa trên dữ liệu.

**Các loại báo cáo:**

Báo cáo doanh thu theo thời gian: Hiển thị biểu đồ đường thể hiện doanh thu theo ngày, tuần, hoặc tháng. Admin có thể chọn khoảng thời gian muốn xem và so sánh với kỳ trước. Hệ thống tự động tính toán phần trăm tăng trưởng so với kỳ trước đó.

Thống kê món bán chạy: Liệt kê top 5-10 món có doanh số cao nhất, bao gồm số lượng đã bán và tổng doanh thu từ món đó. Giúp nhà hàng biết món nào được yêu thích để đảm bảo nguyên liệu luôn sẵn sàng.

Phân tích khung giờ cao điểm: Biểu đồ cột thể hiện số lượng đơn hàng theo từng giờ trong ngày. Giúp nhà hàng bố trí nhân sự hợp lý - tăng ca vào giờ cao điểm, giảm nhân sự vào giờ vắng.

Tổng quan tức thời: Các thẻ thông tin hiển thị tổng doanh thu, số đơn hàng, giá trị trung bình mỗi đơn, và món bán chạy nhất trong khoảng thời gian đã chọn.

**Cách triển khai:**
Backend cung cấp các API endpoint để truy vấn dữ liệu từ bảng orders. Các truy vấn được tối ưu hóa với việc tổng hợp (aggregate) trực tiếp tại database thay vì xử lý tại application để đảm bảo hiệu năng ngay cả khi có hàng chục nghìn đơn hàng.

Frontend sử dụng thư viện Recharts để vẽ các biểu đồ tương tác. Người dùng có thể hover lên các điểm dữ liệu để xem chi tiết.

#### 4.2.2. Quản lý bàn và sinh mã QR (Tính năng nổi bật)

**Quản lý trạng thái bàn:**
Giao diện hiển thị tất cả các bàn dưới dạng lưới thẻ. Mỗi thẻ thể hiện số bàn, sức chứa, vị trí, và trạng thái hiện tại. Trạng thái được phân biệt bằng màu sắc: xanh lá (trống), vàng (có khách), đỏ (đã đặt trước), xám (không hoạt động).

**Sinh và in mã QR:**
Với mỗi bàn, admin có thể:
- Xem trước mã QR trực tiếp trên màn hình
- Tải xuống file ảnh QR để in riêng
- In hàng loạt nhiều mã QR cùng lúc (hệ thống tạo file PDF hoặc ZIP chứa tất cả QR)
- Làm mới token QR khi cần (ví dụ: nghi ngờ mã bị lộ)

**Gán nhân viên phụ trách:**
Admin có thể gán một nhân viên phục vụ (waiter) cho từng bàn hoặc nhóm bàn. Khi có đơn hàng mới từ bàn đó, chỉ nhân viên được gán mới nhận được thông báo, tránh tình trạng nhiều người cùng đến một bàn.

#### 4.2.3. Các tính năng CRUD cơ bản

**Quản lý danh mục món ăn:** Thêm, sửa, xóa các danh mục như Khai vị, Món chính, Đồ uống, Tráng miệng. Có thể sắp xếp thứ tự hiển thị trên menu.

**Quản lý món ăn:** Thêm món mới với đầy đủ thông tin (tên, mô tả, giá, danh mục, thời gian chế biến ước tính). Upload nhiều hình ảnh cho một món và chọn ảnh đại diện. Đánh dấu món là "hết hàng" hoặc "không phục vụ" khi cần.

**Quản lý nhóm tùy chọn (Modifier Groups):** Tạo các nhóm tùy chọn như "Kích cỡ", "Độ cay", "Topping". Thêm các lựa chọn cụ thể trong mỗi nhóm kèm giá điều chỉnh. Liên kết nhóm tùy chọn với các món ăn phù hợp.

**Quản lý nhân viên:** Tạo tài khoản cho nhân viên với vai trò khác nhau (phục vụ, bếp, quản lý). Gửi email mời đăng ký. Vô hiệu hóa hoặc xóa tài khoản khi nhân viên nghỉ việc.

---

### 4.3. Nhóm tính năng cho Nhân viên Bếp (Kitchen Staff)

#### 4.3.1. Màn hình Bếp - Kitchen Display System (Tính năng nổi bật)

Đây là giao diện chuyên biệt cho nhân viên bếp, được thiết kế để sử dụng trên màn hình lớn treo tại khu vực bếp.

**Giao diện dạng Kanban:**
Màn hình được chia thành 3 cột theo trạng thái:
- Cột "Đã nhận" (Received): Các món mới được chuyển vào bếp
- Cột "Đang nấu" (Preparing): Các món đang được chế biến
- Cột "Sẵn sàng" (Ready): Các món đã nấu xong, chờ mang ra

Nhân viên bếp có thể kéo-thả (drag & drop) các đơn hàng giữa các cột, hoặc nhấn nút để chuyển trạng thái. Mỗi thay đổi được đồng bộ ngay lập tức lên server và thông báo cho các bên liên quan.

**Đếm thời gian và cảnh báo:**
Mỗi đơn hàng hiển thị đồng hồ đếm thời gian từ khi nhận đơn. Hệ thống tự động so sánh với thời gian chế biến ước tính (lấy từ món có thời gian nấu lâu nhất trong đơn):
- Màu xanh: Đang trong thời gian cho phép
- Màu vàng: Đã qua 75% thời gian cho phép (cảnh báo)
- Màu đỏ nhấp nháy: Đã quá thời gian cho phép (cần ưu tiên)

Điều này giúp bếp dễ dàng nhận biết đơn nào cần ưu tiên xử lý trước.

**Thông báo âm thanh:**
Khi có đơn hàng mới, hệ thống phát âm thanh thông báo. Nhân viên có thể bật/tắt âm thanh tùy ý. Âm thanh được xử lý bằng thư viện Howler.js, đảm bảo hoạt động tốt trên mọi trình duyệt.

**Hiển thị chi tiết đơn hàng:**
Mỗi thẻ đơn hàng hiển thị:
- Số bàn và tên khách (nếu có)
- Danh sách các món với số lượng
- Các tùy chọn đã chọn (ví dụ: Size L, Cay vừa)
- Ghi chú đặc biệt của khách (được làm nổi bật để dễ thấy)
- Thời gian kể từ khi nhận đơn

#### 4.3.2. Đồng bộ thời gian thực với nhân viên phục vụ

Khi bếp chuyển một đơn hàng sang trạng thái "Sẵn sàng", hệ thống ngay lập tức gửi thông báo đến nhân viên phục vụ phụ trách bàn đó. Nhân viên biết ngay có món cần mang ra mà không cần phải liên tục kiểm tra với bếp.

---

### 4.4. Nhóm tính năng cho Nhân viên Phục vụ (Waiter)

#### 4.4.1. Xác nhận và kiểm duyệt đơn hàng (Tính năng nổi bật)

Đây là bước kiểm soát quan trọng giữa khách đặt món và bếp nhận đơn.

**Tại sao cần bước này?**
Khi khách tự đặt món qua QR, có thể xảy ra các tình huống:
- Khách đặt nhầm món hoặc đặt quá nhiều
- Trẻ em nghịch điện thoại và đặt bừa
- Người ngoài quét QR và đặt phá (nếu mã QR bị lộ)

Vì vậy, mỗi đơn hàng mới sẽ ở trạng thái "Chờ xác nhận". Nhân viên phục vụ nhận thông báo, xem qua đơn hàng, và quyết định Chấp nhận hoặc Từ chối.

**Quy trình xác nhận:**
1. Nhân viên nhận thông báo có đơn mới trên điện thoại hoặc máy tính
2. Nhân viên mở chi tiết đơn, kiểm tra các món và số lượng
3. Nếu hợp lệ, nhấn "Chấp nhận" - đơn được chuyển sang bếp
4. Nếu có vấn đề, nhấn "Từ chối" kèm lý do - khách nhận thông báo đơn bị từ chối
5. Nhân viên có thể đến bàn hỏi lại khách trước khi quyết định

**Thông báo thời gian thực:**
Sử dụng WebSocket giống như phía khách hàng. Khi có đơn mới, server gửi thông báo đến tất cả nhân viên được gán cho bàn đó (hoặc tất cả nhân viên nếu bàn chưa được gán). Giao diện hiển thị badge đếm số đơn chờ xác nhận.

#### 4.4.2. Thanh toán và quản lý hóa đơn

**Tạo hóa đơn cho bàn:**
Khi khách yêu cầu thanh toán hoặc khi nhân viên chủ động tạo bill, hệ thống tự động tổng hợp tất cả các món đã đặt tại bàn đó, bao gồm: danh sách món với số lượng và đơn giá, các tùy chọn bổ sung kèm giá điều chỉnh, tổng tiền trước thuế (subtotal), thuế VAT, và tổng tiền cuối cùng.

**Áp dụng giảm giá:**
Nhân viên có thể áp dụng giảm giá theo phần trăm (ví dụ: giảm 10%) hoặc theo số tiền cố định (ví dụ: giảm 50.000đ). Hệ thống tự động tính lại tổng tiền sau khi áp dụng giảm giá.

**Xử lý thanh toán:**
Hỗ trợ nhiều phương thức thanh toán:
- Tiền mặt: Nhân viên nhập số tiền khách đưa, hệ thống tính tiền thừa
- Thẻ ngân hàng: Nhân viên xác nhận đã quẹt thẻ thành công
- Ví điện tử (Momo, ZaloPay): Xác nhận đã nhận được tiền

**In hóa đơn:**
Hỗ trợ xuất hóa đơn dạng PDF để in hoặc gửi email cho khách. Hóa đơn bao gồm thông tin nhà hàng, danh sách món, thuế, tổng tiền, và mã QR để khách đánh giá.

#### 4.4.3. Đánh dấu đơn hàng đã phục vụ

Khi nhân viên mang món ra bàn khách, họ nhấn nút "Đã phục vụ" trên ứng dụng. Trạng thái đơn hàng chuyển từ "Sẵn sàng" sang "Đã phục vụ", đồng thời khách hàng cũng nhận được thông báo rằng món ăn đã được mang ra.

#### 4.4.4. Quản lý bàn được gán

Mỗi nhân viên có thể xem danh sách các bàn mình phụ trách, trạng thái từng bàn, và các đơn hàng đang hoạt động tại các bàn đó. Giao diện được thiết kế đơn giản, tối ưu cho việc sử dụng trên điện thoại di động.

---

### 4.5. Hệ thống Xác thực và Phân quyền (Authentication & Authorization)

#### 4.5.1. Đăng ký và Đăng nhập

**Đăng ký tài khoản khách hàng:**
Khách hàng có thể tạo tài khoản bằng email và mật khẩu. Hệ thống kiểm tra:
- Email chưa được sử dụng (kiểm tra real-time khi nhập)
- Mật khẩu đủ mạnh (tối thiểu 6 ký tự, có chữ hoa, chữ thường, số)
- Họ tên hợp lệ

Sau khi đăng ký, hệ thống gửi email chứa link xác thực. Tài khoản chỉ được kích hoạt sau khi khách nhấn vào link này.

**Đăng nhập bằng mạng xã hội:**
Hỗ trợ đăng nhập nhanh bằng tài khoản Google. Khi khách chọn "Đăng nhập với Google", hệ thống sử dụng OAuth 2.0 để xác thực và tự động tạo tài khoản nếu chưa tồn tại.

**Đăng nhập cho nhân viên:**
Nhân viên (Admin, Waiter, Kitchen) đăng nhập bằng email và mật khẩu. Hệ thống sử dụng JWT (JSON Web Token) để quản lý phiên đăng nhập. Token có thời hạn 24 giờ cho nhân viên, 7 ngày cho khách hàng.

**Quên mật khẩu:**
Người dùng nhập email đã đăng ký, hệ thống gửi link đặt lại mật khẩu. Link có hiệu lực trong 1 giờ và chỉ sử dụng được một lần.

#### 4.5.2. Phân quyền theo vai trò (Role-Based Access Control)

Hệ thống phân quyền chi tiết theo 4 vai trò chính:

**Super Admin:**
- Toàn quyền trên hệ thống
- Tạo và quản lý tài khoản Admin khác
- Xem nhật ký hoạt động của tất cả người dùng

**Admin (Quản lý nhà hàng):**
- Quản lý menu: thêm, sửa, xóa danh mục và món ăn
- Quản lý bàn: tạo bàn, sinh QR, gán nhân viên
- Xem báo cáo doanh thu
- Tạo tài khoản Waiter và Kitchen Staff
- Không thể xóa tài khoản Admin khác

**Waiter (Nhân viên phục vụ):**
- Xem đơn hàng mới và xác nhận/từ chối
- Chuyển đơn sang bếp
- Đánh dấu đơn đã phục vụ
- Xử lý thanh toán
- Xem các bàn được gán
- Không thể truy cập quản lý menu hoặc báo cáo tài chính

**Kitchen Staff (Nhân viên bếp):**
- Xem danh sách món cần chế biến
- Cập nhật trạng thái chế biến
- Không thể xem thông tin tài chính hoặc sửa đơn hàng

---

### 4.6. Hệ thống thông báo thời gian thực (Real-time Notification System)

Đây là tính năng xuyên suốt, kết nối tất cả các bên trong quy trình phục vụ.

**Kiến trúc Room-based:**
Backend tạo các "phòng" (room) ảo trên WebSocket:
- Phòng theo nhà hàng: Tất cả nhân viên của một nhà hàng cùng tham gia
- Phòng theo đơn hàng: Khách hàng và nhân viên liên quan đến đơn cụ thể

Khi có sự kiện (đơn mới, trạng thái thay đổi), server gửi thông báo đến đúng phòng cần thiết, tránh việc gửi thừa cho những người không liên quan.

**Các sự kiện chính:**
- Đơn hàng mới: Gửi đến nhân viên phục vụ
- Đơn được chấp nhận: Gửi đến bếp và khách hàng
- Món sẵn sàng: Gửi đến nhân viên phục vụ
- Đơn hoàn thành: Gửi đến khách hàng

**Xử lý mất kết nối:**
WebSocket có thể bị ngắt do mạng không ổn định. Hệ thống tự động thử kết nối lại với khoảng cách tăng dần (1 giây, 2 giây, 5 giây...). Khi kết nối lại thành công, client tự động đăng ký lại các phòng cần thiết.

---

### 4.7. Các tính năng bổ sung cho khách hàng đã đăng nhập

#### 4.7.1. Quản lý hồ sơ cá nhân

**Cập nhật thông tin:**
Khách hàng có thể cập nhật họ tên, số điện thoại, và các tùy chọn cá nhân. Mọi thay đổi đều được xác thực đầu vào trước khi lưu.

**Thay đổi ảnh đại diện:**
Hỗ trợ upload ảnh đại diện. Ảnh được resize tự động để đảm bảo kích thước phù hợp và lưu trữ trong database.

**Đổi mật khẩu:**
Khách hàng có thể đổi mật khẩu bằng cách nhập mật khẩu cũ và mật khẩu mới. Hệ thống kiểm tra mật khẩu cũ đúng trước khi cho phép thay đổi.

#### 4.7.2. Lịch sử đơn hàng

**Xem danh sách đơn hàng đã đặt:**
Khách hàng đã đăng nhập có thể xem lại tất cả các đơn hàng trước đây, bao gồm: ngày đặt, danh sách món, tổng tiền, và trạng thái.

**Theo dõi trạng thái từng món:**
Trong mỗi đơn hàng, khách có thể xem trạng thái chi tiết của từng món: Đang chờ, Đang nấu, Sẵn sàng, Đã phục vụ.

**Đặt lại đơn hàng cũ:**
Khách có thể chọn một đơn hàng cũ và thêm tất cả các món trong đó vào giỏ hàng hiện tại, tiết kiệm thời gian khi muốn đặt lại những món yêu thích.

---

### 4.8. Các tính năng nâng cao

#### 4.8.1. Tìm kiếm mờ (Fuzzy Search)

Tính năng tìm kiếm thông minh cho phép khách hàng tìm món ăn ngay cả khi gõ sai chính tả. Ví dụ: gõ "pho bo" vẫn tìm được "Phở Bò", gõ "cafe" tìm được "Cà phê sữa đá". Hệ thống sử dụng thư viện Fuse.js để thực hiện việc so khớp mờ này.

#### 4.8.2. Bộ nhớ đệm (Caching)

Hệ thống sử dụng bộ nhớ đệm tại backend để tăng tốc độ phản hồi:
- Menu và danh mục được cache trong 5 phút
- Thông tin bàn được cache trong 1 phút
- Khi có thay đổi (thêm món, sửa giá), cache tự động được xóa để cập nhật dữ liệu mới

#### 4.8.3. Nhật ký hệ thống (Audit Logs)

Mọi thao tác quan trọng của admin đều được ghi lại:
- Ai thực hiện (user ID, tên)
- Thực hiện gì (thêm món, sửa giá, xóa bàn...)
- Thời gian thực hiện
- Dữ liệu trước và sau khi thay đổi

Nhật ký này giúp truy vết khi có vấn đề và đảm bảo tính minh bạch trong quản lý.

#### 4.8.4. Hiển thị món liên quan

Khi khách xem chi tiết một món ăn, hệ thống gợi ý các món liên quan:
- Các món khác trong cùng danh mục
- Các món thường được đặt kèm (dựa trên dữ liệu đơn hàng)
- Các món bán chạy nhất

Tính năng này giúp tăng giá trị đơn hàng trung bình bằng cách khuyến khích khách thử thêm món mới.

#### 4.8.5. Thêm món vào đơn hàng đang có

Trong suốt bữa ăn, khách có thể tiếp tục thêm món vào đơn hàng hiện tại mà không cần tạo đơn mới. Mỗi bàn chỉ có một đơn hàng hoạt động tại một thời điểm. Khi khách thêm món mới, món đó được gắn vào đơn hàng đang có và thông báo được gửi đến nhân viên để xác nhận.

---

## 5. Database Design (Thiết kế cơ sở dữ liệu)

### 5.1. Tổng quan kiến trúc dữ liệu

Hệ thống sử dụng MySQL 8.0 làm hệ quản trị cơ sở dữ liệu chính, kết hợp với TypeORM để quản lý các thực thể và mối quan hệ. Cơ sở dữ liệu được thiết kế theo mô hình quan hệ (Relational Model) với tổng cộng 23 bảng, được tổ chức thành 5 nhóm chức năng chính.

### 5.2. Phân nhóm các bảng dữ liệu

#### Nhóm 1: Xác thực và Phân quyền (10 bảng)

| Tên bảng | Mô tả |
|----------|-------|
| users | Thông tin nhân viên (admin, waiter, kitchen staff) |
| customers | Thông tin khách hàng đăng ký tài khoản |
| roles | Định nghĩa các vai trò trong hệ thống |
| permissions | Danh sách các quyền hạn cụ thể |
| role_permissions | Bảng trung gian liên kết vai trò với quyền |
| refresh_tokens | Quản lý JWT refresh token cho phiên đăng nhập |
| email_verification_tokens | Token xác thực email khách hàng |
| password_reset_tokens | Token đặt lại mật khẩu khách hàng |
| admin_email_verification_tokens | Token xác thực email nhân viên |
| admin_password_reset_tokens | Token đặt lại mật khẩu nhân viên |

#### Nhóm 2: Quản lý Thực đơn (6 bảng)

| Tên bảng | Mô tả |
|----------|-------|
| menu_categories | Danh mục món ăn (Khai vị, Món chính, Đồ uống...) |
| menu_items | Thông tin chi tiết món ăn |
| menu_item_photos | Hình ảnh món ăn lưu dạng LONGBLOB |
| modifier_groups | Nhóm tùy chọn (Size, Độ cay, Topping...) |
| modifier_options | Các lựa chọn cụ thể trong mỗi nhóm |
| menu_item_modifier_groups | Liên kết món ăn với nhóm tùy chọn |

#### Nhóm 3: Quản lý Đơn hàng (3 bảng)

| Tên bảng | Mô tả |
|----------|-------|
| orders | Đơn hàng chính với thông tin tổng quan |
| order_items | Chi tiết từng món trong đơn hàng |
| order_item_modifiers | Các tùy chọn đã chọn cho mỗi món |
#### Nhóm 4: Quản lý Bàn (1 bảng)

| Tên bảng | Mô tả |
|----------|-------|
| tables | Thông tin bàn ăn, QR code token, trạng thái |

#### Nhóm 5: Đánh giá và Nhật ký (2 bảng)

| Tên bảng | Mô tả |
|----------|-------|
| reviews | Đánh giá của khách hàng sau bữa ăn |
| admin_audit_logs | Nhật ký hoạt động quản trị viên |

### 5.3. Chi tiết các bảng chính

#### 5.3.1. Bảng users (Nhân viên)

Lưu trữ thông tin tài khoản nhân viên bao gồm admin, waiter và kitchen staff.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Khóa chính |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email đăng nhập |
| password | VARCHAR(255) | NOT NULL | Mật khẩu đã hash (bcrypt) |
| fullName | VARCHAR(100) | NOT NULL | Họ và tên |
| role | ENUM | NOT NULL | Vai trò: SUPER_ADMIN, ADMIN, WAITER, KITCHEN |
| isActive | BOOLEAN | DEFAULT TRUE | Trạng thái tài khoản |
| isEmailVerified | BOOLEAN | DEFAULT FALSE | Đã xác thực email chưa |
| createdBy | INT | FOREIGN KEY | ID người tạo tài khoản |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời gian tạo |
| updatedAt | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Thời gian cập nhật |

#### 5.3.2. Bảng customers (Khách hàng)

Lưu trữ thông tin khách hàng đã đăng ký tài khoản.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Khóa chính |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email đăng ký |
| password | VARCHAR(255) | NULL | Null nếu đăng ký qua Google |
| fullName | VARCHAR(100) | NOT NULL | Họ và tên |
| phone | VARCHAR(20) | NULL | Số điện thoại |
| avatar | LONGBLOB | NULL | Ảnh đại diện dạng binary |
| googleId | VARCHAR(255) | UNIQUE, NULL | ID Google OAuth |
| isEmailVerified | BOOLEAN | DEFAULT FALSE | Đã xác thực email chưa |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời gian đăng ký |

#### 5.3.3. Bảng menu_categories (Danh mục món ăn)

Phân loại món ăn theo nhóm để dễ quản lý và hiển thị.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Khóa chính |
| name | VARCHAR(100) | NOT NULL | Tên danh mục |
| description | TEXT | NULL | Mô tả danh mục |
| displayOrder | INT | DEFAULT 0 | Thứ tự hiển thị |
| isActive | BOOLEAN | DEFAULT TRUE | Trạng thái hoạt động |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời gian tạo |

#### 5.3.4. Bảng menu_items (Món ăn)

Lưu trữ thông tin chi tiết của từng món ăn.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Khóa chính |
| categoryId | INT | FOREIGN KEY | Liên kết đến menu_categories |
| name | VARCHAR(200) | NOT NULL | Tên món ăn |
| description | TEXT | NULL | Mô tả chi tiết |
| price | DECIMAL(10,2) | NOT NULL | Giá bán (VNĐ) |
| prepTimeMinutes | INT | DEFAULT 15 | Thời gian chế biến ước tính (phút) |
| status | ENUM | DEFAULT 'available' | available / sold_out / unavailable |
| isChefRecommended | BOOLEAN | DEFAULT FALSE | Đánh dấu món đề xuất |
| displayOrder | INT | DEFAULT 0 | Thứ tự hiển thị trong danh mục |
| isActive | BOOLEAN | DEFAULT TRUE | Trạng thái hoạt động |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời gian tạo |
| updatedAt | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Thời gian cập nhật |

#### 5.3.5. Bảng menu_item_photos (Hình ảnh món ăn)

Lưu trữ hình ảnh món ăn dạng binary trong database.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Khóa chính |
| menuItemId | INT | FOREIGN KEY | Liên kết đến menu_items |
| photoData | LONGBLOB | NOT NULL | Dữ liệu hình ảnh dạng binary |
| mimeType | VARCHAR(50) | NOT NULL | Loại file: image/jpeg, image/png |
| isPrimary | BOOLEAN | DEFAULT FALSE | Đánh dấu ảnh đại diện chính |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời gian upload |

#### 5.3.6. Bảng orders (Đơn hàng)

Lưu trữ thông tin tổng quan của mỗi đơn hàng.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Khóa chính |
| orderId | VARCHAR(20) | UNIQUE, NOT NULL | Mã đơn hàng hiển thị (VD: ORD-001) |
| tableId | INT | FOREIGN KEY | Liên kết đến tables |
| customerId | INT | FOREIGN KEY, NULL | Liên kết đến customers (nếu đăng nhập) |
| status | ENUM | DEFAULT 'pending' | Trạng thái đơn hàng |
| subtotal | DECIMAL(12,2) | NOT NULL | Tổng tiền trước thuế |
| tax | DECIMAL(12,2) | DEFAULT 0 | Thuế VAT |
| discount | DECIMAL(12,2) | DEFAULT 0 | Giảm giá |
| total | DECIMAL(12,2) | NOT NULL | Tổng tiền sau thuế và giảm giá |
| isPaid | BOOLEAN | DEFAULT FALSE | Đã thanh toán chưa |
| paymentMethod | ENUM | NULL | cash / card / vnpay / momo |
| notes | TEXT | NULL | Ghi chú từ khách hàng |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời gian tạo |
| updatedAt | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Thời gian cập nhật |

Các giá trị của cột status:
- pending: Đơn mới tạo, chờ nhân viên xác nhận
- accepted: Nhân viên đã xác nhận, chuyển sang bếp
- preparing: Bếp đang chế biến
- ready: Món đã sẵn sàng phục vụ
- served: Đã mang ra bàn khách
- completed: Đã thanh toán, hoàn tất
- cancelled: Đã hủy

#### 5.3.7. Bảng order_items (Chi tiết đơn hàng)

Lưu trữ từng món ăn trong mỗi đơn hàng.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Khóa chính |
| orderId | INT | FOREIGN KEY | Liên kết đến orders |
| menuItemId | INT | FOREIGN KEY | Liên kết đến menu_items |
| quantity | INT | NOT NULL, CHECK > 0 | Số lượng |
| unitPrice | DECIMAL(10,2) | NOT NULL | Đơn giá tại thời điểm đặt |
| subtotal | DECIMAL(12,2) | NOT NULL | Thành tiền (unitPrice x quantity) |
| status | ENUM | DEFAULT 'pending' | Trạng thái riêng của món |
| notes | TEXT | NULL | Ghi chú riêng cho món |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời gian thêm vào đơn |

#### 5.3.8. Bảng tables (Bàn ăn)

Quản lý thông tin bàn ăn và mã QR tương ứng.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Khóa chính |
| tableNumber | VARCHAR(20) | UNIQUE, NOT NULL | Số/tên bàn hiển thị |
| capacity | INT | DEFAULT 4 | Sức chứa (số người) |
| qrCodeToken | VARCHAR(255) | UNIQUE, NOT NULL | Token mã hóa cho QR code |
| status | ENUM | DEFAULT 'available' | available / occupied / reserved |
| assignedWaiterId | INT | FOREIGN KEY, NULL | Nhân viên phụ trách |
| isActive | BOOLEAN | DEFAULT TRUE | Trạng thái hoạt động |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời gian tạo |

### 5.4. Các mối quan hệ chính

#### 5.4.1. Quan hệ một-nhiều (One-to-Many)

- menu_categories -> menu_items: Một danh mục chứa nhiều món ăn
- menu_items -> menu_item_photos: Một món có thể có nhiều hình ảnh
- menu_items -> order_items: Một món có thể xuất hiện trong nhiều đơn hàng
- orders -> order_items: Một đơn hàng chứa nhiều món
- order_items -> order_item_modifiers: Một món trong đơn có thể có nhiều tùy chọn
- tables -> orders: Một bàn có thể có nhiều đơn hàng (theo thời gian)
- users -> orders: Một nhân viên xử lý nhiều đơn hàng
- customers -> orders: Một khách hàng có thể đặt nhiều đơn
- modifier_groups -> modifier_options: Một nhóm tùy chọn chứa nhiều lựa chọn

#### 5.4.2. Quan hệ nhiều-nhiều (Many-to-Many)

- menu_items <-> modifier_groups: Thông qua bảng menu_item_modifier_groups. Một món có thể áp dụng nhiều nhóm tùy chọn, và một nhóm tùy chọn có thể áp dụng cho nhiều món.

- roles <-> permissions: Thông qua bảng role_permissions. Một vai trò có nhiều quyền, và một quyền có thể thuộc nhiều vai trò.

### 5.5. Giải pháp kỹ thuật đặc biệt

#### 5.5.1. Lưu trữ hình ảnh dạng Binary

Thay vì sử dụng dịch vụ lưu trữ đám mây (AWS S3, Cloudinary), hệ thống lưu hình ảnh trực tiếp trong MySQL dưới dạng LONGBLOB.

Ưu điểm:
- Toàn bộ dữ liệu đóng gói trong một database, dễ backup và restore
- Không phụ thuộc dịch vụ bên thứ ba, không bị giới hạn bandwidth
- Đơn giản hóa việc triển khai, chỉ cần cấu hình một database
- Bảo mật tốt hơn vì hình ảnh chỉ truy cập được qua API có xác thực

Quy trình xử lý:
- Upload: Frontend gửi file, Backend chuyển thành Buffer và lưu vào LONGBLOB
- Truy xuất: Backend đọc BLOB, chuyển sang Base64, nhúng vào JSON response
- Tối ưu: Sử dụng lazy loading và Next.js Image Component

#### 5.5.2. Cơ chế QR Code Token

Mỗi bàn có một qrCodeToken duy nhất được tạo bằng cách mã hóa thông tin bàn. Token này được nhúng vào URL của ứng dụng khách hàng. Khi khách quét mã QR, hệ thống giải mã token để xác định bàn và tự động gán đơn hàng vào đúng bàn.

#### 5.5.3. Quản lý Timezone

Tất cả timestamp trong database được lưu theo múi giờ UTC. Frontend chịu trách nhiệm chuyển đổi sang múi giờ địa phương của người dùng khi hiển thị. Cách tiếp cận này tránh được các vấn đề về Daylight Saving Time và sự khác biệt múi giờ giữa các vùng.

#### 5.5.4. Soft Delete và Audit Trail

Các bảng quan trọng sử dụng cột isActive thay vì xóa vĩnh viễn dữ liệu. Điều này cho phép khôi phục dữ liệu khi cần và duy trì tính toàn vẹn của các mối quan hệ.

Bảng admin_audit_logs ghi lại mọi thao tác quan trọng bao gồm: người thực hiện, hành động, thời gian, và dữ liệu trước/sau khi thay đổi. Hệ thống nhật ký này phục vụ cho việc kiểm tra, truy vết lỗi và đảm bảo tính minh bạch trong quản lý.

### 5.6. Tối ưu hóa hiệu năng

#### 5.6.1. Đánh chỉ mục (Indexing)

Các chỉ mục được tạo trên:
- Các cột khóa ngoại (categoryId, orderId, tableId, menuItemId...)
- Các cột thường xuyên truy vấn (status, createdAt, email)
- Các cột trong mệnh đề WHERE và ORDER BY

#### 5.6.2. Connection Pooling

TypeORM được cấu hình với connection pool để quản lý kết nối database hiệu quả, tránh tạo kết nối mới cho mỗi request và giảm tải cho database server.

#### 5.6.3. Eager vs Lazy Loading

Các mối quan hệ được cấu hình với lazy loading mặc định. Chỉ những trường hợp cần thiết mới sử dụng eager loading để tránh truy vấn thừa và cải thiện thời gian phản hồi.

---

## 6. UI/UX Design (Thiết kế giao diện)

### 6.1. Triết lý thiết kế

#### 6.1.1. Ngôn ngữ thiết kế "Bento Minimalist"

Hệ thống được thiết kế theo phong cách "Bento Minimalist" - lấy cảm hứng từ cách bày trí khay cơm Bento của Nhật Bản: ngăn nắp, gọn gàng và mỗi thành phần có vị trí riêng biệt.

Đặc điểm chính:
- Sử dụng các thẻ (Cards) với bo góc lớn để tổ chức thông tin
- Bố cục dạng lưới (Grid Layout) tạo sự cân đối
- Khoảng trắng (Whitespace) được sử dụng có chủ đích để tăng tính dễ đọc
- Màu sắc tối giản, tập trung vào nội dung

[HÌNH 6.1: Minh họa phong cách Bento Minimalist - So sánh layout của ứng dụng với khay Bento]

#### 6.1.2. Nguyên tắc thiết kế

Consistency (Nhất quán): Tất cả các màn hình sử dụng cùng một bộ component, màu sắc và typography để người dùng dễ dàng làm quen.

Clarity (Rõ ràng): Thông tin được phân cấp rõ ràng, các hành động quan trọng được làm nổi bật bằng màu sắc và kích thước.

Efficiency (Hiệu quả): Giảm số bước thao tác cần thiết để hoàn thành một nhiệm vụ. Ví dụ: đặt món chỉ cần 3 thao tác (chọn món, thêm vào giỏ, đặt hàng).

Feedback (Phản hồi): Mọi hành động của người dùng đều có phản hồi trực quan (hiệu ứng nhấn nút, thông báo thành công/lỗi, skeleton loading).

### 6.2. Hệ thống màu sắc (Color System)

#### 6.2.1. Bảng màu chính (Primary Palette)

Hệ thống sử dụng tông màu Slate làm màu chủ đạo, mang lại cảm giác chuyên nghiệp và hiện đại.

| Tên | Mã màu | Ứng dụng |
|-----|--------|----------|
| Slate 900 | #0f172a | Nút CTA chính, tiêu đề quan trọng |
| Slate 800 | #1e293b | Sidebar, header |
| Slate 700 | #334155 | Text chính |
| Slate 500 | #64748b | Text phụ, placeholder |
| Slate 200 | #e2e8f0 | Border, divider |
| Slate 100 | #f1f5f9 | Background phụ |
| Slate 50 | #f8fafc | Background chính |

#### 6.2.2. Màu ngữ nghĩa (Semantic Colors)

Các màu này được sử dụng cố định cho các trạng thái và hành động cụ thể, không thay đổi theo ngữ cảnh.

| Loại | Mã màu | Ứng dụng cụ thể |
|------|--------|-----------------|
| Success (Green 500) | #22c55e | Trạng thái "completed", "available", nút xác nhận |
| Warning (Amber 500) | #f59e0b | Trạng thái "pending", "preparing", cảnh báo |
| Error (Red 500) | #ef4444 | Trạng thái "cancelled", "unavailable", nút xóa |
| Info (Blue 500) | #3b82f6 | Thông tin bổ sung, link, highlight |

#### 6.2.3. Quy tắc sử dụng màu

- Màu Primary (Slate) dùng cho: nút hành động chính, navigation active, brand elements
- Màu Success (Green) dùng cho: trạng thái hoàn thành, còn hàng, nút confirm
- Màu Warning (Amber) dùng cho: trạng thái chờ xử lý, đang chuẩn bị, cảnh báo nhẹ
- Màu Error (Red) dùng cho: trạng thái hủy, hết hàng, nút xóa
- Không sử dụng màu Primary cho các hành động nguy hiểm (delete, cancel)
- Không tạo thêm màu ngữ nghĩa mới ngoài 4 màu đã định nghĩa

[HÌNH 6.2: Bảng màu hoàn chỉnh của hệ thống với các ví dụ sử dụng]

### 6.3. Hệ thống Typography

#### 6.3.1. Font chữ

Hệ thống sử dụng font Plus Jakarta Sans - một font sans-serif hiện đại, dễ đọc trên màn hình và hỗ trợ tiếng Việt tốt.

Lý do chọn Plus Jakarta Sans:
- Thiết kế geometric hiện đại, phù hợp với phong cách Bento Minimalist
- Nhiều weight từ 200 đến 800, linh hoạt trong sử dụng
- Hỗ trợ đầy đủ ký tự tiếng Việt có dấu
- Miễn phí và có sẵn trên Google Fonts

#### 6.3.2. Thang đo font (Font Scale)

| Tên | Kích thước | Line Height | Ứng dụng |
|-----|------------|-------------|----------|
| Display | 36px | 1.2 | Hero text, số liệu lớn |
| Heading 1 | 30px | 1.2 | Tiêu đề trang |
| Heading 2 | 24px | 1.3 | Tiêu đề section |
| Heading 3 | 20px | 1.4 | Tiêu đề card |
| Body Large | 18px | 1.5 | Đoạn văn quan trọng |
| Body | 16px | 1.5 | Nội dung chính |
| Body Small | 14px | 1.5 | Nội dung phụ, caption |
| Caption | 12px | 1.4 | Label, timestamp |

#### 6.3.3. Font Weight

Hệ thống chỉ sử dụng 5 mức độ đậm để đảm bảo tính nhất quán:
- Regular (400): Body text thông thường
- Medium (500): Body text cần nhấn mạnh nhẹ
- Semibold (600): Subheading, label
- Bold (700): Tiêu đề section, label quan trọng
- Extrabold (800): Tiêu đề trang, hero text

Quy tắc: Không sử dụng font-thin (100) hoặc font-light (300) vì khó đọc trên màn hình.

### 6.4. Hệ thống Layout và Spacing

#### 6.4.1. Grid System

Admin Frontend sử dụng hệ thống lưới 12 cột với gutter 24px, cho phép linh hoạt trong việc bố trí các thành phần.

Customer Frontend sử dụng layout đơn cột tối ưu cho màn hình di động, với max-width 480px cho nội dung chính.

#### 6.4.2. Spacing Scale

Khoảng cách được thiết kế theo bội số của 4px để đảm bảo tính nhất quán:

| Tên | Giá trị | Ứng dụng |
|-----|---------|----------|
| xs | 4px | Khoảng cách giữa icon và text |
| sm | 8px | Khoảng cách trong component |
| md | 16px | Khoảng cách giữa các element |
| lg | 24px | Khoảng cách giữa các section |
| xl | 32px | Khoảng cách giữa các block |
| 2xl | 48px | Margin lớn, padding container |

#### 6.4.3. Border Radius

Bo góc lớn là đặc trưng của phong cách Bento:

| Loại | Giá trị | Ứng dụng |
|------|---------|----------|
| Small | 8px | Badge, tag, input nhỏ |
| Medium | 12px | Button, input |
| Large | 16px | Card nhỏ |
| XLarge | 24px | Card lớn, modal |
| Full | 9999px | Avatar, pill button |

### 6.5. Component Library

#### 6.5.1. Button

Hệ thống có 4 loại button chính:

Primary Button: Nền slate-900, chữ trắng, dùng cho hành động chính (Đặt hàng, Xác nhận)

Secondary Button: Nền trắng, viền slate-200, chữ slate-700, dùng cho hành động phụ (Hủy, Quay lại)

Danger Button: Nền red-500, chữ trắng, dùng cho hành động nguy hiểm (Xóa, Hủy đơn)

Ghost Button: Không nền, chữ slate-600, dùng cho hành động nhẹ (Xem thêm, Link)

Kích thước: Large (48px height), Medium (40px height), Small (32px height)

[HÌNH 6.3: Tổng hợp các loại Button với các trạng thái (normal, hover, active, disabled)]

#### 6.5.2. Card

Card là component chính để nhóm thông tin:

- Background: Trắng hoặc slate-50
- Border-radius: 24px (XLarge)
- Shadow: Nhẹ (0 1px 3px rgba(0,0,0,0.1))
- Padding: 24px cho card lớn, 16px cho card nhỏ

[HÌNH 6.4: Các loại Card trong hệ thống - Menu Item Card, Order Card, Table Card]

#### 6.5.3. Status Badge

Badge hiển thị trạng thái với màu tương ứng:

| Trạng thái | Màu nền | Màu chữ |
|------------|---------|---------|
| Pending | amber-100 | amber-800 |
| Preparing | blue-100 | blue-800 |
| Ready | green-100 | green-800 |
| Served | slate-100 | slate-800 |
| Cancelled | red-100 | red-800 |

[HÌNH 6.5: Tổng hợp các Status Badge]

#### 6.5.4. Form Input

Input field được thiết kế thống nhất:
- Height: 48px (touch-friendly)
- Border: 1px solid slate-200
- Border-radius: 12px
- Focus state: Border chuyển sang slate-400, có ring shadow

[HÌNH 6.6: Các loại Form Input - Text, Number, Select, Textarea]

### 6.6. Thiết kế giao diện theo vai trò

#### 6.6.1. Giao diện khách hàng (Customer Frontend)

Thiết kế Mobile-First vì 95% khách hàng sử dụng smartphone để quét QR và đặt món.

Màn hình Menu:
- Header sticky hiển thị tên nhà hàng và số bàn
- Thanh danh mục ngang có thể cuộn, sticky khi scroll
- Danh sách món dạng card với ảnh, tên, giá và nút thêm vào giỏ
- Bottom navigation cố định với các tab: Menu, Giỏ hàng, Đơn hàng

[HÌNH 6.7: Screenshot màn hình Menu của Customer App]

Màn hình Giỏ hàng:
- Danh sách món đã chọn với số lượng và tùy chọn
- Có thể chỉnh sửa số lượng hoặc xóa món
- Hiển thị tổng tiền ở cuối
- Nút "Đặt hàng" nổi bật ở bottom

[HÌNH 6.8: Screenshot màn hình Giỏ hàng]

Màn hình Theo dõi đơn hàng:
- Timeline hiển thị các bước: Đã đặt, Đang nấu, Sẵn sàng, Đã phục vụ
- Danh sách món với trạng thái riêng của từng món
- Cập nhật realtime khi trạng thái thay đổi

[HÌNH 6.9: Screenshot màn hình Theo dõi đơn hàng]

#### 6.6.2. Giao diện nhân viên phục vụ (Waiter App)

Thiết kế tối ưu cho việc sử dụng một tay trong khi di chuyển.

Màn hình Đơn hàng mới:
- Danh sách đơn hàng mới chờ xác nhận
- Mỗi card hiển thị: số bàn, thời gian, số món
- Swipe để xác nhận hoặc từ chối
- Thông báo âm thanh khi có đơn mới

[HÌNH 6.10: Screenshot màn hình Đơn hàng mới của Waiter]

Màn hình Quản lý bàn:
- Hiển thị dạng grid các bàn được gán
- Màu sắc thể hiện trạng thái: xanh (trống), vàng (có khách), đỏ (cần phục vụ)
- Nhấn vào bàn để xem đơn hàng chi tiết

[HÌNH 6.11: Screenshot màn hình Quản lý bàn của Waiter]

#### 6.6.3. Giao diện bếp (Kitchen Display System)

Thiết kế cho màn hình lớn đặt trong bếp, tối ưu cho việc xem từ xa.

Layout Kanban:
- 3 cột: Đơn mới, Đang nấu, Sẵn sàng
- Kéo thả card giữa các cột để cập nhật trạng thái
- Font size lớn, dễ đọc từ xa

Hệ thống màu theo thời gian:
- Bình thường: Nền trắng
- Trên 10 phút: Nền vàng (cảnh báo)
- Trên 20 phút: Nền đỏ (quá hạn)

Timer countdown:
- Mỗi card hiển thị thời gian kể từ khi nhận đơn
- Tự động cập nhật mỗi giây

[HÌNH 6.12: Screenshot Kitchen Display System với các cột Kanban]

#### 6.6.4. Giao diện quản lý (Admin Dashboard)

Thiết kế Desktop-First cho màn hình lớn, hỗ trợ responsive cho tablet.

Layout:
- Sidebar cố định bên trái với menu navigation
- Header hiển thị tên người dùng và nút đăng xuất
- Vùng nội dung chính chiếm phần còn lại

Màn hình Dashboard:
- Các card thống kê: Doanh thu hôm nay, Số đơn, Đơn đang xử lý
- Biểu đồ doanh thu theo ngày/tuần/tháng
- Danh sách đơn hàng gần đây

[HÌNH 6.13: Screenshot Admin Dashboard với các thống kê và biểu đồ]

Màn hình Quản lý Menu:
- Danh sách danh mục ở sidebar trái
- Grid các món ăn ở vùng chính
- Modal để thêm/sửa món với form upload ảnh

[HÌNH 6.14: Screenshot màn hình Quản lý Menu]

Màn hình Báo cáo:
- Bộ lọc theo khoảng thời gian
- Biểu đồ doanh thu, số lượng đơn
- Danh sách món bán chạy
- Nút xuất báo cáo PDF/Excel

[HÌNH 6.15: Screenshot màn hình Báo cáo với biểu đồ]

### 6.7. Trải nghiệm di động (Mobile Experience)

#### 6.7.1. Touch-Friendly Design

Tất cả các thành phần tương tác được thiết kế với kích thước tối thiểu phù hợp cho thao tác chạm:
- Nút bấm: Chiều cao tối thiểu 44px (iOS) / 48px (Android)
- Khoảng cách giữa các nút: Tối thiểu 8px
- Input field: Chiều cao tối thiểu 48px

#### 6.7.2. Gesture Support

- Swipe left/right: Xác nhận/Từ chối đơn hàng (Waiter App)
- Pull to refresh: Làm mới danh sách
- Long press: Hiển thị menu ngữ cảnh

#### 6.7.3. Progressive Web App (PWA)

Customer Frontend được cấu hình như một PWA với các tính năng:
- Add to Home Screen: Người dùng có thể cài đặt app lên màn hình chính
- Splash Screen: Hiển thị logo khi khởi động
- Standalone mode: Chạy như native app, không có thanh địa chỉ trình duyệt

### 6.8. Hiệu ứng và Animation

#### 6.8.1. Transition

Tất cả transition sử dụng thời gian 150ms với easing ease-in-out để tạo cảm giác mượt mà nhưng không chậm.

#### 6.8.2. Hover và Focus States

- Hover: Thay đổi màu nền nhẹ, thêm shadow
- Focus: Hiển thị ring outline để hỗ trợ accessibility
- Active: Scale nhỏ lại (0.98) để tạo hiệu ứng nhấn

#### 6.8.3. Loading States

- Skeleton Screen: Hiển thị placeholder hình dạng nội dung khi đang tải
- Spinner: Hiển thị khi chờ phản hồi từ server
- Progress Bar: Hiển thị tiến trình upload ảnh

[HÌNH 6.16: Minh họa Skeleton Screen cho Menu và Order List]

### 6.9. Accessibility (Khả năng tiếp cận)

#### 6.9.1. Color Contrast

Tất cả text đều đạt tỷ lệ contrast tối thiểu 4.5:1 theo tiêu chuẩn WCAG 2.1 AA:
- Text chính (slate-700) trên nền trắng: 8.1:1
- Text phụ (slate-500) trên nền trắng: 4.6:1

#### 6.9.2. Keyboard Navigation

Admin Dashboard hỗ trợ điều hướng hoàn toàn bằng bàn phím:
- Tab: Di chuyển giữa các element
- Enter: Kích hoạt button/link
- Escape: Đóng modal/dropdown

#### 6.9.3. Screen Reader Support

Các element tương tác có aria-label mô tả chức năng. Các thông báo động sử dụng aria-live để thông báo cho screen reader.

---

## 7. Hướng dẫn cài đặt và triển khai (Installation & Deployment Guide)

### 7.1. Yêu cầu hệ thống

#### 7.1.1. Phần mềm cần thiết

| Phần mềm | Phiên bản tối thiểu | Mục đích |
|----------|---------------------|----------|
| Node.js | 20.0.0 (LTS) | Runtime cho Backend và Frontend |
| Yarn | 4.12.0 | Package manager |
| MySQL | 8.0 | Hệ quản trị cơ sở dữ liệu |
| Git | 2.30+ | Quản lý source code |

#### 7.1.2. Hệ điều hành hỗ trợ

- Windows 10/11
- macOS 10.15 trở lên
- Linux (Ubuntu 20.04+, Debian 10+, CentOS 8+)

### 7.2. Cài đặt môi trường Development

#### 7.2.1. Clone source code

Mở terminal và chạy lệnh sau để tải source code về máy:

`git clone https://github.com/JakeConal/smart-restaurant-admin.git

cd smart-restaurant-admin`

#### 7.2.2. Cài đặt dependencies

Dự án sử dụng Yarn Workspaces để quản lý 3 package (backend, admin-frontend, customer-frontend) trong cùng một repository. Chỉ cần chạy một lệnh duy nhất tại thư mục gốc:

`yarn install`

Lệnh này sẽ tự động cài đặt tất cả dependencies cho cả 3 project con.

#### 7.2.3. Thiết lập Database

Bước 1 - Tạo database mới:

Đăng nhập vào MySQL và tạo database với charset utf8mb4 để hỗ trợ tiếng Việt:

`mysql -u root -p

CREATE DATABASE smart_restaurant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

EXIT;`

Bước 2 - Import schema:

Chạy script migration để tạo cấu trúc bảng:

`mysql -u root -p smart_restaurant < database/migrations/001_initial_schema.sql`

Bước 3 - Kiểm tra kết quả:

`mysql -u root -p smart_restaurant < database/migrations/verify_migration.sql`
Nếu thành công, script sẽ hiển thị danh sách 23 bảng đã được tạo.

Bước 4 - Import dữ liệu mẫu (tùy chọn):

`mysql -u root -p smart_restaurant < database/seeds/001_initial_data.sql`

#### 7.2.4. Cấu hình biến môi trường

Tạo file cấu hình cho từng module:

File backend/.env:

Nhóm Database:
| Biến | Giá trị mẫu | Mô tả |
|------|-------------|-------|
| DB_HOST | localhost | Địa chỉ MySQL server (hoặc AWS RDS endpoint) |
| DB_PORT | 3306 | Cổng MySQL |
| DB_USERNAME | root | Tên người dùng MySQL |
| DB_PASSWORD | your_password | Mật khẩu MySQL |
| DB_NAME | smart_restaurant | Tên database |
| PORT | 3001 | Cổng chạy Backend API |

Nhóm Frontend URLs:
| Biến | Giá trị mẫu | Mô tả |
|------|-------------|-------|
| ADMIN_FRONTEND_URL | http://localhost:3000 | URL Admin Dashboard |
| CUSTOMER_FRONTEND_URL | http://localhost:4000 | URL Customer App |
| BASE_URL | http://localhost:4000 | URL cơ sở cho các link trong email |

Nhóm Google OAuth:
| Biến | Giá trị mẫu | Mô tả |
|------|-------------|-------|
| GOOGLE_CLIENT_ID | 770381...googleusercontent.com | Client ID từ Google Cloud Console |
| GOOGLE_CLIENT_SECRET | GOCSPX-... | Client Secret từ Google Cloud Console |
| GOOGLE_CALLBACK_URL | http://localhost:3001/auth/google/callback | URL callback cho đăng nhập nhân viên |
| GOOGLE_CUSTOMER_CALLBACK_URL | http://localhost:3001/auth/customer/google/callback | URL callback cho đăng nhập khách hàng |

Nhóm JWT Configuration:
| Biến | Giá trị mẫu | Mô tả |
|------|-------------|-------|
| JWT_SECRET | your-super-secret-jwt-key | Khóa bí mật để ký JWT token |
| JWT_ACCESS_EXPIRY | 15m | Thời gian hết hạn access token |
| JWT_REFRESH_EXPIRY_DAYS | 7 | Số ngày hết hạn refresh token |

Nhóm Account Security:
| Biến | Giá trị mẫu | Mô tả |
|------|-------------|-------|
| MAX_LOGIN_ATTEMPTS | 5 | Số lần đăng nhập sai tối đa |
| ACCOUNT_LOCKOUT_DURATION_MINUTES | 30 | Thời gian khóa tài khoản (phút) |

Nhóm Gmail SMTP:
| Biến | Giá trị mẫu | Mô tả |
|------|-------------|-------|
| GMAIL_USER | your_email@gmail.com | Email Gmail để gửi thông báo |
| GMAIL_APP_PASSWORD | your_app_password | Mật khẩu ứng dụng Gmail (16 ký tự) |

Lưu ý: Để lấy Gmail App Password, cần bật 2-Step Verification trên tài khoản Google, sau đó truy cập https://myaccount.google.com/apppasswords để tạo mật khẩu ứng dụng.

Nhóm VNPay:
| Biến | Giá trị mẫu | Mô tả |
|------|-------------|-------|
| VNPAY_TMN_CODE | 1EXCVXNK | Mã terminal merchant VNPay |
| VNPAY_HASH_SECRET | your_hash_secret | Khóa bí mật để ký giao dịch |

File admin-frontend/.env.local:

| Biến | Giá trị mẫu | Mô tả |
|------|-------------|-------|
| NEXT_PUBLIC_API_URL | http://localhost:3001 | URL Backend API |
| NEXT_PUBLIC_WS_URL | ws://localhost:3001 | URL WebSocket |

File customer-frontend/.env.local:

| Biến | Giá trị mẫu | Mô tả |
|------|-------------|-------|
| NEXT_PUBLIC_API_URL | http://localhost:3001 | URL Backend API |
| NEXT_PUBLIC_WS_URL | ws://localhost:3001 | URL WebSocket |

#### 7.2.5. Khởi chạy hệ thống

Mở 3 terminal riêng biệt và chạy từng module:

Terminal 1 - Backend (NestJS):

cd backend

yarn start:dev

Backend sẽ chạy tại http://localhost:3001

Terminal 2 - Admin Frontend (Next.js):

cd admin-frontend

yarn dev

Admin Dashboard sẽ chạy tại http://localhost:3000

Terminal 3 - Customer Frontend (Next.js):

cd customer-frontend

yarn dev --port 4000

Customer App sẽ chạy tại http://localhost:4000

#### 7.2.6. Kiểm tra cài đặt thành công

Sau khi khởi chạy, truy cập các địa chỉ sau để kiểm tra:

| Module | URL | Kết quả mong đợi |
|--------|-----|------------------|
| Admin Dashboard | http://localhost:3000 | Trang đăng nhập Admin |
| Customer App | http://localhost:4000 | Trang chào mừng hoặc menu |

### 7.3. Dữ liệu mẫu (Seed Data)

#### 7.3.1. Nội dung dữ liệu mẫu

Khi chạy script seed (file database/seeds/001_initial_data.sql), hệ thống sẽ tạo:

Vai trò và quyền hạn:
- 6 vai trò: SUPER_ADMIN, RESTAURANT_ADMIN, MANAGER, WAITER, KITCHEN_STAFF, CUSTOMER
- 18 quyền hạn: bao gồm các quyền CRUD cho user, menu, order, table, reports, kitchen

Tài khoản nhân viên:
- 1 Super Admin (superadmin@restaurant.com)
- 1 Restaurant Admin (admin@restaurant.com)
- 1 Manager (manager@restaurant.com)
- 1 Waiter (waiter1@restaurant.com)
- 1 Kitchen Staff (kitchen1@restaurant.com)

Tài khoản khách hàng:
- 2 khách hàng mẫu (customer1@email.com, customer2@email.com)

Dữ liệu menu:
- 4 danh mục: Appetizers (Khai vị), Main Courses (Món chính), Desserts (Tráng miệng), Beverages (Đồ uống)
- 6 món ăn mẫu: Spring Rolls, Chicken Wings, Grilled Salmon, Vegetable Pasta, Chocolate Cake, Lemonade

Nhóm tùy chọn (Modifiers):
- 3 nhóm tùy chọn: Cooking Temperature (độ chín), Extra Toppings (topping thêm), Side Dishes (món ăn kèm)
- 10 lựa chọn: Rare, Medium Rare, Medium, Well Done, Extra Cheese, Bacon, Avocado, French Fries, Salad, Rice

Dữ liệu bàn:
- 5 bàn (T1 đến T5) với sức chứa từ 2-8 người
- Vị trí: Window Section, Main Hall, Private Section, Banquet Hall

#### 7.3.2. Tài khoản mặc định

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Super Admin | superadmin@restaurant.com | Password123! |
| Restaurant Admin | admin@restaurant.com | Password123! |
| Manager | manager@restaurant.com | Password123! |
| Waiter | waiter1@restaurant.com | Password123! |
| Kitchen Staff | kitchen1@restaurant.com | Password123! |
| Customer | customer1@email.com | Password123! |

Lưu ý: Đây là tài khoản mẫu cho môi trường development. Trong production, cần thay đổi mật khẩu ngay sau khi cài đặt.

### 7.4. Thông tin Demo trực tuyến

#### 7.4.1. Địa chỉ truy cập

Hệ thống đã được triển khai trực tuyến để thuận tiện cho việc đánh giá và trải nghiệm:

| Module | URL |
|--------|-----|
| Admin Dashboard | https://admin-restaurant-hcmus.netlify.app |
| Customer App | https://customer-restaurant-hcmus.netlify.app |
| Backend API | https://smart-restaurant-backend-dc3c7a3279d2.herokuapp.com |

#### 7.4.2. Tài khoản Demo

Tài khoản Admin để trải nghiệm đầy đủ tính năng:
- Email: huynhthaitoan254@gmail.com
- Mật khẩu: 123456

Quyền hạn của tài khoản này: Admin
- Quản lý toàn bộ thực đơn (thêm, sửa, xóa món ăn)
- Quản lý bàn ăn và in QR code
- Xem báo cáo doanh thu chi tiết
- Quản lý tài khoản nhân viên

#### 7.4.4. Thông tin thẻ test VNPay

Để test thanh toán trực tuyến qua VNPay sandbox:

| Thông tin | Giá trị |
|-----------|---------|
| Ngân hàng | NCB |
| Số thẻ | 9704198526191432198 |
| Tên chủ thẻ | NGUYEN VAN A |
| Ngày phát hành | 07/15 |
| Mã OTP | 123456 |

Lưu ý: Đây là thẻ test của VNPay sandbox, không phải thẻ thật. Mọi giao dịch đều là giả lập và không trừ tiền.
