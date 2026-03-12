const { User } = require('../models');

async function makeAdmin() {
    const email = process.argv[2];
 
    if (!email) {
        console.log(' Vui lòng cung cấp email của tài khoản.');
        console.log(' Cách dùng: node make-admin.js <email>');
        console.log(' Ví dụ: node make-admin.js demo@junkio.com');
        process.exit(1);
    }

    try {
        const user = await User.findOne({ where: { email } });
 
        if (!user) {
            console.log(` Không tìm thấy user nào với email: ${email}`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();
 
        console.log(` Cấp quyền Admin thành công cho tài khoản: ${email}`);
        process.exit(0);
    } catch (error) {
        console.error(' Lỗi khi cấp quyền:', error);
        process.exit(1);
    }
}

makeAdmin();
