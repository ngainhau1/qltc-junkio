const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Local storage path
    },
    filename: function (req, file, cb) {
        // user-id-uuid.ext configuration
        const ext = path.extname(file.originalname);
        const fileName = `${req.user?.id || 'guest'}-${uuidv4()}${ext}`;
        cb(null, fileName);
    }
});

const fileFilter = (req, file, cb) => {
    // Only accept images
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

const uploadAvatar = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    }
});

module.exports = {
    uploadAvatar,
    uploadDir
};
