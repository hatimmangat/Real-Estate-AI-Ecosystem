import mongoose from 'mongoose';

const materialsSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            enum: ['steel', 'cement', 'paint', 'ceiling', 'wire', 'tiles', 'sanitary', 'wood', 'sand', 'crush', 'bricks'],
            trim: true
        },
        brand: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        unit: {
            type: String,
            required: true,
            enum: ['kg', 'bag', 'ltr', 'sqft', 'pcs', 'cft', 'set', 'meter'],
            default: 'kg'
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Materials = mongoose.model('Materials', materialsSchema);

export default Materials;
