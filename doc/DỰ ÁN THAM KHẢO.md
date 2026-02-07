lOMoAR cPSD|15962736


##### HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG


##### CƠ SỞ TẠI TP. HỒ CHÍ MINH


##### Khoa CNTT 2


#### Đề tài:


# BÁO CÁO ĐỒ ÁN MÔN HỌC

### ỨNG DỤNG QUẢN LÍ CHI TIÊU CÁ NHÂN

###### Môn học : Phát triển phần mềm hướng dịch vụ Giảng viên : ThS. Huỳnh Trung Trụ Nhóm : 34 Danh sách 1. Nguyễn Văn Chung N18DCCN024 2. Nguyễn Đăng Hậu N18DCCN060 3. Nguyễn Thành Phong N18DCCN147 4. Lương Đình Khang N18DCCN093

TP. Hồ Chí Minh, tháng 06 năm 2022


lOMoAR cPSD|15962736


NHẬN XÉT CỦA GIẢNG VIÊN


lOMoAR cPSD|15962736

#### LỜI CẢM ƠN

Đầu tiên, chúng em xin gửi lời cảm ơn chân thành đến “Học viện Công nghệ Bưu chính viễn
thông” đã đưa môn học Phát triển phần mềm hướng dịch vụ vào chương trình giảng dạy.

Đặc biệt, chúng em xin gửi lời cảm ơn sâu sắc đến giáo viên bộ môn - thầy giáo Huỳnh Trung
Trụ đã dạy dỗ, truyền đạt những kiến thức quý báu cho chúng em trong suốt thời gian học tập vừa
qua. Trong thời gian tham gia lớp học Phát triển phần mềm hướng dịch vụ, chúng em đã có thêm
cho mình nhiều kiến thức bổ ích, tinh thần học tập hiệu quả, nghiêm túc. Đây chắc chắn sẽ là
những kiến thức quý báu, là hành trang để chúng em có thể vững bước sau này.

Bộ môn Phát triển phần mềm hướng dịch vụ là môn học thú vị, vô cùng bổ ích và có tính thực tế
cao. Đảm bảo cung cấp đủ kiến thức, gắn liền với nhu cầu thực tiễn của sinh viên. Tuy nhiên, do
vốn kiến thức còn nhiều hạn chế và khả năng tiếp thu thực tế còn nhiều bỡ ngỡ. Mặc dù chúng em
đã cố gắng hết sức nhưng chắc chắn bài báo cáo khó có thể tránh khỏi những thiếu sót và nhiều
chỗ còn chưa chính xác, kính mong thầy xem xét và góp ý để bài báo cáo của nhóm 34 chúng em
được hoàn thiện hơn.


Chúng em xin chân thành cảm ơn.

NHÓM 34


lOMoAR cPSD|15962736

## Chương 1: MÔ TẢ HỆ THỐNG
#### I.Mô tả hệ thống


lOMoAR cPSD|15962736


###### a. Mô hình sơ đồ


lOMoAR cPSD|15962736




###### Tên bảng Mô tả Bảng mục tiêu, sẽ là những mục tiêu mp_goals cần đạt được


###### Bảng chứa danh sách các giao dịch của mp_transactions người dùng


###### Bảng chưa toàn bộ danh sách các thể mp_categories loại của giao dịch: mua sắm, ăn uống, … Bảng chưa danh sách các budget (ngân mp_budgets sách chi tiêu) là số tiền mà bạn dự định sẽ bỏ ra để chi cho cái gì đó


lOMoAR cPSD|15962736












|mp_users hệ thống|Bảng chứa danh sách người dùng trong|
|---|---|
|<br>hàng (không có chứa mật khẩu), mp_aco<br>hiện có bảng chứa thông báo của hệ thốn|Bảng chưa danh sách các tài khoản ngân<br>      unts<br>Gồm: tên, mô tả, số tài khoản, số tiền<br>        g tới mp_notifications người dùng|
|<br>mp_general_data|<br>Bảng chứa các thông tin khác của|
|4.Kiến trúc REST API|website|



b. Đặc tả kiến trúc

###### Rest API là một ứng dụng được dùng để chuyển đổi cấu trúc của dữ liệu có những phương thức giúp kết nối với các thư viện và ứng dụng khác nhau. Rest Api thường không được xem là công nghệ, mà nó là giải pháp giúp tạo ra những ứng dụng web services chuyên dụng để thay thế cho nhiều kiểu khác như: SOAP, WSDL,... API là từ viết tắt của cụm từ Application Programming Interface, đây là tập hợp những quy tắc và cơ chế mà theo đó thì: Một ứng dụng hoặc một thành phần nào đó sẽ tương tác với một ứng dụng hoặc một số thành phần khác. API có thể sẽ được trả về dữ liệu mà người dùng cần cho chính ứng dụng của bạn với những kiểu dữ liệu được dùng phổ biến như JSON hoặc XML.


lOMoAR cPSD|15962736

###### Rest là từ viết tắt của Representational State Transfer: Nó là một trong những dạng chuyển đổi cấu trúc, với kiểu kiến trúc thường được viết API. Rest thường sử dụng dụng phương thức HTTP đơn giản để có thể tạo ra giao tiếp giữa các máy.Bởi vì thế, thay vì phải sử dụng một URL cho việc xử lý một số thông tin của người dùng thì Rest sẽ yêu cầu HTTP như: GET, POST, DELETE,... đến với bất kỳ một URL để được xử lý dữ liệu.


lOMoAR cPSD|15962736

###### Mô hình MVC là mô hình gồm 3 lớp: Model, View, Controller. Cụ thể như sau: • Model: Lớp này chịu trách nhiệm quản lí dữ liệu: giao tiếp với cơ sở dữ liệu, chịu trách nhiệm lưu trữ hoặc truy vấn dữ liệu. • View: Lớp này chính là giao diện của ứng dụng, chịu trách nhiệm biểu diễn dữ liệu của ứng dụng thành các dạng nhìn thấy được. • Controller: Lớp này đóng vai trò quản lí và điều phối luồng hoạt động của ứng dụng. Tầng này sẽ nhận request từ client, điều phối các Model và View để có thể cho ra output thích hợp và trả kết quả về cho người dung.


lOMoAR cPSD|15962736

###### View: Tương tự như trong mô hình MVC, View là phần giao diện của ứng dụng để hiển thị dữ liệu và nhận tương tác của người dùng. Một điểm khác biệt so với các ứng dụng truyền thống là View trong mô hình này tích cực hơn. Nó có khả năng thực hiện các hành vi và phản hồi lại người dùng thông qua tính năng binding, command. Model: Cũng tương tự như trong mô hình MVC. Model là các đối tượng giúp truy xuất và thao tác trên dữ liệu thực sự. ViewModel: Lớp trung gian giữa View và Model. ViewModel có thể được xem là thành phần thay thế cho Controller trong mô hình MVC. Nó chứa các mã lệnh cần thiết để thực hiện data binding, command.


lOMoAR cPSD|15962736

###### ViewModel không hề biết gì về View, một ViewModel có thể được sử dụng cho nhiều View (one-to-many). ViewModel sử dụng Observer design pattern để liên lạc với View (thường được gọi là binding data, có thể là 1 chiều hoặc 2 chiều tùy nhu cầu ứng dụng). Chính đặc điểm này MVVM thường được phối hợp với các thư viện hỗ trợ Reactive Programming hay Event/Data Stream, đây là triết lý lập trình hiện đại và hiệu quả phát triển rất mạnh trong những năm gần đây.
## Chương 2: MÔI TRƯỜNG MÁY CHỦ WEBSERVER

###### LAMP là viết tắt của Linux, Apache, MySQL và PHP (cũng có thể là Python, Perl nhưng bài này chỉ nói về Php), mỗi trong số đó là các gói phần mềm riêng lẻ được kết hợp để tạo thành một giải pháp máy chủ web linh hoạt. Các thành phần này, được sắp xếp theo các lớp hỗ trợ lẫn nhau, tạo thành các stack phần mềm. • Linux: là lớp đầu tiên trong stack. Hệ điều hành này là cơ sở nền tảng cho các lớp phần mềm khác. • Apache đóng vai trò một HTTP server dùng để xử lý các yêu cầu gửi tới máy chủ. • Mysql là cơ sở dữ liệu để lưu trữ mọi thông tin trên website. • PHP sau đó sẽ xử lý các nhiệm vụ cần thiết hoặc kết nối với CSDL MySQL để lấy thông tin cần thiết sau đó trả về cho Apache. Apache cuối cùng sẽ trả kết quả nhận được về cho máy khách đã gửi yêu cầu tới.


lOMoAR cPSD|15962736


## Chương 3: CÁC CLIENT, APPLICATION


## TRUY CẬP API
##### I. Ứng dụng Android Home Activity


###### Đây là activity quan trọng, đóng vai trò là màn hình chính của ứng dụng. Từ home activity ta có thể truy cập tới bất kì chức năng khác nếu muốn. Activity này là nơi quản lý và sử dụng các Fragment
##### Introduce Activity


###### Đây là nơi hiển thị các màn hình giới thiệu nếu đây là lần đầu tiên người


###### Màn hình giới thiệu ứng dụng
##### Main Activity
###### Bản chất là màn hình đăng nhập. Nếu người dùng lần đầu mở ứng dụng thì sẽ đi qua Introduce Activity trước rồi mới tới màn hình Đăng nhập. Ngược lại, nếu đã đăng nhập tài khoản thì khi mở ứng dụng sẽ vào ngay màn hình Home Activity.


lOMoAR cPSD|15962736

###### Màn hình đăng nhập ứng dụng. Hỗ trợ 3 hình thức đăng nhập khác nhau


