import mongoose from 'mongoose';

const adSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        adType: {
            type: String,
            required: true,
            enum: ['jobs', 'renting', 'buying']
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: function () { return this.adType === 'jobs'; },
            enum: [
                'Construction',
                'Renovation',
                'Plumbing',
                'Electrical',
                'Painting',
                'Roofing',
                'Flooring',
                'Carpentry',
                'Masonry',
                'Tile Work',
                'Welding',
                'Landscaping',
                'Windows & Doors',
                'Concrete Work',
                'Drywall',
                'Steel Work',
                'Stone Work',
                'Waterproofing',
                'Interior Design',
                'General Labour',
                'Other'
            ]
        },
        location: {
            city: {
                type: String,
                required: true
            },
            area: {
                type: String,
                required: true
            },
            address: {
                type: String,
                required: true
            }
        },
        budget: {
            type: Number,
            required: function () { return this.adType === 'construction' || this.adType === 'buying'; },
            validate: {
                validator: function (value) {
                    return !value || value > 0;
                },
                message: 'Budget must be a positive number if provided'
            }
        },
        timeline: {
            type: String,
            required: function () { return this.adType === 'construction'; }
        },
        propertyType: {
            type: String,
            required: function () { return this.adType === 'renting' || this.adType === 'buying'; }
        },
        bedrooms: {
            type: Number,
            required: function () { return this.adType === 'renting' || this.adType === 'buying'; }
        },
        bathrooms: {
            type: Number,
            required: function () { return this.adType === 'renting' || this.adType === 'buying'; }
        },
        size: {
            type: String,
            required: function () { return this.adType === 'renting' || this.adType === 'buying'; }
        },
        rent: {
            type: Number,
            required: function () { return this.adType === 'renting'; },
            validate: {
                validator: function (value) {
                    return !value || value > 0;
                },
                message: 'Rent must be a positive number if provided'
            }
        },
        contactName: {
            type: String,
            required: true
        },
        contactPhone: {
            type: String,
            required: true
        },
        contactEmail: {
            type: String,
            required: true
        },
        images: [{
            type: String
        }],
        status: {
            type: String,
            enum: ['Active', 'Completed', 'Cancelled'],
            default: 'Active'
        }
    },
    {
        timestamps: true
    }
);

const Ad = mongoose.model('Ad', adSchema);

export default Ad;
