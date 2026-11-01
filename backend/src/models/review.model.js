import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            default: null
        },
        professionalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        reviewerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Ensure either companyId or professionalId is provided
reviewSchema.pre('save', async function () {
    if (!this.companyId && !this.professionalId) {
        throw new Error('Either companyId or professionalId must be provided');
    }
});

// Indexes for unique constraints per reviewer
// Enforce uniqueness for professional reviews (one review per professional per user)
reviewSchema.index(
    { professionalId: 1, reviewerId: 1 },
    { unique: true, partialFilterExpression: { professionalId: { $ne: null } } }
);
// Enforce uniqueness for company reviews (one review per company per user)
reviewSchema.index(
    { companyId: 1, reviewerId: 1 },
    { unique: true, partialFilterExpression: { companyId: { $ne: null } } }
);

const Review = mongoose.model('Review', reviewSchema);

export default Review;

