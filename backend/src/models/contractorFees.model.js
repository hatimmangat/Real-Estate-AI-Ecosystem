import mongoose from 'mongoose';

const contractorFeesSchema = new mongoose.Schema(
    {
        countNumber: {
            type: Number,
            required: true,
            default:0
        },
        greyLabourRate: {
            type: Number,
            required: true,
            min: 0
        },
        finishLabourRate: {
            type: Number,
            required: true,
            min: 0
        },
        greyContractorFee: {
            type: Number,
            required: true,
            min: 0
        },
        finishContractorFee: {
            type: Number,
            required: true,
            min: 0
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

const ContractorFees = mongoose.model('ContractorFees', contractorFeesSchema);

export default ContractorFees;
