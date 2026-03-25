var express = require('express');
var router = express.Router();
let inventoryModel = require('../schemas/inventories');

// GET all inventories (join với product)
router.get('/', async function (req, res, next) {
    try {
        let result = await inventoryModel.find().populate({
            path: 'product',
            select: 'title slug price category'
        });
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// GET inventory by ID (join với product)
router.get('/:id', async function (req, res, next) {
    try {
        let result = await inventoryModel.findById(req.params.id).populate({
            path: 'product',
            select: 'title slug price category'
        });
        if (!result) {
            return res.status(404).send({ message: 'Inventory not found' });
        }
        res.send(result);
    } catch (error) {
        res.status(404).send({ message: 'Inventory not found' });
    }
});

// POST /add-stock - tăng stock
router.post('/add-stock', async function (req, res, next) {
    try {
        let { product, quantity } = req.body;
        if (!product || !quantity || quantity <= 0) {
            return res.status(400).send({ message: 'product và quantity (> 0) là bắt buộc' });
        }
        let inventory = await inventoryModel.findOneAndUpdate(
            { product },
            { $inc: { stock: quantity } },
            { new: true }
        ).populate('product', 'title slug price');
        if (!inventory) {
            return res.status(404).send({ message: 'Inventory not found for product' });
        }
        res.send(inventory);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// POST /remove-stock - giảm stock
router.post('/remove-stock', async function (req, res, next) {
    try {
        let { product, quantity } = req.body;
        if (!product || !quantity || quantity <= 0) {
            return res.status(400).send({ message: 'product và quantity (> 0) là bắt buộc' });
        }
        let inventory = await inventoryModel.findOne({ product });
        if (!inventory) {
            return res.status(404).send({ message: 'Inventory not found for product' });
        }
        if (inventory.stock < quantity) {
            return res.status(400).send({ message: 'Không đủ stock để remove' });
        }
        inventory.stock -= quantity;
        await inventory.save();
        await inventory.populate('product', 'title slug price');
        res.send(inventory);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// POST /reservation - giảm stock và tăng reserved
router.post('/reservation', async function (req, res, next) {
    try {
        let { product, quantity } = req.body;
        if (!product || !quantity || quantity <= 0) {
            return res.status(400).send({ message: 'product và quantity (> 0) là bắt buộc' });
        }
        let inventory = await inventoryModel.findOne({ product });
        if (!inventory) {
            return res.status(404).send({ message: 'Inventory not found for product' });
        }
        if (inventory.stock < quantity) {
            return res.status(400).send({ message: 'Không đủ stock để reservation' });
        }
        inventory.stock -= quantity;
        inventory.reserved += quantity;
        await inventory.save();
        await inventory.populate('product', 'title slug price');
        res.send(inventory);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// POST /sold - giảm reserved và tăng soldCount
router.post('/sold', async function (req, res, next) {
    try {
        let { product, quantity } = req.body;
        if (!product || !quantity || quantity <= 0) {
            return res.status(400).send({ message: 'product và quantity (> 0) là bắt buộc' });
        }
        let inventory = await inventoryModel.findOne({ product });
        if (!inventory) {
            return res.status(404).send({ message: 'Inventory not found for product' });
        }
        if (inventory.reserved < quantity) {
            return res.status(400).send({ message: 'Không đủ reserved để sold' });
        }
        inventory.reserved -= quantity;
        inventory.soldCount += quantity;
        await inventory.save();
        await inventory.populate('product', 'title slug price');
        res.send(inventory);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;
