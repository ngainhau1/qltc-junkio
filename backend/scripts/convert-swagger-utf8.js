const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '../routes');
if (!fs.existsSync(DIR)) {
    console.error('Lỗi: Không tìm thấy thư mục ' + DIR);
    process.exit(1);
}

// Dictionary các từ cần thay thế trong Swagger (Summary, Description, Tags)
const dict = {
    // Auth & Users
    "Xac thuc nguoi dung va quan ly phien dang nhap": "Xác thực người dùng và quản lý phiên đăng nhập",
    "Dang ky tai khoan moi": "Đăng ký tài khoản mới",
    "Dang ky thanh cong": "Đăng ký thành công",
    "Email da ton tai": "Email đã tồn tại",
    "Dang nhap va nhan JWT access token": "Đăng nhập và nhận JWT access token",
    "Dang nhap thanh cong": "Đăng nhập thành công",
    "JWT access token het han sau 15 phut": "JWT access token hết hạn sau 15 phút",
    "Email hoac mat khau khong dung": "Email hoặc mật khẩu không đúng",
    "Lam moi access token tu refresh token cookie": "Làm mới access token từ refresh token cookie",
    "Gui cookie refresh_token, server tra access token moi cung thong tin user toi thieu.": "Gửi cookie refresh_token, server trả access token mới cùng thông tin user tối thiểu.",
    "Lam moi token thanh cong": "Làm mới token thành công",
    "Khong co refresh token": "Không có refresh token",
    "Refresh token het han hoac khong hop le": "Refresh token hết hạn hoặc không hợp lệ",
    "Dang xuat va xoa refresh token cookie": "Đăng xuất và xóa refresh token cookie",
    "Dang xuat thanh cong": "Đăng xuất thành công",
    "Alias tuong thich cho /api/users/me": "Endpoint tương thích cho /api/users/me",
    "Thong tin nguoi dung hien tai": "Thông tin người dùng hiện tại",
    "Alias tuong thich cho /api/users/me/avatar": "Endpoint tương thích cho /api/users/me/avatar",
    "Cap nhat avatar thanh cong": "Cập nhật avatar thành công",
    "Gui email khoi phuc mat khau": "Gửi email khôi phục mật khẩu",
    "Email khoi phuc da duoc gui": "Email khôi phục đã được gửi",
    "Email khong ton tai": "Email không tồn tại",
    "Dat lai mat khau bang token khoi phuc": "Đặt lại mật khẩu bằng token khôi phục",
    "Token khoi phuc tu email": "Token khôi phục từ email",
    "Mat khau da duoc dat lai": "Mật khẩu đã được đặt lại",
    "Token khong hop le hoac da het han": "Token không hợp lệ hoặc đã hết hạn",

    // Wallets & Categories
    "Quan ly vi ca nhan va vi gia dinh": "Quản lý ví cá nhân và ví gia đình",
    "Lay danh sach vi ma user co quyen truy cap": "Lấy danh sách ví mà user có quyền truy cập",
    "Danh sach vi thanh cong": "Danh sách ví thành công",
    "Tao vi moi": "Tạo ví mới",
    "Bo qua family_id de tao vi ca nhan. Gui family_id de tao vi gia dinh trong family ma ban duoc phep truy cap.": "Bỏ qua family_id để tạo ví cá nhân. Gửi family_id để tạo ví gia đình trong gia đình mà bạn được phép truy cập.",
    "Tao vi ca nhan": "Tạo ví cá nhân",
    "Tao vi gia dinh": "Tạo ví gia đình",
    "Tao vi thanh cong": "Tạo ví thành công",
    "Ten vi da ton tai trong cung scope": "Tên ví đã tồn tại trong cùng scope",
    "Du lieu khong hop le": "Dữ liệu không hợp lệ",
    "Cap nhat thong tin vi": "Cập nhật thông tin ví",
    "Cap nhat vi thanh cong": "Cập nhật ví thành công",
    "Khong tim thay vi": "Không tìm thấy ví",
    "Xoa vi": "Xóa ví",
    "Xoa vi thanh cong": "Xóa ví thành công",

    // Transactions
    "Quan ly giao dich thu chi, chuyen tien, import va export": "Quản lý giao dịch thu chi, chuyển tiền, nạp và xuất dữ liệu",
    "Lay danh sach giao dich co phan trang va filter": "Lấy danh sách giao dịch có phân trang và bộ lọc",
    "Chon ngu canh du lieu can xem": "Chọn ngữ cảnh dữ liệu cần xem (cá nhân / gia đình)",
    "Tim theo description": "Tìm kiếm theo từ khóa mô tả (description)",
    "Danh sach giao dich thanh cong": "Danh sách giao dịch thành công",
    "Tao giao dich moi": "Tạo giao dịch mới",
    "Can co it nhat mot vi hop le truoc khi tao giao dich. wallet_id phai thuoc vi ma user co quyen truy cap.": "Cần có ít nhất một ví hợp lệ. `wallet_id` phải là ví mà bạn có quyền sở hữu.",
    "Tao giao dich thanh cong": "Tạo giao dịch mới thành công",
    "Chua co vi hoac so du vi khong du": "Chưa có ví hoặc số dư ví không đủ",
    "Du lieu body khong hop le": "Dữ liệu body gửi lên không hợp lệ",
    "Chuyen tien giua hai vi": "Chuyển tiền giữa hai ví",
    "Chuyen tien thanh cong": "Chuyển khoản thành công",
    "Chua co vi hop le hoac so du khong du": "Ví gửi không hợp lệ hoặc số dư không đủ định mức",
    "Import nhieu giao dich": "Nhập (Import) hàng loạt giao dịch từ file",
    "Import thanh cong": "Nhập dữ liệu thành công",
    "Danh sach rong hoac user chua co vi hop le": "Body request rỗng hoặc bạn chưa có ví hợp lệ",
    "Export giao dich theo dung bo filter dang dung": "Xuất Excel/PDF danh sách giao dịch theo bộ lọc hiện tại",
    "File export thanh cong": "File export được tạo thành công",
    "Lay chi tiet mot giao dich trong scope duoc phep": "Lấy thông tin chi tiết của một giao dịch",
    "Chi tiet giao dich thanh cong": "Trả về chi tiết giao dịch thành công",
    "Khong tim thay giao dich trong scope truy cap": "Không tìm thấy giao dịch hoặc bạn không có quyền truy cập",
    "Xoa giao dich va hoan tac so du vi": "Xóa giao dịch (Số dư ví sẽ được tự động hoàn tác)",
    "Xoa giao dich thanh cong": "Xóa giao dịch thành công",

    // Goals & Budgets
    "Quan ly muc tieu ca nhan va gia dinh": "Quản lý mục tiêu cá nhân và gia đình",
    "Lay danh sach muc tieu cua user (bao gom ca muc tieu gia dinh ma user tham gia)": "Lấy danh sách các mục tiêu (bao gồm gia đình)",
    "Danh sach muc tieu thanh cong": "Danh sách mục tiêu thành công",
    "Tao muc tieu moi": "Tạo mục tiêu mới",
    "Tao muc tieu thanh cong": "Tạo mục tiêu thành công",
    "Cap nhat muc tieu": "Cập nhật mục tiêu",
    "Cap nhat muc tieu thanh cong": "Cập nhật mục tiêu thành công",
    "Khong tim thay muc tieu hoac khong co quyen": "Không tìm thấy mục tiêu hoặc không có quyền",
    "Bo qua family_id de tao personal goal. Gui family_id de tao family goal.": "Bỏ qua family_id để tạo mục tiêu cá nhân. Gửi family_id để tạo mục tiêu gia đình.",
    "Xoa muc tieu": "Xóa mục tiêu",
    "Nap tien vao muc tieu tu vi": "Nạp tiền vào mục tiêu từ ví cụ thể",
    "Nap tien thanh cong": "Nạp tiền thành công",
    "Muc tieu khong ton tai": "Mục tiêu không tồn tại",
    
    // Family
    "Quan ly gia dinh va quan he thanh vien": "Quản lý gia đình và quan hệ thành viên",
    "Lay danh sach gia dinh cua toi": "Lấy danh sách gia đình",
    "Danh sach gia dinh thanh cong": "Danh sách gia đình thành công",
    "Tao gia dinh moi": "Tạo gia đình mới",
    "Tao gia dinh thanh cong": "Tạo gia đình thành công",
    "Xem chi tiet gia dinh (bao gom danh sach thanh vien)": "Xem chi tiết gia đình",
    "Chi tiet gia dinh thanh cong": "Chi tiết gia đình thành công",
    "Gia dinh khong ton tai": "Gia đình không tồn tại",
    "Xoa gia dinh": "Xóa gia đình",
    "Xoa gia dinh thanh cong": "Xóa gia đình thành công",
    "Chi nguoi tao moi co quyen xoa": "Chỉ người tạo mới có quyền xóa",
    "Them thanh vien vao gia dinh bang email": "Thêm thành viên vào gia đình bằng Email",
    "Them thanh vien thanh cong": "Thêm thành viên thành công",
    "Gia dinh hoac user khong ton tai": "Gia đình hoặc User không tồn tại",
    "User da la thanh vien": "User đã là thành viên",
    "Xoa thanh vien hoac tu dong roi khoi gia dinh": "Xóa thành viên / Tự động rời khỏi",
    "Roi gia dinh thanh cong hoac xoa thanh vien thanh cong": "Thành công rời khỏi gia đình",

    // Admin
    "Quan tri he thong, chi danh cho role admin": "Quản trị hệ thống, chỉ dành cho role admin",
    "Lay tong quan he thong cap platform": "Lấy tổng quan hệ thống (Platform)",
    "Du lieu dashboard admin thanh cong": "Dữ liệu dashboard admin thành công",
    "Lay analytics toan he thong": "Lấy System Analytics toàn hệ thống",
    "Analytics admin thanh cong": "Analytics admin thành công",
    "Lay tong quan tai chinh toan he thong": "Lấy Financial Overview",
    "Lay danh sach user toan he thong": "Lấy danh sách người dùng",
    "Xoa user": "Xóa user",
    "Khong duoc xoa chinh minh": "Không được xóa chính mình",
    "Khoa hoac mo khoa tai khoan user": "Khóa hoặc mở khóa tài khoản user",
    "Thay doi vai tro user": "Thay đổi role user",
    "Doi role thanh cong": "Đổi role thành công",

    // Debts & Others
    "Ghi nhan khoan vay": "Ghi nhận khoản vay",
    "Thanh toan no": "Thanh toán khoản nợ",

    "Chua ho tro": "Chưa hỗ trợ"
};

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Lặp qua object keys và thay thế
    for (const [key, value] of Object.entries(dict)) {
        // Thay string exact match
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, value);
    }
    
    // Format riêng Description của route Upload Avatar ở authorRoutes/userRoutes.js
    content = content.replace(
        /description: Compatibility alias\. Canonical endpoint la \/api\/users\/me\/avatar\./g, 
        "description: Tải lên ảnh đại diện (avatar) của người dùng. Hỗ trợ định dạng jpeg/png, dung lượng tối đa 5MB."
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Đã refactor UTF-8 file: ${file}`);
});
console.log('---✅ KẾT THÚC THAY ĐỔI UTF-8---');
