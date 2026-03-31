from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE, MSO_CONNECTOR
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "ppt"
SHOT = ROOT / "output" / "playwright"
EXT = Path(r"D:\DATN\DOCX")
PPTX = OUT / "Junkio_Expense_Tracker_Bao_Cao_Cuoi_Ky_Mau.pptx"

IMG = {
    "dashboard": SHOT / "dashboard.png",
    "transactions": SHOT / "transactions.png",
    "goals": SHOT / "goals.png",
    "family": SHOT / "family.png",
    "swagger": SHOT / "swagger.png",
    "frontend_req": EXT / "yc2.png",
    "api_req": EXT / "yc3.jpg",
    "devops_req": EXT / "yc4.jpg",
}

BG = RGBColor(247, 248, 252)
CARD = RGBColor(255, 255, 255)
NAVY = RGBColor(15, 23, 42)
SLATE = RGBColor(71, 85, 105)
MUTED = RGBColor(100, 116, 139)
BLUE = RGBColor(14, 165, 233)
TEAL = RGBColor(20, 184, 166)
GOLD = RGBColor(245, 158, 11)
GREEN = RGBColor(34, 197, 94)
BORDER = RGBColor(226, 232, 240)
LBLUE = RGBColor(224, 242, 254)
LTEAL = RGBColor(204, 251, 241)
LGOLD = RGBColor(254, 243, 199)


def I(v):
    return Inches(v)


def bg(slide, color=BG):
    f = slide.background.fill
    f.solid()
    f.fore_color.rgb = color


def box(slide, x, y, w, h, fill, line=None, radius=True, alpha=0):
    t = MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE if radius else MSO_AUTO_SHAPE_TYPE.RECTANGLE
    s = slide.shapes.add_shape(t, x, y, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.fill.transparency = alpha
    if line:
        s.line.color.rgb = line
        s.line.width = Pt(1)
    else:
        s.line.fill.background()
    return s


def text(slide, x, y, w, h, value, size=20, color=NAVY, bold=False, align=PP_ALIGN.LEFT, italic=False, font="Segoe UI"):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.TOP
    p = tf.paragraphs[0]
    p.alignment = align
    p.text = value
    r = p.runs[0]
    r.font.name = font
    r.font.size = Pt(size)
    r.font.color.rgb = color
    r.font.bold = bold
    r.font.italic = italic
    return tb


def bullets(slide, x, y, w, h, items, size=17, bullet_color=BLUE, color=SLATE):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.clear()
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(6)
        r1 = p.add_run()
        r1.text = "• "
        r1.font.size = Pt(size)
        r1.font.color.rgb = bullet_color
        r1.font.bold = True
        r2 = p.add_run()
        r2.text = item
        r2.font.size = Pt(size)
        r2.font.color.rgb = color
        r2.font.name = "Segoe UI"


def header(slide, title, sub, no):
    box(slide, I(0.65), I(0.42), I(1.1), I(0.12), BLUE, radius=True)
    text(slide, I(0.8), I(0.2), I(4.5), I(0.2), "JUNKIO EXPENSE TRACKER", 11, BLUE, True)
    text(slide, I(0.8), I(0.55), I(9.3), I(0.45), title, 26, NAVY, True)
    text(slide, I(0.8), I(1.02), I(11.0), I(0.3), sub, 12.5, MUTED)
    text(slide, I(12.2), I(0.28), I(0.45), I(0.18), str(no), 12, MUTED, True, PP_ALIGN.RIGHT)


def chip(slide, x, y, w, label, fill):
    box(slide, x, y, w, I(0.34), fill, radius=True)
    text(slide, x, y + I(0.05), w, I(0.16), label, 10.5, NAVY, True, PP_ALIGN.CENTER)


def fit(slide, path, x, y, w, h, cap=None):
    box(slide, x, y, w, h, CARD, BORDER)
    path = Path(path)
    if not path.exists():
        box(slide, x + I(0.12), y + I(0.12), w - I(0.24), h - I(0.24), LBLUE, BLUE)
        text(slide, x + I(0.2), y + h / 2 - I(0.12), w - I(0.4), I(0.2), "Thêm hình tại đây", 14, NAVY, True, PP_ALIGN.CENTER)
        return
    iw, ih = Image.open(path).size
    mx = I(0.12)
    mt = I(0.12)
    mb = I(0.38) if cap else I(0.12)
    bw, bh = w - 2 * mx, h - mt - mb
    ir, br = iw / ih, bw / bh
    if ir > br:
        pw, ph = bw, bw / ir
    else:
        ph, pw = bh, bh * ir
    px, py = x + mx + (bw - pw) / 2, y + mt + (bh - ph) / 2
    slide.shapes.add_picture(str(path), int(px), int(py), width=int(pw), height=int(ph))
    if cap:
        text(slide, x + I(0.16), y + h - I(0.26), w - I(0.32), I(0.16), cap, 11, MUTED, True, PP_ALIGN.CENTER)


def cover_image(slide, path, sw, sh):
    path = Path(path)
    if not path.exists():
        bg(slide, NAVY)
        return
    iw, ih = Image.open(path).size
    ir, sr = iw / ih, sw / sh
    if ir > sr:
        nh, nw = sh, sh * ir
        x, y = -(nw - sw) / 2, 0
    else:
        nw, nh = sw, sw / ir
        x, y = 0, -(nh - sh) / 2
    slide.shapes.add_picture(str(path), int(x), int(y), width=int(nw), height=int(nh))


def conn(slide, x1, y1, x2, y2, color):
    c = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, x1, y1, x2, y2)
    c.line.color.rgb = color
    c.line.width = Pt(1.75)


