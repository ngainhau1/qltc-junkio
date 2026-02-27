<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/wallet.svg" alt="Junkio Logo" width="120" />
  <h1>Junkio Expense Tracker</h1>
  
  <p><strong>Ứng dụng Quản lý Tài chính, Theo dõi Chi tiêu Cá nhân & Gia đình 🚀</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Redux-Toolkit-764ABC?logo=redux&logoColor=white" alt="Redux" />
    <img src="https://img.shields.io/badge/i18next-Ph%C3%A2n%20Lo%E1%BA%A1i%20%C4%90a%20Ng%C3%B4n%20Ng%E1%BB%AF-26A69A?logo=i18next&logoColor=white" alt="i18next" />
  </p>
</div>

---

## 📖 Giới Thiệu (Introduction)

**Junkio Expense Tracker** là một giải pháp quản lý tài chính toàn diện dành cho Cá nhân và Gia đình. Được thiết kế với triết lý **Mobile-First** (Ưu tiên Thiết bị di động), ứng dụng này không chỉ cho phép bạn theo dõi dòng tiền phức tạp qua vô số ví khác nhau, mà còn được tích hợp chuẩn trải nghiệm Native App cực kì mượt mà (Bottom Sheet, vuốt chạm không cấn viền).

Bất kể bạn muốn theo dõi chi tiêu cá nhân cơ bản hay quản lý nợ phức tạp trong một nhóm, *Junkio* đều sẵn sàng phục vụ.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

Dự án này là một Single Page Application (SPA), được cấu trúc hoàn toàn dưới dạng Khối Frontend hiện đại nhằm đảm bảo tốc độ render tuyệt đối, nói không với giật lag:

