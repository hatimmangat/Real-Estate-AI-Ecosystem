import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
    {
        agentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Agent information is required']
        },
        title: {
            type: String,
            required: [true, 'Property title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters']
        },
        description: {
            type: String,
            required: [true, 'Property description is required'],
            maxlength: [2000, 'Description cannot exceed 2000 characters']
        },
        propertyType: {
            type: String,
            required: [true, 'Property type is required'],
            enum: ['House', 'Apartment', 'Villa', 'Studio', 'Penthouse', 'Townhouse', 'Plot', 'Commercial', 'Office', 'Shop', 'Warehouse']
        },
        purpose: {
            type: String,
            required: [true, 'Property purpose is required'],
            enum: ['Sale', 'Rent']
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            validate: {
                validator: function (value) {
                    return value && value > 0;
                },
                message: 'Price must be a positive number'
            }
        },
        rentPerMonth: {
            type: Number,
            validate: {
                validator: function (value) {
                    return !value || value > 0;
                },
                message: 'Rent per month must be a positive number if provided'
            }
        },
        installmentAvailable: {
            type: Boolean,
            default: false
        },
        installmentPlan: {
            downPayment: {
                type: Number,
                validate: {
                    validator: function (value) {
                        return !value || value > 0;
                    },
                    message: 'Down payment must be a positive number if provided'
                }
            },
            monthlyInstallment: {
                type: Number,
                validate: {
                    validator: function (value) {
                        return !value || value > 0;
                    },
                    message: 'Monthly installment must be a positive number if provided'
                }
            },
            duration: {
                type: Number,
                min: [1, 'Duration must be at least 1 month']
            },
            durationUnit: {
                type: String,
                enum: ['months', 'years'],
                default: 'months'
            }
        },
        location: {
            city: {
                type: String,
                required: [true, 'City is required'],
                trim: true
            },
            area: {
                type: String,
                required: [true, 'Area is required'],
                trim: true
            },
            address: {
                type: String,
                required: [true, 'Address is required'],
                trim: true
            },
            coordinates: {
                latitude: {
                    type: Number,
                    default: null
                },
                longitude: {
                    type: Number,
                    default: null
                }
            }
        },
        specifications: {
            bedrooms: {
                type: Number,
                required: [true, 'Number of bedrooms is required'],
                min: [0, 'Bedrooms cannot be negative'],
                default: 0
            },
            bathrooms: {
                type: Number,
                required: [true, 'Number of bathrooms is required'],
                min: [0, 'Bathrooms cannot be negative'],
                default: 0
            },
            area: {
                type: Number,
                required: [true, 'Area is required'],
                min: [0, 'Area must be positive']
            },
            areaUnit: {
                type: String,
                enum: ['sq ft', 'sq m', 'marla', 'kanal'],
                default: 'sq ft'
            },
            floors: {
                type: Number,
                default: 1,
                min: [0, 'Floors cannot be negative'],
                required: [true, 'Number of floors is required']
            },
            yearBuilt: {
                type: Number,
                min: [1900, 'Year built must be after 1900'],
                max: [new Date().getFullYear(), 'Year built cannot be in the future']
            },
            propertyClass: {
                type: String,
                enum: ['A', 'B', 'C', 'D', 'E'],
                default: 'C',
                required: [true, 'Property class is required']
            },
            porch: {
                type: Number,
                default: 0,
                min: [0, 'Porches cannot be negative'],
                required: [true, 'Porch information is required']
            },
            servantQuarter: {
                type: Number,
                default: 0,
                min: [0, 'Servant quarters cannot be negative'],
                required: [true, 'Servant quarter information is required']
            },
            cornerProperty: {
                type: Boolean,
                default: false
            },
            parkFacing: {
                type: Boolean,
                default: false
            },
            houseAge: {
                type: Number,
                default: 0,
                min: [0, 'House age cannot be negative'],
                required: [true, 'House age is required']
            }
        },
        amenities: [{
            type: String,
            enum: [
                'Parking',
                'Garden',
                'Swimming Pool',
                'Gym',
                'Security',
                'Elevator',
                'Balcony',
                'Furnished',
                'Air Conditioning',
                'Heating',
                'Internet',
                'TV Cable',
                'Laundry',
                'Pet Friendly',
                'Wheelchair Accessible'
            ]
        }],
        images: [{
            type: String
        }],
        videos: [{
            type: String
        }],
        status: {
            type: String,
            enum: ['Active', 'Sold', 'Rented', 'Inactive', 'Pending'],
            default: 'Active'
        },
        featured: {
            type: Boolean,
            default: false
        },


    },
    {
        timestamps: true
    }
);

propertySchema.index({ agentId: 1 });
propertySchema.index({ purpose: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ 'location.city': 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ createdAt: -1 });

const Property = mongoose.model('Property', propertySchema);

export default Property;