def add_cover(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    cover_image(s, IMG["dashboard"], prs.slide_width, prs.slide_height)
    box(s, 0, 0, prs.slide_width, prs.slide_height, NAVY, radius=False, alpha=0.28)
    box(s, I(0.65), I(0.65), I(6.25), I(5.95), NAVY, radius=True, alpha=0.1)
    text(s, I(0.92), I(0.88), I(3.0), I(0.2), "BÁO CÁO THUYẾT TRÌNH CUỐI KỲ", 12, LGOLD, True)
    text(s, I(0.92), I(1.45), I(5.8), I(0.8), "Junkio Expense Tracker", 28, RGBColor(255, 255, 255), True)
    text(s, I(0.92), I(2.32), I(5.6), I(0.36), "Web App quản lý chi tiêu cá nhân và gia đình", 18, RGBColor(226, 232, 240))
    text(s, I(0.92), I(3.18), I(5.2), I(0.2), "Sinh viên: [Điền họ tên]", 15, RGBColor(255, 255, 255))
    text(s, I(0.92), I(3.56), I(5.2), I(0.2), "MSSV: [Điền MSSV]", 15, RGBColor(255, 255, 255))
    text(s, I(0.92), I(3.94), I(5.2), I(0.2), "GVHD: [Điền tên giảng viên]", 15, RGBColor(255, 255, 255))
    chip(s, I(0.92), I(5.12), I(1.5), "React + Vite", LBLUE)
    chip(s, I(2.50), I(5.12), I(1.65), "Node.js + Express", LTEAL)
    chip(s, I(4.25), I(5.12), I(1.50), "Docker Compose", LGOLD)
    text(s, I(0.92), I(5.72), I(5.9), I(0.32), "Từ nhu cầu quản lý thu/chi đến một nền tảng full-stack có xác thực, dashboard, realtime và Docker hoá.", 12.5, RGBColor(226, 232, 240))


def add_bullet_slide(prs, no, title_txt, sub_txt, left_title, left_items, right_title, right_body, right_badges=None):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, title_txt, sub_txt, no)
    box(s, I(0.8), I(1.65), I(6.0), I(4.95), CARD, BORDER)
    text(s, I(1.05), I(1.92), I(2.8), I(0.2), left_title, 18, NAVY, True)
    bullets(s, I(1.05), I(2.28), I(5.45), I(4.0), left_items, 17)
    box(s, I(7.1), I(1.9), I(5.25), I(3.4), NAVY)
    text(s, I(7.45), I(2.2), I(4.55), I(0.18), right_title.upper(), 11, LGOLD, True)
    text(s, I(7.45), I(2.65), I(4.35), I(1.55), right_body, 20, RGBColor(255, 255, 255), True)
    if right_badges:
        x = 7.1
        colors = [LBLUE, LTEAL, LGOLD]
        for i, badge in enumerate(right_badges):
            chip(s, I(x), I(5.55), I(1.55), badge, colors[i % len(colors)])
            x += 1.75


