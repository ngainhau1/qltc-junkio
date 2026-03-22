const { Op } = require('sequelize');
const { Budget, Category, FamilyMember } = require('../models');
const { success, error: sendError, notFound, serverError, created } = require('../utils/responseHelper');

const budgetInclude = [{ model: Category, attributes: ['id', 'name', 'icon'] }];

const getAccessibleFamilyIds = async (userId) => {
    const memberships = await FamilyMember.findAll({
        where: { user_id: userId },
        attributes: ['family_id']
    });

    return memberships.map((membership) => membership.family_id);
};

const buildBudgetScopeWhere = (userId, familyIds) => {
    const conditions = [{ user_id: userId }];

    if (familyIds.length > 0) {
        conditions.push({ family_id: { [Op.in]: familyIds } });
    }

    return { [Op.or]: conditions };
};

const findAccessibleBudget = async (id, userId) => {
    const familyIds = await getAccessibleFamilyIds(userId);

    return Budget.findOne({
        where: {
            id,
            ...buildBudgetScopeWhere(userId, familyIds)
        },
        include: budgetInclude
    });
};

const resolveBudgetScope = async (req, currentBudget = null) => {
    const hasFamilyField = Object.prototype.hasOwnProperty.call(req.body, 'family_id');
    const requestedFamilyId = hasFamilyField ? req.body.family_id : currentBudget?.family_id ?? null;

    if (requestedFamilyId) {
        const membership = await FamilyMember.findOne({
            where: {
                user_id: req.user.id,
                family_id: requestedFamilyId
            }
        });

        if (!membership) {
            throw Object.assign(new Error('Ban khong thuoc family nay'), { statusCode: 403 });
        }

        return {
            family_id: requestedFamilyId,
            user_id: null
        };
    }

    if (!currentBudget || hasFamilyField || !currentBudget.family_id) {
        return {
            family_id: null,
            user_id: req.user.id
        };
    }

    return {
        family_id: currentBudget.family_id,
        user_id: null
    };
};

exports.getBudgets = async (req, res) => {
    try {
        const familyIds = await getAccessibleFamilyIds(req.user.id);
        const budgets = await Budget.findAll({
            where: buildBudgetScopeWhere(req.user.id, familyIds),
            include: budgetInclude,
            order: [['start_date', 'DESC'], ['createdAt', 'DESC']]
        });

        success(res, budgets, 'Lay danh sach ngan sach thanh cong');
    } catch (err) {
        console.error('Error fetching budgets:', err);
        serverError(res, 'Khong the tai ngan sach');
    }
};

exports.createBudget = async (req, res) => {
    try {
        const { amount_limit, start_date, end_date, category_id } = req.body;
        const scope = await resolveBudgetScope(req);

        const newBudget = await Budget.create({
            amount_limit,
            start_date,
            end_date,
            category_id,
            ...scope
        });

        const createdBudget = await Budget.findByPk(newBudget.id, { include: budgetInclude });
        created(res, createdBudget, 'Tao ngan sach moi thanh cong');
    } catch (err) {
        if (err.statusCode) {
            return sendError(res, err.message, err.statusCode);
        }
        console.error('Error creating budget:', err);
        serverError(res, 'Khong the tao ngan sach');
    }
};

exports.updateBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const budget = await findAccessibleBudget(id, req.user.id);

        if (!budget) {
            return notFound(res, 'Ngan sach khong ton tai');
        }

        const scope = await resolveBudgetScope(req, budget);
        await budget.update({
            amount_limit: req.body.amount_limit !== undefined ? req.body.amount_limit : budget.amount_limit,
            start_date: req.body.start_date !== undefined ? req.body.start_date : budget.start_date,
            end_date: req.body.end_date !== undefined ? req.body.end_date : budget.end_date,
            category_id: req.body.category_id !== undefined ? req.body.category_id : budget.category_id,
            ...scope
        });

        const updatedBudget = await Budget.findByPk(id, { include: budgetInclude });
        success(res, updatedBudget, 'Cap nhat ngan sach thanh cong');
    } catch (err) {
        if (err.statusCode) {
            return sendError(res, err.message, err.statusCode);
        }
        console.error('Error updating budget:', err);
        serverError(res, 'Khong the cap nhat ngan sach');
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const budget = await findAccessibleBudget(id, req.user.id);

        if (!budget) {
            return notFound(res, 'Ngan sach khong ton tai');
        }

        await budget.destroy();
        success(res, null, 'Da xoa ngan sach thanh cong');
    } catch (err) {
        console.error('Error deleting budget:', err);
        serverError(res, 'Khong the xoa ngan sach');
    }
};