lOMoAR cPSD|15962736

###### Màn hình chính và các chức năng chủ chốt
##### Transaction
###### Quản lý các nguồn thu nhập/hoạt động chi tiêu và tạo sao kê với nhiều tùy chọn khác nhau


lOMoAR cPSD|15962736

###### Chức năng quản lý các hoạt động thu nhập/chi tiêu


lOMoAR cPSD|15962736

###### Thêm mới hoặc chỉnh sửa nội dung dễ dàng


lOMoAR cPSD|15962736

###### Sao kê với các thông tin theo chuẩn Ngân hàng Trung ương Việt Nam Card


lOMoAR cPSD|15962736

###### Tạo thẻ ngân hàng và kiểm soát số dư tài khoản


##### Category



lOMoAR cPSD|15962736

###### Tạo các thể loại thu nhập/chi tiêu theo mong muốn


lOMoAR cPSD|15962736

##### Goal

###### Chức năng này giúp bạn đặt ra các mục tiêu để và kiểm soát việc tiết kiệm tiền bạc


lOMoAR cPSD|15962736

###### Để dành thêm được một khoản tiền ?? Cập nhật ngay thôi
##### Notification


lOMoAR cPSD|15962736

###### Hiển thị thông báo ngay trên thanh quick-setting của thiết bị
##### Dark Mode


lOMoAR cPSD|15962736

###### Hỗ trợ mạnh mẽ và toàn diện chế độ ban đêm
##### II. Ứng dụng iOS


##### II. Ứng dụng web



lOMoAR cPSD|15962736

###### Giao diện đăng nhập


##### Giao diện đầu tiên người dùng nhìn thấy khi truy cập trang web. Bao gồm các tính năng cơ bản như đăng nhập, nhớ mật khẩu, quên mật khẩu.


lOMoAR cPSD|15962736

##### Người dùng có thể chọn quên mật khẩu và làm theo hướng dẫn theo từng bước để đến giao diện đổi mật khẩu. Giao diện dashboard tác. • Thanh điều hướng


lOMoAR cPSD|15962736

##### Thanh điều hướng giúp người dùng thuận tiện trong việc chuyển đổi giao diện để thao tác, Bên cạnh đó còn có thanh sáng giúp người dùng nhận biết mình đang ở giao diện nào.


lOMoAR cPSD|15962736

##### của người dùng hiện tại bao gồm số dư, giao dịch trong tháng hoặc năm. • Quick menu


lOMoAR cPSD|15962736

##### Quick menu Đây là menu giúp người dùng đi thẳng đến giao diện thêm các giao dịch và ngân sách. Giao dịch Giao dịch được chia ra làm 2 phần là thu nhập và chi tiêu( income Quản lý chi tiêu Ở đây người dùng có thể thêm xóa sửa bất cứ giao dịch nào vì đây là giao dịch cá nhân của người dùng. Ngoài ra còn có tính năng import nhanh giao dịch bằng file CSV thích hợp cho việc người


lOMoAR cPSD|15962736

##### dùng chuyển đổi tài khoản nhưng vẫn muốn lưu giữ giao dịch cũ mà không cần thêm lại từng cái. Giao diện quản lý account Người dùng có thể thêm xóa sửa các tài khoản ngân hàng của mình. Giao diện quản lý ngân sách Thêm xóa sửa các ngân sách đặt ra. Giao diện quản lý mục tiêu


lOMoAR cPSD|15962736

##### Thêm xóa sửa các mục tiêu và thêm tiền để đạt được mục tiêu. Giao diện lịch Người dùng có thể xem các giao dịch thu/chi mà mình đã tạo ra theo ngày hoặc tháng năm để dễ kiểm soát chi tiêu. Thống kê và báo cáo Đầu tiên người dùng có thể chọn loại để thống kê và in ra báo cáo bao Thống kê và báo cáo Tùy theo người dùng chọn loại thống kê mà sẽ chuyển hướng tới giao diện tương tự


lOMoAR cPSD|15962736

##### Giao diện thống kê & báo cáo thu nhập Quản lý users (chức năng admin) Khi đăng nhập vào trang web phân quyền admin ở thanh điều hướng sẽ có chức năng quản lý users có thể thêm xóa sửa thông tin Quản lý users


lOMoAR cPSD|15962736

##### Quản lý thể loại Người dùng có thể thêm xóa sửa thể loại.


##### Quản lý settings


##### Quản lý thể loại Quản lý ứng dụng


lOMoAR cPSD|15962736

##### Quản lý cài đặt email SMTP


lOMoAR cPSD|15962736

## Chương 4: REST API
#### I. Overview
###### Đây là tài liệu hướng dẫn sử dụng API của moneypro Link documents: https://bitly.com.vn/ndz4xl.

#### II. Error Codes
###### HTTP status code của API: Mọi request của api đều trả về code 200. Nếu có thất bại thì sẽ phân biệt qua thuộc tính result trong json trả về. Kèm message. Kết quả trả về của api sẽ có dạng chung như sau

{"result": 0,"msg": "Thông báo", "method":"GET", "data": [],.....}
















|Property|Description|Range of Values|Required|
|---|---|---|---|
|result|Kết quả thực thi<br>của request<br>|0-1|có<br>|
|msg|Thông báo<br>người dùng<br>|string|có<br>|
|method|phương thức mà<br>người dùng đã<br>request API<br>|GET|POST|DELETE|<br>PUT|có<br>|
|data|kết quả dang<br>sách kết quả trả<br>về|Array, Object|không, tuỳ vào<br>request|


###### Trong đó result, msg, method sẽ là các thuộc tính luôn xuất hiện trong api, ngoài sẽ có data hoặc các thuộc tính khác tuỳ vào API được request.

#### III. Rate limit
###### Đây chỉ là API để phục vụ học tập, testing, không thương mại hoá. Nên sẽ ko giới hạn số lần request
#### IV. Xác thực

Thêm các tham số bên dưới vào header trong mỗi lần gọi api


lOMoAR cPSD|15962736



|Tên|Ki ऀ u dư뀃u|B￿t<br>buôc|Măc|Mô tả|
|---|---|---|---|---|
|Authorization|string|có||JWT<dấucách><token><br>(xemLogin để xem chi tiết về<br><token>)|

#### V. Document




## 1. Categories
###### Có 2 loại tiền trong ứng dụng là Income và Expense tương ứng là Thu nhập và chi tiêu Đi kèm trong giao dịch sẽ có cách thể loại. Thể loại cũng có 2 loại tương ứng là income - giá trị là 1 và expense - giá trị là 2
#### 1.1. Sửa th ऀ loại
###### Đây là api sửa thông tin thể loại

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|name|string|có||Tên thể loại|
|descriptio<br>n|string|không||Mô tả|
|color|string|có||Màu sắc|



Kết quả trả về: Sửa thể loại



{




["result"][:][ 1][,]

["category"][:][ 55][,]

["msg"][:][ "Catergory has been updated successfully!"][,]


lOMoAR cPSD|15962736


["method"][:][ "PUT"]
}

#### 1.2. Lấy danh sách th ऀ loại income