def add_deck():
    OUT.mkdir(parents=True, exist_ok=True)
    prs = Presentation()
    prs.slide_width = I(13.333)
    prs.slide_height = I(7.5)
    prs.core_properties.title = "Junkio Expense Tracker - Báo cáo cuối kỳ"
    prs.core_properties.subject = "Mẫu PowerPoint hoàn chỉnh"
    prs.core_properties.author = "OpenAI Codex"

    add_cover(prs)
    add_bullet_slide(prs, 2, "Bài toán và lý do chọn đề tài", "Dự án giải quyết một bài toán thực tế và đủ chiều sâu kỹ thuật cho đồ án web full-stack.", "Những vấn đề cần giải quyết", [
        "Quản lý chi tiêu cá nhân thường rời rạc, thiếu tính hệ thống và khó tổng hợp theo thời gian.",
        "Chi tiêu chung trong gia đình dễ phát sinh thiếu minh bạch nếu không có cơ chế theo dõi rõ ràng.",
        "Nhiều ứng dụng chỉ dừng ở mức nhập liệu, chưa kết hợp tốt giữa ngân sách, mục tiêu và báo cáo.",
        "Đề tài cho phép triển khai đồng thời frontend SPA, backend RESTful, JWT, dashboard và Docker.",
    ], "Thông điệp cốt lõi", "Một hệ thống duy nhất cho giao dịch, ví, mục tiêu tiết kiệm, quỹ chung gia đình và dashboard phân tích.", ["FE / BE", "JWT", "Docker"])
    add_bullet_slide(prs, 3, "Mục tiêu và phạm vi hệ thống", "Slide này giúp hội đồng nhìn thấy rõ sản phẩm đang giải quyết gì và phạm vi kỹ thuật của đồ án.", "Mục tiêu chính", [
        "Xây dựng hệ thống full-stack tách biệt frontend và backend.",
        "Quản lý giao dịch, ví, mục tiêu, ngân sách và quỹ gia đình.",
        "Cung cấp dashboard, báo cáo và dự báo tài chính.",
        "Tích hợp JWT, RBAC, validation và thông báo realtime.",
        "Docker hoá để chạy toàn bộ hệ thống bằng một lệnh.",
    ], "Phạm vi triển khai", "React SPA ở frontend; Node.js/Express + PostgreSQL ở backend; Redis, Swagger, Postman, Jest/Vitest/Playwright cho QA và demo.", ["Admin", "Responsive", "REST JSON"])

    s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s); header(s, "Đối chiếu với yêu cầu môn học", "Ba mốc báo cáo và yêu cầu gốc đều xoay quanh frontend, API/bảo mật, tích hợp và DevOps.", 4)
    box(s, I(0.8), I(1.65), I(3.65), I(5.0), CARD, BORDER)
    text(s, I(1.05), I(1.92), I(2.5), I(0.2), "Checklist bám đề", 18, NAVY, True)
    bullets(s, I(1.05), I(2.3), I(3.0), I(3.95), [
        "Frontend theo hướng SPA, tư duy component, có responsive.",
        "Backend RESTful API trả JSON và có xác thực JWT.",
        "Có CRUD, validation, RBAC, dashboard và biểu đồ.",
        "Có tích hợp frontend - backend - database thực tế.",
        "Có Swagger/Postman, test automation và Docker Compose.",
    ], 16, GREEN)
    fit(s, IMG["frontend_req"], I(4.75), I(1.65), I(4.0), I(2.35), "Mốc frontend, component, responsive, routing")
    fit(s, IMG["api_req"], I(8.95), I(1.65), I(3.55), I(2.35), "Mốc API, Auth, Integration, Validation")
    fit(s, IMG["devops_req"], I(4.75), I(4.2), I(7.75), I(2.45), "Mốc Dockerization, tài liệu API và báo cáo tổng kết")

    s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s); header(s, "Kiến trúc tổng thể hệ thống", "Triển khai theo mô hình client-server, có tách tầng rõ ràng và phù hợp để demo bằng Docker Compose.", 5)
    nodes = [
        ("Browser", 0.95, 2.2, 1.6, 0.75, LBLUE), ("Frontend\nReact + Vite", 3.0, 1.85, 2.15, 1.0, LTEAL),
        ("Nginx\nStatic + Proxy", 3.0, 3.2, 2.15, 1.0, LGOLD), ("Backend API\nNode.js + Express", 6.0, 2.55, 2.4, 1.1, CARD),
        ("PostgreSQL", 9.35, 1.8, 2.2, 0.95, LBLUE), ("Redis", 9.35, 3.15, 2.2, 0.95, LTEAL),
        ("Swagger / Postman", 9.25, 4.65, 2.35, 0.85, LGOLD),
    ]
    for label, x, y, w, h, fill in nodes:
        box(s, I(x), I(y), I(w), I(h), fill, BORDER)
        text(s, I(x + 0.1), I(y + 0.18), I(w - 0.2), I(h - 0.2), label, 16, NAVY, True, PP_ALIGN.CENTER)
    conn(s, I(2.55), I(2.58), I(3.0), I(2.35), BLUE); conn(s, I(2.55), I(2.58), I(3.0), I(3.65), BLUE)
    conn(s, I(5.15), I(2.35), I(6.0), I(2.95), TEAL); conn(s, I(5.15), I(3.65), I(6.0), I(3.15), TEAL)
    conn(s, I(8.4), I(2.95), I(9.35), I(2.28), BLUE); conn(s, I(8.4), I(3.15), I(9.35), I(3.62), TEAL); conn(s, I(8.4), I(3.15), I(9.25), I(5.05), GOLD)
    box(s, I(0.95), I(5.7), I(10.65), I(0.6), CARD, BORDER); text(s, I(1.2), I(5.88), I(10.2), I(0.2), "Browser → Frontend → Backend API → PostgreSQL / Redis. Nginx phục vụ web và proxy /api; Docker Compose dựng toàn bộ stack.", 13, SLATE)
    chip(s, I(11.9), I(5.83), I(0.9), "Docker", LGOLD)

    s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s); header(s, "Công nghệ sử dụng", "Stack được chọn để đáp ứng đúng yêu cầu về SPA, RESTful API, RDBMS, dashboard, test và Docker.", 6)
    cols = [
        ("Frontend", ["React 19", "Vite", "Tailwind CSS", "Redux Toolkit", "React Router", "Formik + Yup", "Recharts"], 0.85, LBLUE, BLUE),
        ("Backend", ["Node.js", "Express", "Sequelize ORM", "PostgreSQL", "JWT", "Socket.IO", "Redis", "Swagger"], 4.5, LTEAL, TEAL),
        ("DevOps & QA", ["Docker", "docker-compose", "Jest", "Vitest", "Playwright", "Newman", "Git / GitHub"], 8.15, LGOLD, GOLD),
    ]
    for title_, items, x, fill, accent in cols:
        box(s, I(x), I(1.7), I(3.1), I(4.85), CARD, BORDER); box(s, I(x), I(1.7), I(3.1), I(0.48), accent)
        text(s, I(x + 0.22), I(1.92), I(2.2), I(0.2), title_, 19, NAVY, True)
        yy = 2.45
        for item in items:
            chip(s, I(x + 0.22), I(yy), I(2.55), item, fill); yy += 0.48
    text(s, I(0.95), I(6.72), I(11.6), I(0.2), "Thông điệp chính: công nghệ không chỉ để “làm được” mà còn phục vụ khả năng mở rộng, bảo mật và trình diễn ổn định.", 13, MUTED, False, PP_ALIGN.CENTER, True)

    s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s); header(s, "Thiết kế dữ liệu và nghiệp vụ lõi", "Transaction là thực thể trung tâm; các bảng còn lại bổ trợ cho ví, mục tiêu, ngân sách và hoạt động gia đình.", 7)
    box(s, I(4.95), I(2.45), I(2.25), I(0.95), BLUE); text(s, I(5.15), I(2.74), I(1.85), I(0.18), "Transactions", 21, RGBColor(255, 255, 255), True, PP_ALIGN.CENTER)
    entities = [("Users", 1.0, 1.45, LBLUE), ("Wallets", 1.0, 3.85, LTEAL), ("Categories", 4.65, 0.95, LGOLD), ("Budgets", 8.65, 0.95, LBLUE), ("Goals", 8.95, 3.95, LTEAL), ("Families", 11.05, 2.35, LGOLD), ("Notifications", 4.6, 5.4, LBLUE)]
    for name, x, y, fill in entities:
        box(s, I(x), I(y), I(1.8), I(0.72), fill, BORDER); text(s, I(x), I(y + 0.23), I(1.8), I(0.18), name, 14, NAVY, True, PP_ALIGN.CENTER); conn(s, I(x + 0.9), I(y + 0.36), I(6.05), I(2.92), BORDER)
    box(s, I(0.85), I(5.72), I(12.0), I(0.68), CARD, BORDER); bullets(s, I(1.05), I(5.9), I(11.5), I(0.28), [
        "PostgreSQL được quản lý bằng migrations, các thực thể phản ánh trực tiếp nghiệp vụ tài chính cá nhân và gia đình.",
        "Seeder/demo data hỗ trợ trình diễn nhanh các luồng đăng nhập, CRUD, budget, goal và admin dashboard.",
    ], 12.5, TEAL, SLATE)

    s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s); header(s, "Frontend: UI/UX và tư duy component", "Ứng dụng được xây dựng theo mô hình SPA, có routing phía client, responsive và chia tách component để tái sử dụng.", 8)
    box(s, I(0.82), I(1.72), I(3.75), I(4.95), CARD, BORDER); text(s, I(1.05), I(1.98), I(2.5), I(0.2), "Điểm nhấn frontend", 18, NAVY, True)
    bullets(s, I(1.05), I(2.35), I(3.15), I(4.0), [
        "SPA bằng React + React Router, chuyển trang không reload.",
        "Redux Toolkit quản lý state toàn cục và async flow.",
        "Formik/Yup xử lý form và validation phía client.",
        "Tailwind CSS + component dùng chung giúp UI đồng nhất.",
        "Responsive cho desktop, tablet và mobile.",
    ], 16)
    fit(s, IMG["dashboard"], I(4.85), I(1.72), I(3.5), I(2.27), "Dashboard")
    fit(s, IMG["goals"], I(8.55), I(1.72), I(3.6), I(2.27), "Goals")
    fit(s, IMG["family"], I(4.85), I(4.24), I(3.5), I(2.27), "Family")
    fit(s, IMG["transactions"], I(8.55), I(4.24), I(3.6), I(2.27), "Transactions")

    s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s); header(s, "Backend: API, bảo mật và phân quyền", "Backend cung cấp RESTful API chuẩn JSON, có middleware bảo mật, RBAC 3 vai trò và tài liệu Swagger để demo trực tiếp.", 9)
    box(s, I(0.82), I(1.72), I(4.25), I(4.95), CARD, BORDER); text(s, I(1.05), I(1.98), I(2.8), I(0.2), "Các điểm kỹ thuật chính", 18, NAVY, True)
    bullets(s, I(1.05), I(2.35), I(3.55), I(3.85), [
        "RESTful API theo resource: auth, wallets, transactions, goals, families, admin...",
        "JWT access token + refresh token cookie cho phiên đăng nhập.",
        "Mật khẩu được hash bằng bcrypt, không lưu plain text trong DB.",
        "Middleware bảo mật: Helmet, CORS, rate-limit, auth, role, audit.",
        "RBAC có 3 vai trò chính: admin, staff, member.",
        "Validation được kiểm tra ở backend trước khi thao tác với dữ liệu.",
    ], 15.5, TEAL)
    chip(s, I(1.05), I(6.08), I(1.05), "Admin", LGOLD); chip(s, I(2.18), I(6.08), I(1.05), "Staff", LTEAL); chip(s, I(3.31), I(6.08), I(1.2), "Member", LBLUE)
    fit(s, IMG["swagger"], I(5.35), I(1.72), I(7.1), I(4.95), "Swagger UI - tài liệu API dùng trực tiếp trong buổi báo cáo")

    s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s); header(s, "Chức năng nổi bật và luồng nghiệp vụ trình diễn", "Điểm mạnh của dự án là không dừng ở CRUD, mà có thêm nhiều luồng nghiệp vụ cho gia đình, mục tiêu và phân tích tài chính.", 10)
    fit(s, IMG["transactions"], I(0.82), I(1.82), I(5.15), I(4.65), "Màn hình giao dịch - import/export, filter, recurring, detail modal")
    cards = [
        ("Quản lý giao dịch & ví", "Tạo, xem, sửa, xoá giao dịch; ví cá nhân và ví gia đình.", LBLUE),
        ("Ngân sách & mục tiêu", "Theo dõi budget, nạp tiền vào goal và đo tiến độ đạt mục tiêu.", LTEAL),
        ("Gia đình & shared expense", "Quản lý thành viên, chi tiêu chung và công nợ nội bộ.", LGOLD),
        ("Logic nghiệp vụ nâng cao", "Recurring engine, debt simplification, realtime notification.", LBLUE),
    ]
    yy = 1.92
    for title_, desc, fill in cards:
        box(s, I(6.25), I(yy), I(6.1), I(0.96), fill, BORDER)
        text(s, I(6.48), I(yy + 0.16), I(2.6), I(0.18), title_, 15.5, NAVY, True)
        text(s, I(6.48), I(yy + 0.42), I(5.45), I(0.24), desc, 11.5, SLATE)
        yy += 1.12
    box(s, I(6.25), I(6.02), I(6.1), I(0.46), CARD, BORDER)
    text(s, I(6.45), I(6.11), I(5.7), I(0.18), "Flow demo gợi ý: Người dùng thêm giao dịch → Frontend gọi API → Backend validate + lưu DB → UI cập nhật số liệu và dashboard.", 11.5, SLATE)

    s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s); header(s, "Kiểm thử, tài liệu API và QA", "Bên cạnh chức năng, dự án còn có lớp kiểm thử và tài liệu kỹ thuật để tăng độ tin cậy khi demo.", 11)
    stat_data = [(0.85, "Backend test", "20 suite / 112 test pass", BLUE), (3.85, "Smoke API", "Auth + Transaction", TEAL), (6.5, "Tài liệu API", "Swagger + Postman", GOLD), (9.2, "Frontend QA", "Vitest + Playwright", BLUE)]
    for x, a, b, c in stat_data: box(s, I(x), I(1.85), I(2.75 if x == 0.85 else 2.4 if x == 3.85 else 2.45 if x == 6.5 else 3.05), I(1.0), CARD, BORDER)
    text(s, I(1.27), I(2.07), I(2.2), I(0.16), "Backend test", 12, MUTED, True); text(s, I(1.27), I(2.35), I(2.2), I(0.2), "20 suite / 112 test pass", 18, NAVY, True)
    text(s, I(4.27), I(2.07), I(1.8), I(0.16), "Smoke API", 12, MUTED, True); text(s, I(4.27), I(2.35), I(1.8), I(0.2), "Auth + Transaction", 18, NAVY, True)
    text(s, I(6.92), I(2.07), I(2.1), I(0.16), "Tài liệu API", 12, MUTED, True); text(s, I(6.92), I(2.35), I(2.1), I(0.2), "Swagger + Postman", 18, NAVY, True)
    text(s, I(9.62), I(2.07), I(2.5), I(0.16), "Frontend QA", 12, MUTED, True); text(s, I(9.62), I(2.35), I(2.5), I(0.2), "Vitest + Playwright", 18, NAVY, True)
    box(s, I(0.85), I(3.15), I(5.75), I(3.25), CARD, BORDER); text(s, I(1.1), I(3.42), I(3.0), I(0.2), "Có thể trình bày trong buổi bảo vệ", 18, NAVY, True)
    bullets(s, I(1.1), I(3.82), I(5.05), I(2.2), ["Đăng nhập, lấy JWT token và gọi API protected.", "Trình diễn validation với dữ liệu sai để nhận mã lỗi 400/422.", "Trình diễn CRUD ví hoặc giao dịch trên dữ liệu thật.", "Mở Swagger/Postman để chứng minh API có tài liệu rõ ràng."], 15.5, GREEN)
    box(s, I(6.85), I(3.15), I(5.4), I(3.25), NAVY); text(s, I(7.12), I(3.45), I(4.8), I(0.2), "Thông điệp QA", 18, RGBColor(255, 255, 255), True)
    text(s, I(7.12), I(3.9), I(4.7), I(1.45), "Dự án không chỉ “chạy được”, mà còn có test backend thực thi, tài liệu API dùng trực tiếp và stack Docker kiểm tra được bằng môi trường thật.", 19, RGBColor(226, 232, 240), True)
    text(s, I(7.12), I(5.55), I(4.75), I(0.18), "Mốc kiểm tra thực tế: 31/03/2026", 12, LGOLD, True)

    s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s); header(s, "Docker hoá và triển khai", "Toàn bộ hệ thống có thể dựng lại bằng một lệnh thông qua docker-compose, phù hợp với yêu cầu one-click demo.", 12)
    box(s, I(0.85), I(1.8), I(5.65), I(2.55), NAVY); text(s, I(1.1), I(2.05), I(3.2), I(0.18), "Lệnh demo chính", 16, LGOLD, True)
    text(s, I(1.1), I(2.42), I(4.9), I(0.22), "docker compose up -d --build", 22, RGBColor(255, 255, 255), True, font="Consolas")
    text(s, I(1.1), I(2.92), I(4.95), I(0.78), "Sau khi dựng xong có thể truy cập:\n• Web: http://localhost\n• API: http://localhost:5000\n• Swagger: http://localhost:5000/api-docs", 13, RGBColor(226, 232, 240), font="Consolas")
    services = [("web", "Nginx + React build", "Port 80", LBLUE, 6.8, 1.8), ("api", "Node.js + Express", "Port 5000", LTEAL, 9.6, 1.8), ("db", "PostgreSQL 15", "Port 5432", LGOLD, 6.8, 3.1), ("redis", "Redis 7", "Port 6379", LBLUE, 9.6, 3.1)]
    for name, desc, port, fill, x, y in services:
        box(s, I(x), I(y), I(2.55), I(1.05), fill, BORDER); text(s, I(x + 0.18), I(y + 0.18), I(1.1), I(0.16), name, 16, NAVY, True); text(s, I(x + 0.18), I(y + 0.45), I(2.0), I(0.14), desc, 11.5, SLATE); text(s, I(x + 0.18), I(y + 0.7), I(1.5), I(0.14), port, 11.5, MUTED, True)
    box(s, I(0.85), I(4.7), I(11.4), I(1.7), CARD, BORDER); bullets(s, I(1.1), I(4.98), I(10.8), I(1.1), ["Container API tự chạy migrate và seed demo data khi khởi động.", "Healthcheck được cấu hình cho Postgres, Redis và API trước khi web phụ thuộc vào.", "Kiến trúc này giảm công cài đặt thủ công khi báo cáo trước hội đồng."], 14.5, TEAL)

    s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s); header(s, "Kết quả đạt được, hạn chế và hướng phát triển", "Slide kết thúc nội dung kỹ thuật bằng một đánh giá cân bằng: đạt được gì, còn gì cần hoàn thiện và có thể mở rộng theo hướng nào.", 13)
    groups = [("Kết quả đạt được", ["Hoàn thiện kiến trúc full-stack tách biệt FE/BE.", "Có JWT, RBAC, dashboard, chart, Swagger và Docker.", "Trình diễn được nhiều nghiệp vụ hơn CRUD cơ bản."], 0.85, LBLUE, BLUE), ("Hạn chế hiện tại", ["Seeder dữ liệu lớn 500-1000 bản ghi cần hoàn thiện thêm.", "Độ phủ test frontend và CI release còn có thể tăng.", "Một số edge case UI/UX vẫn có thể tối ưu thêm."], 4.45, LGOLD, GOLD), ("Hướng phát triển", ["Tích hợp mobile app hoặc PWA offline.", "Gợi ý ngân sách thông minh bằng AI/ML.", "Kết nối e-wallet hoặc open banking trong tương lai."], 8.05, LTEAL, TEAL)]
    for title_, items, x, fill, accent in groups:
        box(s, I(x), I(1.9), I(3.0), I(4.6), CARD, BORDER); box(s, I(x), I(1.9), I(3.0), I(0.55), fill); text(s, I(x + 0.22), I(2.16), I(2.5), I(0.18), title_, 18, NAVY, True); bullets(s, I(x + 0.22), I(2.62), I(2.55), I(3.35), items, 15, accent)

    s = prs.slides.add_slide(prs.slide_layouts[6]); box(s, 0, 0, prs.slide_width, prs.slide_height, NAVY, radius=False)
    box(s, I(0.75), I(0.75), I(11.85), I(6.0), NAVY, BLUE); text(s, I(1.15), I(1.25), I(3.0), I(0.18), "KẾT LUẬN", 12, LGOLD, True)
    text(s, I(1.15), I(2.0), I(9.8), I(0.72), "Junkio Expense Tracker đã chứng minh được năng lực xây dựng một hệ thống web full-stack có tính thực tiễn, có bảo mật, có dashboard và có khả năng triển khai thực tế.", 26, RGBColor(255, 255, 255), True)
    text(s, I(1.15), I(3.35), I(8.7), I(0.46), "Em xin cảm ơn thầy/cô và hội đồng đã lắng nghe.\nRất mong nhận được câu hỏi và góp ý.", 18, RGBColor(226, 232, 240))
    chip(s, I(1.15), I(5.25), I(1.25), "Q&A", LGOLD); chip(s, I(2.55), I(5.25), I(1.65), "Cảm ơn", LTEAL); text(s, I(12.15), I(0.28), I(0.45), I(0.18), "14", 12, RGBColor(203, 213, 225), True, PP_ALIGN.RIGHT)

    prs.save(str(PPTX))
    print(PPTX)


if __name__ == "__main__":
    add_deck()