- **Khung Kiến Trúc (Core)**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/) (Build tool siêu tốc độ), [React Router DOM v7](https://reactrouter.com/) (Điều hướng Client-side).
- **Quản Lý Trạng Thái (State Management)**: [Redux Toolkit](https://redux-toolkit.js.org/) (Chia thành nhiều Slices thông minh quản lý Auth, Wallets, Transactions, Settings để không reload trang).
- **Giao Diện & Styling**: [TailwindCSS v3](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) (Hệ thống Component chuyên nghiệp, hỗ trợ trợ năng Accessibility).
- **Icon Vector**: [Lucide React](https://lucide.dev/).
- **Kiểm Định Form (Forms & Validation)**: [Formik](https://formik.org/) và [Yup](https://github.com/jquense/yup) (Cảnh báo định dạng Email, mật khẩu mượt mà bên dưới dòng nhập).
- **Trực Quan Dữ Liệu (Charts)**: [Recharts](https://recharts.org/) (Cho các biểu đồ Area và Donut sinh động).
- **Cơ sở hạ tầng & Tiện ích**: 
  - Đa ngôn ngữ: `i18next` & `react-i18next`.
  - Ngày tháng: `date-fns` (Dễ dàng format thời gian theo Locale).
  - Trích xuất File (Export Data): Tính năng tạo PDF qua `jsPDF` & Export Excel nhờ `xlsx` / `PapaParse`.

---

## ✨ Các Tính Năng Cốt Lõi & Hướng Dẫn Sử Dụng

Đây không chỉ là một App liệt kê ví tiền. Nó là vũ khí tài chính cá nhân mang theo bên mình mọi lúc. Dưới đây là cách sử dụng từng Cụm tính năng:

### 1. Bảng Khảo Sát & Báo Cáo (Dashboard & Reports)
- **Tính năng**: Tổng quan hóa mọi dòng tiền (Income vs Expense) của bạn thông qua các Biểu đồ tương tác (Area Chart cho dòng thời gian, Donut Chart cho từng danh mục). Bạn cũng có thể xuất thẳng các Báo Cáo giao dịch đang lọc thành **File PDF** hay **Excel (CSV)**.
- **Cách dùng**: Từ trang `Dashboard`, sử dụng nút lọc khoảng thời gian (7 Ngày / 30 Ngày / Tất Cả) để xem Biểu đồ tự giãn nở theo số liệu ví thực tế. Ở màn hình `Báo Cáo (Reports)`, bấm *Export* để tải dữ liệu về máy lưu trữ.

### 2. Quản Lý Ví & Dòng Tiền Đa Nguồn (Wallets)
- **Tính năng**: Cho phép cá nhân hóa từng dòng thu qua Ví Tiền Mặt, Thẻ Tín Dụng, hay Cố Tiết Kiệm (Savings).
- **Cách dùng**: Bấm "Thêm Ví mới", cấu hình số dư ban đầu. Từ đó về sau, mọi thao tác khai báo "Thêm giao dịch" trên hệ thống đều sẽ bắt bạn gán giao dịch đó vào Ví cụ thể, bảo đảm không bị thất thoát một đồng.

### 3. Tổ Đội & Giải Thuật Chia Nợ (Family Hub)
- **Tính năng**: Giải quyết vấn đề nhức nhối khi ăn chung, ở chung! Hệ thống được trang bị **Thuật toán Tham lam (Greedy Algorithm)** tự động rút gọn đường đi của dòng tiền trong nhóm. Thay vì "A nợ B, B nợ C", App sẽ chốt lại ngắn gọn "A trực tiếp trả cho C".
- **Cách dùng**: Tạo một Giao dịch nhóm (Ví dụ: "Đi ăn Buffet") -> Chọn "Ngô Ngân" là người Cầm ví (Paid By) -> Tại Mode chia đều, AI sẽ tính ra tổng số tiền mỗi cá nhân (Thành viên 1, Thành viên 2) đang nợ Ngân. Bấm vào nút `Thanh Toán Nợ (Settle Debt)`, hệ thống sẽ sinh ra các giao dịch trừ tiền bù tự động. Cực nhàn!

### 4. Hũ Mục Tiêu Tích Lũy (Goals)
- **Tính năng**: Chia nhỏ tham vọng của bạn (`Mua Xe Oto`, `Học Phí Đại Học`) thành tiến trình thực tế. Cung cấp Giao diện Thanh tiến độ (Progress Bar) phần trăm.
- **Cách dùng**: Thiết lập Mục Tiêu Giá Trị Cần Đạt (Target). Bất kể khi nào bạn có tiền nhàn rỗi, hãy bấm nút `Nạp Tiền (Deposit)` vào hũ để quan sát Thanh Tiến Độ nhích lên. Cảm xúc vô cùng "thỏa mãn"!

### 5. Siêu Việt Hóa Bản Địa (i18n & Format)
- **Tính năng**: Không bị giới hạn ngôn ngữ. Dự án được Việt hóa và Anh hóa 100% (Từ Modal thông báo đến Header biểu đồ). Format đồng tiền và Ngày tháng sẽ tự động thay đổi bám theo loại ngôn ngữ bạn chọn.
- **Cách dùng**: Mở bảng Navigation (Desktop) hoặc nút hình răng cưa dưới đáy màn (Mobile), chọn phần **Cài Đặt (Settings)**. Từ đó bạn thoải mái "Chuyển Đổi" cấu hình:
  - Ngôn ngữ: `Tiếng Việt` ↔ `English`.
  - Tiền tệ: `Việt Nam Đồng (₫)` ↔ `Đô La Mỹ ($)`. 
  - (*Màn hình sẽ load ngay lập tức mà không cần refetch lại trang Web!*)

### 6. Trải nghiệm Điện thoại Thông minh (PWA-Ready Mobile-First)
- **Tính năng**: App sinh ra là để chạy trên Smartphone.
- **Trải nghiệm thao tác**: Vuốt dọc xuống màn hình bạn sẽ thấy cụm **Navigation dán dính mép dưới** hệt như Facebook hay Zalo. Với nút bấm nổi trung tâm **(FAB - Floating Action Button)** để điền thu chi chỉ trong 1 chạm. Bất kì form nhập liệu nào cũng sẽ tuân thủ định dạng Drawer (Kéo trượt từ dưới lên như iOS), giúp nút lệnh không còn bị bao phủ bởi Bàn Phím Ảo.

---

## 🚀 Hướng Dẫn Cài Đặt (Getting Started)

Được đóng gói vô cùng tinh giản bằng Vite, bạn có thể triển khai hệ thống cực kì nhanh gọn trên máy cá nhân theo các lệnh bên dưới:

### Yêu Cầu Máy Chủ
Đảm bảo bạn đã cài đặt [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản v18 trở lên).

### Nhập môn Cài đặt Mã Nguồn

1. **Clone mã nguồn (Tải về):**
   ```bash
   git clone https://github.com/ngainhau1/qltc-junkio.git
   ```

2. **Truy cập thư mục UI Frontend:**
   ```bash
   cd Junkio-Expense-Tracker/frontend
   ```

3. **Tải các gói Thư viện phụ thuộc (Dependencies):**
   ```bash
   npm install
   ```

4. **Kích hoạt máy chủ mô phỏng Dev (Khởi Chạy):**
   ```bash
   npm run dev
   ```

5. Sau khi Terminal báo chạy thành công, truy cập `http://localhost:5173` bằng Trình duyệt và Tận hưởng thôi! 

---

## 🧪 Kiểm Thử Hệ Thống (Testing & Build)
Dự án được bảo vệ nghiêm ngặt để chuẩn bị triển khai lên Vercel / Netlify. Mọi thao tác lỗi cú pháp (Syntax) hay Khai báo dư biến đều sẽ bị chặn đứng bằng Linter.

- **Dọn Dẹp Code rác (Check Linting)**: 
  ```bash
  npm run lint
  ```
- **Xây Dựng Đóng Gói (Production Build)**: 
  ```bash
  npm run build
  ```
  *(Sản phẩm Web Build sẽ được nén lại bên trong thư mục mang tên `/dist`).*

---

## 👨‍💻 Đóng Góp Ý Kiến (Contributing)
Dự án được xây dựng với mục tiêu chia sẻ tri thức qua mã nguồn mở (Open-Source). Bạn thoải mái khởi tạo Pull Request (PR) hay Issues để chèn thêm tính năng Đồng Bộ Dữ liệu với Backend thực tế, hoặc dịch thêm các ngôn ngữ Nhật, Hàn, Pháp cực kì thuận lợi nhờ công nghệ `json` của i18n!

Cảm ơn vì đã ghé qua! 🎉

<div align="center">
  <sub>Sản phẩm được dệt nên bởi Đam mê & Sự cầu toàn. Tiêu chuẩn code 100% Quality.</sub>
</div>