|Field Type|Requir|ed Default|Descriptio|n order[column] string không id|Col6|
|---|---|---|---|---|---|
|Tên cột cần sắp|xếp ord|er[dir] string|không asc|Hướng cần sắp xếp [tăng/giảm]|Hướng cần sắp xếp [tăng/giảm]|
|start int có 0 Vị|trí bắt đ|ầu length int|có 10 Số l|ượng bản ghi search string không|ượng bản ghi search string không|
|Tìm kiếm [giá t|rị]|||||
|||||||
|Kết quả trả về: Lấ|y danh s|ách thể loại||||
|<br>{<br> "result": 1,<br> "method": "GET",<br> "summary": {<br> "total_count": 5<br> },<br> "data": [<br> {<br> "id": 1,<br> "name": "Panzerkampfwagen",<br> "description": "Phng tin chin đu bc thép"<br>ươ<br>ệ<br>ếấọ<br>,<br> "type": 1,<br> "color": "#000000"<br> },<br> {<br> "id": 2,<br> "name": "Heavy Tank",<br> "description": "Xe tăng hng nng"<br>,<br> "type": 1,<br> "color": "#4C97FF"<br> },<br> {<br> "id": 3,<br> "name": "Self-propelled Anti-tank Gun",<br> "description": "Pháo t hành chng tăng"<br>ố<br>ự<br>,<br> "type": 1,<br> "color": "#000000"<br> },<br> {<br> "id": 23,<br> "name": "tên2",<br> "description": "mô t 2"<br>ả<br>,<br> "type": 1,|<br>{<br> "result": 1,<br> "method": "GET",<br> "summary": {<br> "total_count": 5<br> },<br> "data": [<br> {<br> "id": 1,<br> "name": "Panzerkampfwagen",<br> "description": "Phng tin chin đu bc thép"<br>ươ<br>ệ<br>ếấọ<br>,<br> "type": 1,<br> "color": "#000000"<br> },<br> {<br> "id": 2,<br> "name": "Heavy Tank",<br> "description": "Xe tăng hng nng"<br>,<br> "type": 1,<br> "color": "#4C97FF"<br> },<br> {<br> "id": 3,<br> "name": "Self-propelled Anti-tank Gun",<br> "description": "Pháo t hành chng tăng"<br>ố<br>ự<br>,<br> "type": 1,<br> "color": "#000000"<br> },<br> {<br> "id": 23,<br> "name": "tên2",<br> "description": "mô t 2"<br>ả<br>,<br> "type": 1,|<br>{<br> "result": 1,<br> "method": "GET",<br> "summary": {<br> "total_count": 5<br> },<br> "data": [<br> {<br> "id": 1,<br> "name": "Panzerkampfwagen",<br> "description": "Phng tin chin đu bc thép"<br>ươ<br>ệ<br>ếấọ<br>,<br> "type": 1,<br> "color": "#000000"<br> },<br> {<br> "id": 2,<br> "name": "Heavy Tank",<br> "description": "Xe tăng hng nng"<br>,<br> "type": 1,<br> "color": "#4C97FF"<br> },<br> {<br> "id": 3,<br> "name": "Self-propelled Anti-tank Gun",<br> "description": "Pháo t hành chng tăng"<br>ố<br>ự<br>,<br> "type": 1,<br> "color": "#000000"<br> },<br> {<br> "id": 23,<br> "name": "tên2",<br> "description": "mô t 2"<br>ả<br>,<br> "type": 1,|<br>{<br> "result": 1,<br> "method": "GET",<br> "summary": {<br> "total_count": 5<br> },<br> "data": [<br> {<br> "id": 1,<br> "name": "Panzerkampfwagen",<br> "description": "Phng tin chin đu bc thép"<br>ươ<br>ệ<br>ếấọ<br>,<br> "type": 1,<br> "color": "#000000"<br> },<br> {<br> "id": 2,<br> "name": "Heavy Tank",<br> "description": "Xe tăng hng nng"<br>,<br> "type": 1,<br> "color": "#4C97FF"<br> },<br> {<br> "id": 3,<br> "name": "Self-propelled Anti-tank Gun",<br> "description": "Pháo t hành chng tăng"<br>ố<br>ự<br>,<br> "type": 1,<br> "color": "#000000"<br> },<br> {<br> "id": 23,<br> "name": "tên2",<br> "description": "mô t 2"<br>ả<br>,<br> "type": 1,|<br>{<br> "result": 1,<br> "method": "GET",<br> "summary": {<br> "total_count": 5<br> },<br> "data": [<br> {<br> "id": 1,<br> "name": "Panzerkampfwagen",<br> "description": "Phng tin chin đu bc thép"<br>ươ<br>ệ<br>ếấọ<br>,<br> "type": 1,<br> "color": "#000000"<br> },<br> {<br> "id": 2,<br> "name": "Heavy Tank",<br> "description": "Xe tăng hng nng"<br>,<br> "type": 1,<br> "color": "#4C97FF"<br> },<br> {<br> "id": 3,<br> "name": "Self-propelled Anti-tank Gun",<br> "description": "Pháo t hành chng tăng"<br>ố<br>ự<br>,<br> "type": 1,<br> "color": "#000000"<br> },<br> {<br> "id": 23,<br> "name": "tên2",<br> "description": "mô t 2"<br>ả<br>,<br> "type": 1,|<br>{<br> "result": 1,<br> "method": "GET",<br> "summary": {<br> "total_count": 5<br> },<br> "data": [<br> {<br> "id": 1,<br> "name": "Panzerkampfwagen",<br> "description": "Phng tin chin đu bc thép"<br>ươ<br>ệ<br>ếấọ<br>,<br> "type": 1,<br> "color": "#000000"<br> },<br> {<br> "id": 2,<br> "name": "Heavy Tank",<br> "description": "Xe tăng hng nng"<br>,<br> "type": 1,<br> "color": "#4C97FF"<br> },<br> {<br> "id": 3,<br> "name": "Self-propelled Anti-tank Gun",<br> "description": "Pháo t hành chng tăng"<br>ố<br>ự<br>,<br> "type": 1,<br> "color": "#000000"<br> },<br> {<br> "id": 23,<br> "name": "tên2",<br> "description": "mô t 2"<br>ả<br>,<br> "type": 1,|


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736


["color"][:][ "#123562"]

[},]

[{]

["id"][:][ 34][,]

["name"][:][ "Test icime"][,]

["description"][:][ ""][,]

["type"][:][ 1][,]

["color"][:][ "#FE3A2F"]

[}]

[]]
}

#### 1.3. Thêm mới th ऀ loại

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|name|string|có||Tên thể loại|
|descriptio<br>n|string|không||Mô tả thể loại|
|color|string|không||Màu sắc|



Kết quả trả về: Thêm mới thể loại


{

["result"][:][ 1][,]

["category"][:][ 55][,]

["msg"][:][ "Category added successfully!"][,]

["method"][:][ "POST"]
}

#### 1.4. Xóa th ऀ loại
###### DELETE /api/incomecategories/55


Kết quả trả về: Xóa thể loại


{

["result"][:][ 1][,]

["category"][:][ 55][,]

["msg"][:][ "Category has been deleted successfully"][,]

["method"][:][ "DELETE"]
}


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736

#### 1.5. Lấy thông tin chi tiết một th ऀ loại
###### GET /api/incomecategories/1


Kết quả trả về: Lấy thông tin chi tiết một thể loại

{

["result"][:][ 1][,]

["data"][: {]

["id"][:][ 1][,]

["type"][:][ 1][,]

["name"][:][ "Panzerkampfwagen"][,]

["description"][:][ "Phng tin chin đu bc thép"] ươ ệ ếấọ,

["color"][:][ "#C5FF3F"]

[},]

["method"][:][ "GET"]
}

#### 1.6. Lấy danh sách th ऀ loại expense

|Field Type|Requir|ed Default|Descriptio|n order[column] string không id|Col6|
|---|---|---|---|---|---|
|Tên cột cần sắp|xếp ord|er[dir] string|không asc|Hướng cần sắp xếp [tăng/giảm]|Hướng cần sắp xếp [tăng/giảm]|
|start int có 0 Vị|trí bắt đ|ầu length int|có 10 Số l|ượng bản ghi search string không|ượng bản ghi search string không|
|Tìm kiếm [giá t|rị]|||||
|||||||
|Kết quả trả về: Lấ|y danh s|ách thể loại e|xpense|||
|{<br> "result": 1,<br> "summary": {<br> "total_count": 3<br> },<br> "data": [<br> {<br> "id": 13,<br> "name": "Panzerkampfwagen",<br> "description": "Phng tin chin đu bc thép"<br>ếấọ<br>ươ<br>ệ<br>,<br> "type": 2,<br> "color": "#B92D5C"<br> },<br> {|{<br> "result": 1,<br> "summary": {<br> "total_count": 3<br> },<br> "data": [<br> {<br> "id": 13,<br> "name": "Panzerkampfwagen",<br> "description": "Phng tin chin đu bc thép"<br>ếấọ<br>ươ<br>ệ<br>,<br> "type": 2,<br> "color": "#B92D5C"<br> },<br> {|{<br> "result": 1,<br> "summary": {<br> "total_count": 3<br> },<br> "data": [<br> {<br> "id": 13,<br> "name": "Panzerkampfwagen",<br> "description": "Phng tin chin đu bc thép"<br>ếấọ<br>ươ<br>ệ<br>,<br> "type": 2,<br> "color": "#B92D5C"<br> },<br> {|{<br> "result": 1,<br> "summary": {<br> "total_count": 3<br> },<br> "data": [<br> {<br> "id": 13,<br> "name": "Panzerkampfwagen",<br> "description": "Phng tin chin đu bc thép"<br>ếấọ<br>ươ<br>ệ<br>,<br> "type": 2,<br> "color": "#B92D5C"<br> },<br> {|{<br> "result": 1,<br> "summary": {<br> "total_count": 3<br> },<br> "data": [<br> {<br> "id": 13,<br> "name": "Panzerkampfwagen",<br> "description": "Phng tin chin đu bc thép"<br>ếấọ<br>ươ<br>ệ<br>,<br> "type": 2,<br> "color": "#B92D5C"<br> },<br> {|{<br> "result": 1,<br> "summary": {<br> "total_count": 3<br> },<br> "data": [<br> {<br> "id": 13,<br> "name": "Panzerkampfwagen",<br> "description": "Phng tin chin đu bc thép"<br>ếấọ<br>ươ<br>ệ<br>,<br> "type": 2,<br> "color": "#B92D5C"<br> },<br> {|



Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736


["id"][:][ 19][,]

["name"][:][ "U-boat"][,]

["description"][:][ "A submarine is a ship capable of operation under-water"][,]

["type"][:][ 2][,]

["color"][:][ "#831100"]

[},]

[{]

["id"][:][ 20][,]

["name"][:][ "Tank Destroyer"][,]

["description"][:][ "Pháo chng tăng"] ố,

["type"][:][ 2][,]

["color"][:][ "#6CFF5B"]

[}]

[],]

["method"][:][ "GET"]
}

## 2. Accounts
#### 2.1. Lấy danh sách tài khoản

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|order[column]|string|không|id|Tên cột cần sắp xếp|
|order[dir]|string|không|asc|Hướng cần sắp xếp [tăng/giảm]|
|start|int|có|0|Vị trí bắt đầu|
|length|int|có|10|Số lượng bản ghi|
|search|string|không||Tìm kiếm [giá trị]|



Kết quả trả về: Lấy danh sách tài khoản


[{]

["result"][:][ 1][,]

["method"][:][ "GET"][,]

["summary"][: {]

["total_count"][:][ 6]

[},]

["data"][: []

[{]

["id"][:][ 1][,]

["name"][:][ "BIDV"][,]

["description"][:][ "Tài khon ngân hàng BIDV"] ả,

["balance"][:][ 20000][,]

["accountnumber"][:][ "3123123"]

[},]

[{]

["id"][:][ 4][,]


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736




["name"][:][ "AGRIBANK"][,]

["description"][:][ "Tài khon ngân hàng AGRIBANK"] ả,




["balance"][:][ 145000][,]

["accountnumber"][:][ "68976879"]

[},]

[{]

["id"][:][ 8][,]

["name"][:][ "VCB"][,]

["description"][:][ "Tài khon ngân hàng VCB"] ả,

["balance"][:][ 200000][,]

["accountnumber"][:][ "3123123123"]

[},]

[{]

["id"][:][ 9][,]

["name"][:][ "Vietinbank"][,]

["description"][:][ "12312312123123"][,]

["balance"][:][ 12312321][,]

["accountnumber"][:][ "12312312"]

[},]

[{]

["id"][:][ 14][,]

["name"][:][ "Techcombnk"][,]

["description"][:][ "Tài khon ngân hàng TCB"] ả,

["balance"][:][ 20000][,]

["accountnumber"][:][ "31231231232"]
} [,]

[{]

["id"][:][ 19][,]

["name"][:][ "Sacombank"][,]

["description"][:][ "Tài khon ngân hàng SCB"] ả,




["balance"][:][ 200000][,]

["accountnumber"][:][ "31231"]

[}]

[]]
}


#### 2.2. Sửa tài khoản

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|name|string|có||Tên tài khoản|
|balance|string|có||Số dư|
|description|string|không||Mô tả|
|accountnumbe<br>r|string|có||STK|



Kết quả trả về: Sửa tài khoản



{




["result"][:][ 1][,]



Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736


["account"][:][ 93][,]

["msg"][:][ "Changes saved!"][,]

["method"][:][ "PUT"]
}

#### 2.3. Xóa tài khoản
###### DELETE /api/accounts/95


Kết quả trả về: Xóa tài khoản

{

["result"][:][ 1][,]

["account"][:][ 95][,]

["msg"][:][ "Account and transaction related to this account has been deleted successfully"][,]

["method"][:][ "DELETE"]
}

#### 2.4. Tạo mới tài khoản

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|name|string|có||Tên tài khoản|
|balance|string|có||Số dư|
|description|string|không||Mô tả|
|accountnumbe<br>r|string|có||STK|



Kết quả trả về: Tạo mới tài khoản


{

["result"][:][ 1][,]

["account"][:][ 95][,]

["msg"][:][ "Account added successfully! Please refresh the page."][,]

["method"][:][ "POST"]
}


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736

#### account
###### GET /api/accounts/getaccounttransaction/1


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|order[column]|string|không|id|Tên cột cần sắp xếp|
|order[dir]|string|không|asc|Hướng cần sắp xếp [tăng/giảm]|
|start|int|có|0|Vị trí bắt đầu|
|length|int|có|10|Số lượng bản ghi|
|<br>search|<br>string|<br>không||<br>Tìm kiếm [giá trị]|



Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736

#### 2.6. Lấy thông tin chi tiết một tài khoản
###### GET /api/accounts/1


Kết quả trả về: Lấy thông tin chi tiết một tài khoản


{

["result"][:][ 1][,]

["data"][: {]

["id"][:][ 1][,]

["balance"][:][ "20000.00"][,]

["name"][:][ "BIDV"][,]

["description"][:][ "Tài khon ngân hàng BIDV"] ả,

["accountnumber"][:][ "3123123"][,]

["updated_at"][:][ "2022-04-25 16:19:48"]

[},]

["method"][:][ "GET"]
}

## 3. Goals
#### 3.1. Lấy danh sách mục tiêu

|GET /api/goals|Col2|Col3|Col4|Col5|
|---|---|---|---|---|
|<br>Field Type|Requir|ed Default|Descriptionorder[co|lumn] string không id|
|Tên cột cần sắp|xếp ord|er[dir] string|không asc Hướng cần|sắp xếp|
||||||



Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736



|Col1|Col2|Col3|Col4|[tăng/giảm]|
|---|---|---|---|---|
|start|int|có|0|Vị trí bắt đầu|
|length|int|có|10|Số lượng bản ghi|
|search|string|không||Tìm kiếm [giá trị]|
|status|int|không|1|Lọc theo status|
|dateFrom|date|không|ngày hiện tại<br>(YYYY-mm-dd)|Lọc theo ngày bắt<br>đầu từ|
|dateTo|date|không|ngày hiện tại<br>(YYYY-mm-dd)|Lọc theo ngày kết<br>thúc đến|


Kết quả trả về: Lấy danh sách mục tiêu







{

["method"][:][ "GET"][,]

["summary"][: {]

["total_count"][:][ 2]

[},]

["result"][:][ 1][,]

["currency"][:][ "USD"][,]

["data"][: []

[{]

["id"][:][ 1][,]

["name"][:][ "Mua pháo t hành Jagdpanther E100"] ự,

["balance"][:][ 10000][,]

["amount"][:][ 2000000][,]

["deposit"][:][ 13218][,]

["deadline"][:][ "2022-02-12"][,]

["status"][:][ 1]

[},]

[{]

["id"][:][ 16][,]

["name"][:][ "123122"][,]

["balance"][:][ 12313][,]

["amount"][:][ 1231240][,]

["deposit"][:][ 369][,]

["deadline"][:][ "2022-02-27"][,]

["status"][:][ 1]

[}]

[]]
}

#### 3.2. Sửa mục tiêu


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736

|name|string|có|Col4|Tên mục tiêu|
|---|---|---|---|---|
|balance|string|có||Số dư|
|amount|string|có||Mục tiêu|
|deadlin<br>e|string|không||Thời hạn|



Kết quả trả về: Sửa mục tiêu


{

["result"][:][ 1][,]

["goal"][:][ 61][,]

["msg"][:][ "Goal changed successfully !"][,]

["method"][:][ "PUT"]
}

#### 3.3. Thêm mới mục tiêu

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|name|string|có||Tên mục tiêu|
|balance|string|có||Số dư|
|amount|string|có||Mục tiêu|
|deadlin<br>e|string|không||Thời hạn|



Kết quả trả về: Thêm mới mục tiêu


{

["result"][:][ 1][,]

["goal"][:][ 61][,]

["msg"][:][ "Goals created successfully !"][,]

["method"][:][ "POST"]
}

#### 3.4. Xóa mục tiêu
###### DELETE /api/goals/61


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736



Kết quả trả về: Xóa mục tiêu



{




["result"][:][ 1][,]

["goal"][:][ 61][,]




["msg"][:][ "Goal is deleted successfully !"][,]

["method"][:][ "DELETE"]
}


#### 3.5. Thêm tiền cho mục tiêu

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|deposi<br>t|string|có||Gửi tiền|
|action|string|không||Hành đô<br>ng|



Kết quả trả về: Thêm tiền cho mục tiêu

{

["result"][:][ 1][,]

["goal"][:][ 1][,]

["msg"][:][ "Deposit have been added"][,]

["method"][:][ "POST"]
}

#### 3.6. Lấy thông tin chi tiết một mục tiêu
###### GET /api/goals/1


Kết quả trả về: Lấy thông tin chi tiết một mục tiêu

{

["result"][:][ 1][,]

["data"][: {]

["id"][:][ "1"][,]

["name"][:][ "Mua pháo t hành Jagdpanther E100"] ự,

["balance"][:][ 10000][,]

["amount"][:][ 2000000][,]

["deposit"][:][ 13218][,]

["deadline"][:][ "2022-02-12"]

[},]

["method"][:][ "GET"]
}


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736

## 4. Budgets
#### 4.1. Lấy danh sách ngân sách

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|order[column]|string|không|fromdate|Tên cột cần sắp xếp|
|order[dir]|string|không|asc|Hướng cần sắp xếp<br>tăng/giảm<br>[<br>]|
|start|int|có|0|Vị trí bắt đầu|
|length|int|có|10|Số lượng bản ghi|
|search|string|không||Tìm kiếm [giá trị]|



Kết quả trả về: Lấy danh sách ngân sách



{




["result"][:][ 1][,]

["method"][:][ "GET"][,]

["summary"][: {]

["total_count"][:][ 5]




[},]

["currency"][:][ "USD"][,]

["data"][: []

[{]

["id"][:][ 1][,]

["category"][: {]

["id"][:][ 20][,]

["name"][:][ "Tank Destroyer 22"][,]

["type"][:][ 2][,]

["color"][:][ "#6CFF5B"][,]

["description"][:][ "Pháo chng tăng"] ố




[},]

["user"][: {]

["id"][:][ 1][,]




["fullname"][:][ "Nguyen DangHau"]

[},]

["amount"][:][ 1500000][,]

["fromdate"][:][ "2018-01-01"][,]

["todate"][:][ "2025-01-31"][,]

["description"][:][ "Tit kim mua xe tăng hng nh T-34"] ế ệ ạ ẹ




[},]

[{]

["id"][:][ 4][,]

["category"][: {]



Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736


["amount"][:][ 10000][,]

["fromdate"][:][ "2022-02-01"][,]

["todate"][:][ "2022-02-28"][,]

["description"][:][ ""]

[}]

[]]
}

#### 4.2. Sửa ngân sách

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|amount|string|có||Ngân sách|
|descriptio<br>n|string|có||Mô tả|



Kết quả trả về: Sửa ngân sách


{

["result"][:][ 1][,]

["msg"][:][ "Budgets changed successfully !"][,]

["method"][:][ "PUT"]
}

#### 4.3. Tạo mới ngân sách

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|amount|string|có||Ngân sách|
|description|string|không||Mô tả|
|category_i<br>d|string|có||ID thể loại|
|month|string|không||Thời gian (tháng)|
|year|string|không||Thời gian (năm)|



Kết quả trả về: Tạo mới ngân sách


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736



{




["result"][:][ 1][,]




["budget"][:][ 79][,]

["fromdate"][:][ "2022-05-01"][,]

["todate"][:][ "2022-05-31"][,]

["msg"][:][ "Budgets created successfully !"][,]

["method"][:][ "POST"]
}


#### 4.4. Xóa ngân sách
###### DELETE /api/budgets/79

Kết quả trả về: Xóa ngân sách

{

["result"][:][ 1][,]

["msg"][:][ "Budget is deleted successfully !"][,]

["budget"][:][ 79][,]

["method"][:][ "DELETE"]
}

#### 4.5. Lấy thông tin chi tiết một ngân sách
###### GET /api/budgets/1


Kết quả trả về: Lấy thông tin chi tiết một ngân sách



{




["result"][:][ 1][,]

["budget"][: {]

["id"][:][ 1][,]

["category"][: {]

["id"][:][ 20][,]

["name"][:][ "Tank Destroyer 22"][,]

["type"][:][ 2][,]

["description"][:][ "Pháo chng tăng"] ố,

["color"][:][ "#6CFF5B"]

[},]

["amount"][:][ 1500000][,]




["fromdate"][:][ "2025-01-01"][,]

["todate"][:][ "2025-01-31"][,]

["description"][:][ "Tit kim mua xe tăng hng nh T-34"] ế ệ ạ ẹ



} [,]

["months"][:][ "01"][,]

["years"][:][ "2025"][,]

["method"][:][ "GET"]
}



Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736

#### 4.6. Lấy Tổng tiền transaction theo ngày

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|category_id|string|không|1|Id của thể loại cần lấy thông tin|
|date <br>st|ring khô|ng|2022- L<br>|ấy transaction trong khoảng thời<br>|



Kết quả trả về: Lấy Tổng tiền transaction theo ngày


{

["result"][:][ 1][,]

["totalamount"][:][ 24000][,]

["method"][:][ "GET"]
}


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736

## 5. Transactions

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|category_id|string|có||Thể loại|
|account_id|string|có||Tài khoản|
|name|string|có||Tên giao dịch|
|amount|string|có||Số tiền|
|reference|string|có||Tham chiếu|
|transactiondat<br>e|string|có||Ngày giao dịch|
|type|string|không||Loại|
|description|string|không||Nô<br>i dung|



Kết quả trả về: Sửa giao dịch

{

["result"][:][ 1][,]

["msg"][:][ "Transaction changed successfully !"][,]

["transaction"][:][ 218][,]

["method"][:][ "PUT"]
}


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|category_id|string|có||Thể loại|
|account_id|string|có||Tài khoản|
|name|string|có||Tên giao dịch|
|amount|string|có||Số tiền|
|reference|string|có||Tham chiếu|
|transactiondat<br>e|string|có||Ngày giao dịch|
|type|string|không||Loại|
|description|string|không||Nô<br>i dung|



Kết quả trả về: Tạo mới giao dịch


{

["result"][:][ 1][,]

["msg"][:][ "Transaction created successfully !"][,]

["transaction"][:][ 218][,]

["method"][:][ "POST"]
}

###### DELETE /api/transactions/218


Kết quả trả về: Xóa giao dịch


["msg"][:][ "Transaction deleted successfully !"][,]

["transaction"][:][ 218][,]

["method"][:][ "DELETE"]
}



{




["result"][:][ 1][,]



Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736

#### 5.4. Thống kê tổng tiền tính theo ngày/tuần/tháng/năm của

###### GET /api/transactions/income/gettotal


Kết quả trả về: Thống kê tổng tiền tính theo ngày/tuần/tháng/năm của giao dịch thu
nhập

{

["result"][:][ 1][,]

["data"][: {]

["totalbalance"][:][ 21157369.76][,]

["month"][:][ 21133369.76][,]

["week"][:][ 6464640][,]

["day"][:][ 0][,]

["year"][:][ 21157369.76]

[},]

["method"][:][ "GET"]
}

#### 5.5. Thống kê tổng tiền tính theo ngày/tuần/tháng/năm của

###### GET /api/transactions/expense/gettotal


Kết quả trả về: Thống kê tổng tiền tính theo ngày/tuần/tháng/năm của giao dịch chi
tiêu



{




["result"][:][ 1][,]

["data"][: {]

["totalbalance"][:][ 25718420][,]

["month"][:][ 3420][,]




["week"][:][ 0][,]

["day"][:][ 0][,]

["year"][:][ 25718420]

[},]

["method"][:][ "GET"]
}




|Field Type|Requir|ed Default|Descriptio|n order[column] string không id|Col6|
|---|---|---|---|---|---|
|Tên cột cần sắp|xếp ord|er[dir] strin|g không as|c Hướng cần sắp xếp [tăng/giảm]|c Hướng cần sắp xếp [tăng/giảm]|
|||||||
|||||||
|||||||
|Downloaded by||||H?u Mai Th?<br>|H?u Mai Th?<br>|


lOMoAR cPSD|15962736

###### start int có 0 Vị trí bắt đầu length int có 10 Số lượng bản ghi search string không Tìm kiếm [giá trị]













Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736


"name": "Type 71",
"reference": "Japan",
"transactiondate": "2022-02-14",
"id": 39,
"type": 1,
"account": {
"id": 4,
"name": "AGRIBANK",
"balance": 145000,
"accountnumber": "68976879",
"description": "Tài kho n ngân hàng AGRIBANK"ả
},
"category": {
"id": 1,
"name": "Panzerkampfwagen",
"type": 1,
"color": "#",
"description": "Ph ng ti n chi n đ u b c thép"ươ ệ
ế ấ ọ
},
"user": {
"id": 1,
"fullname": "Nguyen DangHau"
}
},
{
"amount": 200000,
"description": "Bán pháo ch ng tăng SU-100 giá 2.000.00 b c"ố
ạ,
"name": "SU-100",
"reference": "Union of Soviet Socialist Republics",
"transactiondate": "2022-02-08",
"id": 40,
"type": 1,
"account": {
"id": 4,
"name": "AGRIBANK",
"balance": 145000,
"accountnumber": "68976879",
"description": "Tài kho n ngân hàng AGRIBANK"ả
},
"category": {
"id": 3,
"name": "Self-propelled Anti-tank Gun",
"type": 1,
"color": "#",
"description": "Pháo t hành ch ng tăng"ự ố
},
"user": {
"id": 1,
"fullname": "Nguyen DangHau"
}
},
{
"amount": 147000,
"description": "asdfasdf",
"name": "Sturmtiger",
"reference": "Dell",
"transactiondate": "2018-01-01",
"id": 46,


lOMoAR cPSD|15962736


"type": 1,
"account": {
"id": 4,
"name": "AGRIBANK",
"balance": 145000,
"accountnumber": "68976879",
"description": "Tài kho n ngân hàng AGRIBANK"ả
},
"category": {
"id": 3,
"name": "Self-propelled Anti-tank Gun",
"type": 1,
"color": "#",
"description": "Pháo t hành ch ng tăng"ự ố
},
"user": {
"id": 1,
"fullname": "Nguyen DangHau"
}
},
{
"amount": 14000,
"description": "France medium tank",
"name": "AMX CDC Liberty",
"reference": "France",
"transactiondate": "2022-02-15",
"id": 47,
"type": 1,
"account": {
"id": 1,
"name": "BIDV",
"balance": 20000,
"accountnumber": "3123123",
"description": "Tài kho n ngân hàng BIDV"ả
},
"category": {
"id": 1,
"name": "Panzerkampfwagen",
"type": 1,
"color": "#",
"description": "Ph ng ti n chi n đ u b c thép"ươ ệ
ế ấ ọ
},
"user": {
"id": 1,
"fullname": "Nguyen DangHau"
}
},
{
"amount": 15000,
"description": "hello world",
"name": "James Bond",
"reference": "Germany",
"transactiondate": "2022-02-18",
"id": 50,
"type": 1,
"account": {
"id": 1,
"name": "BIDV",
"balance": 20000,


lOMoAR cPSD|15962736


"accountnumber": "3123123",
"description": "Tài kho n ngân hàng BIDV"ả
},
"category": {
"id": 1,
"name": "Panzerkampfwagen",
"type": 1,
"color": "#",
"description": "Ph ng ti n chi n đ u b c thép"ươ ệ
ế ấ ọ
},
"user": {
"id": 1,
"fullname": "Nguyen DangHau"
}
},
{
"amount": 10000,
"description": "Xe tăng h ng trung Italy Progetto 65"ạ,
"name": "Xe tăng Progetto 65",
"reference": "Italy",
"transactiondate": "2022-02-23",
"id": 52,
"type": 1,
"account": {
"id": 1,
"name": "BIDV",
"balance": 20000,
"accountnumber": "3123123",
"description": "Tài kho n ngân hàng BIDV"ả
},
"category": {
"id": 1,
"name": "Panzerkampfwagen",
"type": 1,
"color": "#",
"description": "Ph ng ti n chi n đ u b c thép"ươ ệ
ế ấ ọ
},
"user": {
"id": 1,
"fullname": "Nguyen DangHau"
}
},
{
"amount": 15000,
"description": "Xe tăng h ng n ng Ba Lan"ạặ,
"name": "60TP Lewandokies",
"reference": "Poland",
"transactiondate": "2022-02-23",
"id": 53,
"type": 1,
"account": {
"id": 4,
"name": "AGRIBANK",
"balance": 145000,
"accountnumber": "68976879",
"description": "Tài kho n ngân hàng AGRIBANK"ả
},
"category": {


lOMoAR cPSD|15962736


"id": 19,
"name": "Heavy Tank 22",
"type": 2,
"color": "#",
"description": "Xe tăng h ng n ng"ạ ặ
},
"user": {
"id": 1,
"fullname": "Nguyen DangHau"
}
},
{
"amount": 1400000,
"description": "Bán xe tăng h ng năng VK 90.01 giá 1.400.000 b c"ạ

ạ,
"name": "VK 90.01",
"reference": "Germany",
"transactiondate": "2022-05-12",


lOMoAR cPSD|15962736

## 6. Users
#### 6.1. Lấy danh sách người dùng
###### GET /api/users


lOMoAR cPSD|15962736

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|order[column]|string|không|id|Tên cột cần sắp xếp|
|order[dir]|string|không|asc|Hướng cần sắp xếp [tăng/giảm]|
|start|int|có|0|Vị trí bắt đầu|
|length|int|có|10|Số lượng bản ghi|
|search|string|không||Tìm kiếm [giá trị]|



Kết quả trả về: Lấy danh sách người dùng


lOMoAR cPSD|15962736


lOMoAR cPSD|15962736




["account_type"][:][ "member"][,]

["firstname"][:][ "Hau"][,]

["lastname"][:][ "Dang Hau"][,]

["is_active"][:][ true][,]

["date"][:][ "2022-03-26 17:10:03"]

[},]

[{]

["id"][:][ 68][,]

["email"][:][ "email@gmail.com"][,]

["account_type"][:][ "member"][,]

["firstname"][:][ "Khang"][,]

["lastname"][:][ "Nguyen"][,]

["is_active"][:][ true][,]

["date"][:][ "2022-03-30 11:31:50"]

[},]

[{]

["id"][:][ 69][,]

["email"][:][ "dinhkhang151@gmail.com"][,]

["account_type"][:][ "member"][,]

["firstname"][:][ "Khang"][,]

["lastname"][:][ "Nguyen"][,]

["is_active"][:][ true][,]

["date"][:][ "2022-04-05 23:53:37"]

[}]

[]]
}


#### 6.2. Sửa người dùng

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|firstname|string|có||Tên|
|lastname|string|không||Họ|
|account_type|string|có||Loại tài khoản|
|is_active|string|có||Kích hoạt|


#### 6.3. Thêm mới người dùng


|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|firstname|string|có||Tên|
|lastname|string|không||Họ|
|account_type|string|có||Loại tài khoản|
|is_active|string|có||Kích hoạt|


lOMoAR cPSD|15962736

#### 6.4. Xóa người dùng
###### DELETE /api/users/37

#### 6.5. Lấy thông tin chi tiết một người dùng
###### GET /api/users/1


Kết quả trả về: Lấy thông tin chi tiết một người dùng




[{]

["result"][:][ 1][,]

["data"][: {]

["id"][:][ 1][,]

["account_type"][:][ "admin"][,]

["email"][:][ "00xshen00@gmail.com"][,]

["firstname"][:][ "Nguyen Dang"][,]




["lastname"][:][ "Hau"][,]

["is_active"][:][ true][,]




["date"][:][ "2022-01-13 04:16:59"]

[},]

["method"][:][ "GET"]
}


## 7. Reports
#### 7.1. Income/Expense Monthly Report


|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|order[column]|string|không|id|Tên cột cần sắp xếp|
|order[dir]|string|không|asc|Hướng cần sắp xếp [tăng/giảm]|
|start|int|có|0|Vị trí bắt đầu|
|length|int|có|10|Số lượng bản ghi|
|search|string|không||Tìm kiếm [giá trị]|
|type|int|không|1|Loại tiền 1 - income, 2 -<br>expense|


lOMoAR cPSD|15962736

#### 7.2. Lấy số dư của account theo ngày/tuần/tháng/năm

|Field|Type Re|quired Defa|ult Descri|ption date string có|
|---|---|---|---|---|
|month|Loại th|ời gian cần n|hóm||



Kết quả trả về: Lấy số dư của account theo ngày/tuần/tháng/năm

{

["result"][:][ 1][,]

["week"][:][ 6464640][,]

["method"][:][ "GET"]
}


Kết quả trả về: Account Transaction Reports


{
"result": 1,


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736


["recordsFiltered"][:][ 0][,]

["recordsTotal"][:][ 0][,]

["data"][: [],]

["method"][:][ "GET"]
}


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736















Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736

## 8. Auth
#### 8.1. Đăng nhập

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|usernam<br>e|string|có||Email đăng nhập|
|password|string|có||Mật khẩu|



Kết quả trả về: Đăng nhập



{
"result": 1,
"msg": "Your account has been logged in successfully",
"accessToken":



"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X3R5cGUiOiJhZG1pbiIsImVtYWlsIjoiMDB4c2hlbjAwQGdtY

W
lsLmNvbSIsImZpcnN0bmFtZSI6Ik5ndXllbiBEYW5nIiwibGFzdG5hbWUiOiJIYXUiLCJpZCI6MSwiaXNfYWN0aXZlIjp0cnVlL



C
JoYXNoUGFzcyI6IjZjZTY1NzAzYTA4ZmI2YjVhZGVkMjcxOWZkMTE1ZmIxIiwiaWF0IjoxNjQ5MTc3NjAwfQ.Ei4Ki16edXddNTBu5408YbwLq4Y8Vs7WHj057OYAzQ",
"data": {
"account_type": "admin",
"email": "email@gmail.com",
"firstname": "Nguyen Dang",
"lastname": "Hau",
"id": 1,
"is_active": true
}
}


#### 8.2. Thay đổi mật khẩu

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|password|string|có||Mật khẩu mới|
|password-<br>confirm|string|có||Nhập lại mật khẩu mới|
|current-password|string|có||Nhập mật khẩu hiện tại|



Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736

#### 8.3. Đăng ký tài khoản mới








|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|firstname|string|có||Tên|
|lastname|string|có||Họ|
|email|string|có||Địa chỉ email|
|password|string|có||Mật khẩu|
|password-<br>confirm|string|có||Mật khẩu xác nhận, phải giống<br>với mật khẩu|



Kết quả trả về: Đăng ký tài khoản mới

{


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736


"result": 1,
"accessToken":
"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X3R5cGUiOiJtZW1iZXIiLCJlbWFpbCI6ImRpbmhraGFuZzE1M
U
BnbWFpbC5jb20iLCJmaXJzdG5hbWUiOiJLaGFuZyIsImxhc3RuYW1lIjoiTmd1eWVuIiwiaWQiOjY5LCJpc19hY3RpdmUiOnRyd
W
UsImhhc2hQYXNzIjoiZmVjMmQ0MGI2MDcwYjE5OWU2MjJlMTI4ZDMyM2NjYjYiLCJpYXQiOjE2NDkxNzc2MTd9.TolHR35JgkUR
5VnxC3T-vqA6EmifE_9GhH9WK-CAcE",
"data": {
"account_type": "member",
"email": "dinhkhang151@gmail.com",
"firstname": "Khang",
"lastname": "Nguyen",
"id": 69,
"is_active": true
},
"msg": "Your account has been created successfully!"
}

#### 8.4. Check OTP

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|email|string|không|||
|code|int|không|||
|actio<br>n|string|không|||


#### 8.5. Quên mật khẩu

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|emai<br>l|string|không||Địa chỉ email cần khôi phục|



Kết quả trả về: Quên mật khẩu

{

["result"][:][ 1][,]

["email"][:][ "email@gmail.com"][,]

["msg"][:][ "Password reset instruction sent to your email address."][,]

["method"][:][ "POST"]
}


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736

#### 8.6. Login Google

|Field Ty|pe Req|uired Defaul|t Descript|ion id_token string có|
|---|---|---|---|---|
|Token id t|rả về từ|app|||


#### 8.7. Login Facebook
###### POST /api/login/facebook

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|access_toke<br>n|string|có||Access Token trả về từ app|



Kết quả trả về: Login Facebook



{




["result"][:][ 1][,]

["accessToken"][:]
"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X3R5cGUiOiJtZW1iZXIiLCJlbWFpbCI6InFlc3hyaHV4aW92QG
hvdG1haWwuY29tIiwiZmlyc3RuYW1lIjoiTmdcdTFlY2RjIiwibGFzdG5hbWUiOiJUaGFuaCIsImF2b-yQhxXo2r_KYKYA",




["data"][: {]

["account_type"][:][ "member"][,]

["email"][:][ "email@hotmail.com"][,]

["firstname"][:][ "Ngc"] ọ,

["lastname"][:][ "Thanh"][,]

["avatar"][:][ "627f2c97caf34.jpeg"][,]

["id"][:][ 86][,]

["is_active"][:][ true][,]

["date"][:][ "2022-05-14 11:14:16"]

[},]

["msg"][:][ "Login is success!"][,]

["method"][:][ "POST"]
}


## 9. Profile
#### 9.1. Lấy thông tin cá nhân
###### GET /api/profile

Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736


Kết quả trả về: Lấy thông tin cá nhân

{

["result"][:][ 1][,]

["data"][: {]

["id"][:][ 1][,]

["account_type"][:][ "admin"][,]

["email"][:][ "00xshen00@gmail.com"][,]

["firstname"][:][ "Nguyen Dang"][,]

["lastname"][:][ "Hau"][,]

["is_active"][:][ true]

[}]
}

#### 9.2. Cập nhật thông tin cá nhân

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|firstnam<br>e|string|có||Tên|
|lastname|string|không||Họ|
|action|string|không||Hành đông|



Kết quả trả về: Cập nhật thông tin cá nhân


[{]

["result"][:][ 1][,]

["msg"][:][ "Changes saved!"][,]

["data"][: {]

["id"][:][ 1][,]

["account_type"][:][ "admin"][,]

["email"][:][ "00xshen00@gmail.com"][,]

["firstname"][:][ "Nguyen Dang"][,]

["lastname"][:][ "Hau"][,]

["is_active"][:][ true]

[}]
}

#### 9.3. Cập nhật avatar
###### POST /api/profile


Kết quả trả về: Cập nhật avatar


{


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736


["result"][:][ 1][,]

["msg"][:][ "Upload successful"][,]

["image"][:][ "https://timeswriter.xyz/api/assets/uploads/62720d5496daf.png"][,]

["method"][:][ "POST"]
}

#### 9.4. Cập nhật ngôn ngư뀃 cho từng user

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|langcod<br>e|string|không||Language code|
|action|string|không||Hành đô<br>ng|



Kết quả trả về: Cập nhật ngôn ngữ cho từng user


{ "result": 1,

["msg"][:][ "Save Changes!"][,]

["method"][:][ "POST"]
}

## 10. Dashboard
#### 10.1. Lấy số dư của Tài khoản đã được tính toán từ các giao

###### GET /api/home/accountbalance


Kết quả trả về: Lấy số dư của Tài khoản đã được tính toán từ các giao dịch



{




["result"][:][ 1][,]

["data"][: []

[{]

["name"][:][ "BIDV"][,]

["income"][:][ "25715000.00"][,]

["expense"][:][ "6124000.00"][,]

["balance"][:][ "19611000.00"]
} [,]

[{]

["name"][:][ "VCB"][,]

["income"][:][ "0.00"][,]

["expense"][:][ "0.00"][,]


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736




["balance"][:][ "200000.00"]
} [,]




[{]

["name"][:][ "Vietinbank"][,]

["income"][:][ "25715000.00"][,]

["expense"][:][ "2631230.00"][,]

["balance"][:][ "35396091.00"]

[},]

[{]

["name"][:][ "Techcombank"][,]

["income"][:][ "25715000.00"][,]

["expense"][:][ "7994131.76"][,]

["balance"][:][ "17740868.24"]

[},]

[{]

["name"][:][ "Sacombank"][,]

["income"][:][ "25715000.00"][,]

["expense"][:][ "4408008.00"][,]

["balance"][:][ "21506992.00"]

[},]

[{]

["name"][:][ "PhongGroup"][,]

["income"][:][ "0.00"][,]

["expense"][:][ "0.00"][,]

["balance"][:][ "200000.00"]

[},]

[{]

["name"][:][ "PhongGroup"][,]




["income"][:][ "0.00"][,]

["expense"][:][ "0.00"][,]




["balance"][:][ "200000.00"]

[},]

[{]

["name"][:][ "NGUYEN THANH PHONG - Phong kaster"][,]

["income"][:][ "0.00"][,]

["expense"][:][ "0.00"][,]

["balance"][:][ "25000.00"]

[}]




[],]

["method"][:][ "GET"]
}


#### tháng| năm






|Field|Type|Required|Defaul<br>t|Description|
|---|---|---|---|---|
|date|string|không|month|Khoảng thời gian đã thêm [ week|month|<br>year ]|



Kết quả trả về: month


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736



{




["result"][:][ 1][,]




["currency"][:][ "$"][,]

["data"][: []

[{]

["id"][:][ 3][,]

["name"][:][ "Self-propelled Anti-tank Gun"][,]

["color"][:][ "#000000"][,]

["amount"][:][ 8400000][,]

["total"][:][ 6]

[}]

[],]

["date"][: {]

["from"][:][ "2022-04-01"][,]

["to"][:][ "2022-04-30"]

[},]

["method"][:][ "GET"]
}



Kết quả trả về: week



{




["result"][:][ 1][,]




["currency"][:][ "$"][,]

["data"][: []

[{]

["id"][:][ 3][,]

["name"][:][ "Self-propelled Anti-tank Gun"][,]

["color"][:][ "#AE44FF"][,]

["amount"][:][ 8400000][,]

["total"][:][ 6]

[},]

[{]




["id"][:][ 19][,]

["name"][:][ "Heavy Tank 22"][,]

["color"][:][ "#831100"][,]

["amount"][:][ 1200][,]

["total"][:][ 1]

[},]

[{]

["id"][:][ 20][,]

["name"][:][ "Tank Destroyer 22"][,]

["color"][:][ "#6CFF5B"][,]

["amount"][:][ 1200][,]

["total"][:][ 1]

[}]

[],]

["date"][: {]

["from"][:][ "2022-04-10"][,]

["to"][:][ "2022-04-16"]
} [,]

["method"][:][ "GET"]
}



Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736



Kết quả trả về: year



{




["result"][:][ 1][,]

["currency"][:][ "$"][,]

["data"][: []

[{]

["id"][:][ 3][,]

["name"][:][ "Self-propelled Anti-tank Gun"][,]

["color"][:][ "#AE44FF"][,]

["amount"][:][ 8400000][,]

["total"][:][ 6]

[},]

[{]

["id"][:][ 13][,]

["name"][:][ "Panzerkampfwagen"][,]

["color"][:][ "#B92D5C"][,]

["amount"][:][ 15000][,]

["total"][:][ 1]

[},]

[{]

["id"][:][ 19][,]

["name"][:][ "Heavy Tank 22"][,]

["color"][:][ "#831100"][,]

["amount"][:][ 2701200][,]

["total"][:][ 2]

[},]

[{]

["id"][:][ 20][,]

["name"][:][ "Tank Destroyer 22"][,]

["color"][:][ "#6CFF5B"][,]

["amount"][:][ 25701200][,]

["total"][:][ 2]

[}]

[],]

["date"][: {]




["from"][:][ "2022-01-01"][,]

["to"][:][ "2022-12-31"]

[},]

["method"][:][ "GET"]
}


#### tuần| tháng|năm






|Field|Type|Required|Defaul<br>t|Description|
|---|---|---|---|---|
|date|string|không|month|Khoảng thời gian đã thêm [ week|month|<br>year ]|



Kết quả trả về: month


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


{



lOMoAR cPSD|15962736


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736




["result"][:][ 1][,]

["currency"][:][ "USD"][,]




["data"][: []

[{]

["id"][:][ 1][,]

["name"][:][ "Panzerkampfwagen"][,]

["color"][:][ "#000000"][,]

["amount"][:][ 70408][,]

["total"][:][ 4]

[},]

[{]

["id"][:][ 2][,]

["name"][:][ "Heavy Tank"][,]

["color"][:][ "#4C97FF"][,]

["amount"][:][ 7280020][,]

["total"][:][ 10]

[},]

[{]

["id"][:][ 3][,]

["name"][:][ "Self-propelled Anti-tank Gun"][,]

["color"][:][ "#000000"][,]

["amount"][:][ 6866304][,]

["total"][:][ 20]

[},]

[{]

["id"][:][ 23][,]

["name"][:][ "tên2"][,]

["color"][:][ "#123562"][,]




["amount"][:][ 5600000][,]

["total"][:][ 4]




[}]

[],]

["method"][:][ "GET"]
}



Kết quả trả về: week



{




["result"][:][ 1][,]

["currency"][:][ "$"][,]

["data"][: []

[{]

["id"][:][ 1][,]

["name"][:][ "Panzerkampfwagen"][,]

["color"][:][ "#C5FF3F"][,]

["amount"][:][ 68008][,]

["total"][:][ 2]

[},]

[{]

["id"][:][ 2][,]

["name"][:][ "Heavy Tank"][,]

["color"][:][ "#4C97FF"][,]

["amount"][:][ 7280020][,]

["total"][:][ 10]

[},]

[{]


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736


"id": 3,
"name": "Self-propelled Anti-tank Gun",

["color"][:][ "#AE44FF"][,]

["amount"][:][ 6090280.55][,]

["total"][:][ 14]

[},]

[{]

["id"][:][ 23][,]

["name"][:][ "tên2"][,]

["color"][:][ "#123562"][,]

["amount"][:][ 5600000][,]

["total"][:][ 4]

[}]

[],]

["date"][: {]

["from"][:][ "2022-04-10"][,]

["to"][:][ "2022-04-16"]

[},]

["method"][:][ "GET"]
}


Kết quả trả về: year


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


{



lOMoAR cPSD|15962736


["result"][:][ 1][,]

["currency"][:][ "$"][,]

["data"][: []

[{]

["id"][:][ 1][,]

["name"][:][ "Panzerkampfwagen"][,]

["color"][:][ "#C5FF3F"][,]

["amount"][:][ 16107008][,]

["total"][:][ 6]

[},]

[{]

["id"][:][ 2][,]

["name"][:][ "Heavy Tank"][,]

["color"][:][ "#4C97FF"][,]

["amount"][:][ 11480020][,]

["total"][:][ 13]

[},]

[{]

["id"][:][ 3][,]

["name"][:][ "Self-propelled Anti-tank Gun"][,]

["color"][:][ "#AE44FF"][,]

["amount"][:][ 6290280.55][,]

["total"][:][ 15]

[},]

[{]

["id"][:][ 19][,]

["name"][:][ "Heavy Tank 22"][,]

["color"][:][ "#831100"][,]

["amount"][:][ 15000][,]

["total"][:][ 1]

[},]

[{]

["id"][:][ 23][,]

["name"][:][ "tên2"][,]

["color"][:][ "#123562"][,]


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736


"amount": 5600000,
"total": 4

[}]

[],]

["date"][: {]

["from"][:][ "2022-01-01"][,]

["to"][:][ "2022-12-31"]

[},]

["method"][:][ "GET"]
}

#### gian tuần/tháng/năm

|Field|Type|Required|Defaul<br>t|Description|
|---|---|---|---|---|
|type|string|không|income|Loại transaction cần tính [ income|<br>expense|all ]|
|date|string|không|month|Loại cần lấy thống kê [ week|month|year<br>]|



Kết quả trả về: Thống kê tổng tiền của giao dịch trong khoảng thời gian
tuần/tháng/năm



{




["result"][:][ 1][,]

["currency"][:][ "$"][,]

["income"][: []

[{]

["id"][:][ 1][,]

["date"][:][ "2022-04-10"][,]

["name"][:][ "Sun"][,]

["value"][:][ 142400]

[},]

[{]

["id"][:][ 2][,]

["date"][:][ "2022-04-11"][,]

["name"][:][ "Mon"][,]

["value"][:][ 7000000]

[},]

[{]

["id"][:][ 3][,]

["date"][:][ "2022-04-12"][,]

["name"][:][ "Tue"][,]

["value"][:][ 678216]
} [,]

[{]

["id"][:][ 4][,]

["date"][:][ "2022-04-13"][,]


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736


"name": "Wed",
"value": 4480020

[},]

[{]

["id"][:][ 5][,]

["date"][:][ "2022-04-14"][,]

["name"][:][ "Thu"][,]

["value"][:][ 1524068]

} [,]

[{]

["id"][:][ 6][,]

["date"][:][ "2022-04-15"][,]

["name"][:][ "Fri"][,]

["value"][:][ 1736024]

[},]

[{]

["id"][:][ 7][,]

["date"][:][ "2022-04-16"][,]

["name"][:][ "Sat"][,]

["value"][:][ 4256004]

[}]
] [,]

["date"][: {]

["from"][:][ "2022-04-10"][,]

["to"][:][ "2022-04-16"]

[},]

["method"][:][ "GET"]
}

#### tại
###### GET /api/home/latest/income


Kết quả trả về: Lấy danh sách giao dịch thu nhập trong tuần hiện tại


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736
















#### tại
###### GET /api/home/latest/expense

Kết quả trả về: Lấy danh sách giao dịch chi tiêu trong tuần hiện tại



{




["result"][:][ 1][,]

["summary"][: {]




["total_count"][:][ 0]
} [,]




["data"][: [],]

["method"][:][ "GET"]
}



Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736


|Field Type|Requir|ed Default|Descriptio|n order[column] string không id|
|---|---|---|---|---|
|Tên cột cần sắp|xếp ord|er[dir] string|không asc|Hướng cần sắp xếp [tăng/giảm]|
|start int có 0 Vị|trí bắt đ|ầu length int|có 10 Số l|ượng bản ghi search string không|
|Tìm kiếm [giá t|rị]||||
||||||
|Kết quả trả về: Lấ|y toàn b|ộ giao dịch m|ới nhất tro|ng 7 ngày qua|



{




["result"][:][ 1][,]

["summary"][: {]

["total_count"][:][ 0]

[},]


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736




["data"][: [],]

["fromdate"][: {]

["date"][:][ "2022-05-16 00:00:00.000000"][,]

["timezone_type"][:][ 1][,]

["timezone"][:][ "+07:00"]

[},]

["todate"][: {]

["date"][:][ "2022-05-28 23:59:59.000000"][,]

["timezone_type"][:][ 1][,]

["timezone"][:][ "+07:00"]

[},]

["method"][:][ "GET"]
}

## 11. Calendar
#### 11.1. Calendar Income


















|Fiel<br>d|Type|Require<br>d|Default|Descriptio<br>n|
|---|---|---|---|---|
|start|strin<br>g|có|2022-01-<br>30T00%3A00%3A00%2B07%3A0<br>0|Thời gian<br>bắt đầu|
|end|strin<br>g|không|2022-03-<br>13T00%3A00%3A00%2B07%3A0<br>0|Thời gian<br>kết thúc|



Kết quả trả về: Calendar Income


[

[{]

["title"][:][ "Bán Air Blade"][,]

["start"][:][ "2022-05-16"][,]

["amount"][:][ "2500.00"]
} [,]

[{]

["title"][:][ "Lng tháng"] ươ,

["start"][:][ "2022-05-18"][,]

["amount"][:][ "200000.00"]

[}]
]


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736


#### 11.2. Calendar Expense











|Fiel<br>d|Type|Require<br>d|Default|Descriptio<br>n|
|---|---|---|---|---|
|start|strin<br>g|có|2022-01-<br>30<br>0<br>T00%3A00%3A00%2B07%3A<br>0|Thời gian<br>bắt đầu|
|end|strin<br>g|không|2022-03-<br>0<br>13T00%3A00%3A00%2B07%3A<br>0|Thời gian<br>kết thúc|



[},]

[{]

["title"][:][ "Đ xăng"] ổ,

["start"][:][ "2022-05-18"][,]

["amount"][:][ "30000.00"]

[}]
]








#### 11.3. Calendar Filter Date

|Field|Type Re|quired Defa|ult Descrip|tion date|
|---|---|---|---|---|
|string|không T|hời gian|||



Kết quả trả về: Calendar Filter Date


{

["monthname"][:][ "February"][,]

["monthincome"][:][ "0.00"][,]

["monthexpense"][:][ "0.00"][,]

["monthbalance"][:][ "0.00"][,]

["result"][:][ 1]
}


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736

## 12. Settings
#### 12.1. Cập nhật thông tin trang web
###### Lưu ý: đây là tính năng chỉ hoạt động cho **User có quyền Admin**


Kết quả trả về: Cập nhật thông tin trang web


{
"result": 1,
"msg": "Changes saved!",
"data": {
"site_name": "Money Pro",
"site_description": "Access to track daily expenses and manage your budgets from PC’s
browsers. It’s super fast and convenient, no installation required. Seamless experience across
devices, from mobile app to computer.",
"site_keywords": "money lover, money manager, budgeting app, personal finance management,
expense tracker, money management web, budgeting web app",
"currency": "USD",
"logomark": "",
"logotype": "",
"site_slogan": "Your personal finance manager on browser",
"language": "en-US"
}
}


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736

#### 12.2. Lấy thông tin cơ bản của website
###### GET /api/settings/site


Kết quả trả về: Lấy thông tin cơ bản của website


{
"data": {
"site_name": "Money Pro",
"site_description": "Access to track daily expenses and manage your budgets from PC’s
browsers. It’s super fast and convenient, no installation required. Seamless experience across
devices, from mobile app to computer.",
"site_keywords": "money lover, money manager, budgeting app, personal finance management,
expense tracker, money management web, budgeting web app",
"currency": "USD",
"logomark": "",
"logotype": "",
"site_slogan": "Your personal finance manager on browser",
"language": "en-US"
},
"method": 1,
"result": 1
}

#### 12.3. Lấy thông tin cài đặt SMTP
###### GET /api/settings/smtp


Kết quả trả về: Lấy thông tin cài đặt SMTP

{

["data"][: {]

["host"][:][ "smtp.gmail.com"][,]

["port"][:][ "587"][,]

["encryption"][:][ "tls"][,]

["auth"][:][ true][,]

["username"][:][ "email@gmail.com"][,]

["password"][:][ "password"][,]

["from"][:][ "email@gmail.com"]

[},]

["result"][:][ 1][,]

["method"][:][ "GET"]
}


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736

#### 12.4. Lưu thông tin cài đặt SMTP

|Field|Type|Required|Default|Description|
|---|---|---|---|---|
|host|string|có||Địa chỉ host|
|port|string|có||Cổng kết nối|
|encryptio<br>n|string|có||Loại mã hoá kết nối|
|auth|boolean|không||Có xác thực hay không|
|username st|ring không|Địa chỉ ema|il cần xác|thực password string không|
|Mật khẩu cầ|n xác thực|from string|không Địa|chỉ đến action string có Tag|
|hành động g|án cho api||||
||||||


#### 13.1. Lấy danh sách thông báo mới nhất

|Field|Type Re|quired Defa|ult Descrip|tion id string|
|---|---|---|---|---|
|khôn|g 1||||



Kết quả trả về: Lấy danh sách thông báo mới nhất


Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736








#### 13.2. Đọc hết thông báo
###### POST /api/notifications

Kết quả trả về: Đọc hết thông báo

{

["result"][:][ 1][,]

["msg"][:][ "Notifications is marked as read."][,]

["method"][:][ "POST"]
}

#### 13.3. Đọc 1 thông báo
###### GET /api/notifications/1


Kết quả trả về: Đọc 1 thông báo


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


lOMoAR cPSD|15962736


{

["result"][:][ 1][,]

["data"][: {]

["id"][:][ "1"][,]

["title"][:][ "Mc tiêu ht hn"] ụ ếạ,

["content"][:][ "Mc tiêu đã ht hn"] ụ ếạ,

["is_read"][:][ true][,]

["created_at"][:][ "2022-05-15 00:00:00"][,]

["updated_at"][:][ "2022-05-15 00:00:00"]

[},]

["method"][:][ "GET"]
}

#### KẾT
###### Bài báo cáo được viết và trình bày bởi nhóm em, với tinh thần nghiêm túc học hỏi và nghiên cứu nhóm em đã hoàn thành với mức độ hoàn thiện. Dù vậy, cũng không tránh khỏi sai sót, nhóm em mong nhận được góp ý từ thầy để cải thiện đồ án cũng như bài báo cáo này được tốt hơn. Với các kiến thức thầy truyền đạt và chia sẻ cho lớp em lúc dạy cũng như ngoài giờ, lớp em chân thành cảm ơn thầy và nhóm em tin đây là hành trang quý giá cho chúng em học tập và làm việc sau này. Cuối cùng, nhóm em gửi lời chúc đến thầy sức khỏe cũng như luôn thành công chèo lái con thuyền để đưa chúng em đến với công việc mơ ước. Cảm ơn thầy! --------------------------------------------The end---------------------------------------------

Downloaded by H?u Mai Th? (choemosoeul@gmail.com)


lOMoAR cPSD|15962736


Downloaded by H?u Mai Th?
(choemosoeul@gmail.com)


