const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Danh mục thu/chi
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy danh sách danh mục
 *     tags: [Categories]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Danh sách categories }
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Tạo danh mục mới
 *     tags: [Categories]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *     responses:
 *       201: { description: Tạo thành công }
 */
router.post('/', categoryController.createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục
 *     tags: [Categories]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Cập nhật thành công }
 */
router.put('/:id', categoryController.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Xóa danh mục
 *     tags: [Categories]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Xóa thành công }
 */
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
