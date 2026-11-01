import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    propertyType: {
        type: String,
        required: true,
        enum: ['House', 'Villa', 'Apartment', 'Commercial', 'Land', 'Other']
    },
    location: {
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: String,
        country: {
            type: String,
            required: true
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    startingPrice: {
        type: Number,
        required: true,
        validate: {
            validator: function (value) {
                return value && value > 0;
            },
            message: 'Starting price must be a positive number'
        }
    },
    reservePrice: {
        type: Number,
        required: true,
        validate: {
            validator: function (value) {
                return value && value > 0;
            },
            message: 'Reserve price must be a positive number'
        }
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'ended', 'cancelled'],
        default: 'upcoming'
    },
    specifications: {
        bedrooms: {
            type: Number,
            min: 0
        },
        bathrooms: {
            type: Number,
            min: 0
        },
        area: {
            type: Number,
            min: 0
        },
        yearBuilt: {
            type: Number,
            min: 1800,
            max: new Date().getFullYear()
        }
    },
    images: [{
        type: String
    }],
    bids: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }
}, {
    timestamps: true
});

auctionSchema.index({ status: 1, endDate: 1 });
auctionSchema.index({ 'location.city': 1 });
auctionSchema.index({ propertyType: 1 });
auctionSchema.index({ createdBy: 1 });

const Auction = mongoose.model('Auction', auctionSchema);

export default Auction;