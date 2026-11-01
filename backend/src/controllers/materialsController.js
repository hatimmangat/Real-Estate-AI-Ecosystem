import Materials from '../models/materials.model.js';

export const getAllMaterials = async (req, res) => {
    try {
        const materials = await Materials.find({ isActive: true }).sort({ category: 1, brand: 1 });

        const grouped = materials.reduce((acc, material) => {
            if (!acc[material.category]) {
                acc[material.category] = [];
            }
            acc[material.category].push(material);
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            materials: grouped
        });
    } catch (error) {
        console.error('Get all materials error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const getMaterialsByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        const materials = await Materials.find({ category, isActive: true }).sort({ brand: 1 });

        if (!materials || materials.length === 0) {
            return res.status(404).json({
                message: 'No materials found for this category'
            });
        }

        res.status(200).json({
            success: true,
            category,
            materials
        });
    } catch (error) {
        console.error('Get materials by category error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const addMaterial = async (req, res) => {
    try {
        const { category, brand, price, unit, description } = req.body;

        if (!category || !brand || price === undefined) {
            return res.status(400).json({
                message: 'Category, brand, and price are required'
            });
        }

        const material = await Materials.create({
            category,
            brand,
            price,
            unit: unit || 'kg',
            description
        });

        res.status(201).json({
            success: true,
            message: 'Material added successfully',
            material
        });
    } catch (error) {
        console.error('Add material error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { price, brand, unit, description, isActive } = req.body;

        const material = await Materials.findByIdAndUpdate(
            id,
            {
                ...(price !== undefined && { price }),
                ...(brand && { brand }),
                ...(unit && { unit }),
                ...(description && { description }),
                ...(isActive !== undefined && { isActive })
            },
            { new: true, runValidators: true }
        );

        if (!material) {
            return res.status(404).json({
                message: 'Material not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Material updated successfully',
            material
        });
    } catch (error) {
        console.error('Update material error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;

        const material = await Materials.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!material) {
            return res.status(404).json({
                message: 'Material not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Material deleted successfully'
        });
    } catch (error) {
        console.error('Delete material error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const bulkUpdateMaterials = async (req, res) => {
    try {
        const { updates } = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                message: 'Invalid updates array'
            });
        }

        const results = await Promise.all(
            updates.map(({ id, price }) =>
                Materials.findByIdAndUpdate(id, { price }, { new: true })
            )
        );

        res.status(200).json({
            success: true,
            message: 'Materials updated successfully',
            updatedCount: results.filter(r => r !== null).length
        });
    } catch (error) {
        console.error('Bulk update materials error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const initializeDefaultMaterials = async (req, res) => {
    try {
        const count = await Materials.countDocuments();
        if (count > 0) {
            return res.status(400).json({
                message: 'Materials already initialized'
            });
        }

        const defaultMaterials = [
            // Steel
            { category: 'steel', brand: 'Mughal', price: 275, unit: 'kg' },
            { category: 'steel', brand: 'Amreli', price: 285, unit: 'kg' },
            { category: 'steel', brand: 'Aga Khan', price: 290, unit: 'kg' },
            // Cement
            { category: 'cement', brand: 'Bestway', price: 1300, unit: 'bag' },
            { category: 'cement', brand: 'DG Khan', price: 1320, unit: 'bag' },
            { category: 'cement', brand: 'Lucky', price: 1310, unit: 'bag' },
            { category: 'cement', brand: 'Maple', price: 1280, unit: 'bag' },
            // Paint
            { category: 'paint', brand: 'Brighto', price: 520, unit: 'ltr' },
            { category: 'paint', brand: 'Dulux', price: 650, unit: 'ltr' },
            { category: 'paint', brand: 'Berger', price: 720, unit: 'ltr' },
            { category: 'paint', brand: 'Master', price: 600, unit: 'ltr' },
            { category: 'paint', brand: 'Nippon', price: 780, unit: 'ltr' },
            // Ceiling
            { category: 'ceiling', brand: 'Simple POP', price: 120, unit: 'sqft' },
            { category: 'ceiling', brand: 'Gypsum', price: 180, unit: 'sqft' },
            { category: 'ceiling', brand: 'Designer', price: 260, unit: 'sqft' },
            // Wire
            { category: 'wire', brand: 'Fast', price: 185, unit: 'meter' },
            { category: 'wire', brand: 'Paklite', price: 175, unit: 'meter' },
            { category: 'wire', brand: 'GM', price: 190, unit: 'meter' },
            // Tiles
            { category: 'tiles', brand: 'Master', price: 350, unit: 'sqft' },
            { category: 'tiles', brand: 'Shabbir', price: 300, unit: 'sqft' },
            { category: 'tiles', brand: 'Nitco', price: 450, unit: 'sqft' },
            { category: 'tiles', brand: 'Orient', price: 400, unit: 'sqft' },
            // Sanitary
            { category: 'sanitary', brand: 'Sonex', price: 28000, unit: 'set' },
            { category: 'sanitary', brand: 'Porta', price: 22000, unit: 'set' },
            { category: 'sanitary', brand: 'Master', price: 35000, unit: 'set' },
            { category: 'sanitary', brand: 'Grohe', price: 55000, unit: 'set' },
            // Wood
            { category: 'wood', brand: 'Local', price: 4500, unit: 'sqft' },
            { category: 'wood', brand: 'Deodar', price: 9500, unit: 'sqft' },
            { category: 'wood', brand: 'Sheesham', price: 8000, unit: 'sqft' },
            // Sand
            { category: 'sand', brand: 'Lawrencepur', price: 55, unit: 'cft' },
            { category: 'sand', brand: 'Chenab', price: 50, unit: 'cft' },
            { category: 'sand', brand: 'Ravi', price: 48, unit: 'cft' },
            // Crush
            { category: 'crush', brand: 'Margalla', price: 70, unit: 'cft' },
            { category: 'crush', brand: 'Sargodha', price: 65, unit: 'cft' },
            { category: 'crush', brand: 'Taxila', price: 72, unit: 'cft' },
            // Bricks
            { category: 'bricks', brand: 'A Class', price: 15, unit: 'pcs' },
            { category: 'bricks', brand: 'B Class', price: 13, unit: 'pcs' },
            { category: 'bricks', brand: 'Block Machine', price: 18, unit: 'pcs' }
        ];

        await Materials.insertMany(defaultMaterials);

        res.status(201).json({
            success: true,
            message: `${defaultMaterials.length} default materials initialized successfully`
        });
    } catch (error) {
        console.error('Initialize default materials error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};
