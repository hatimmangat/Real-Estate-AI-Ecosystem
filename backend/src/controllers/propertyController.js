import Property from '../models/property.model.js';
import Company from '../models/companies.model.js';
import { deleteImagesFromSupabase } from '../config/supabase.js';

export const createProperty = async (req, res) => {
    try {
        const agentId = req.user.userId;
        let propertyData = { agentId, ...req.body };

        if (propertyData.price) {
            const priceValue = parseFloat(propertyData.price);
            if (isNaN(priceValue) || priceValue <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price must be a positive number'
                });
            }
            propertyData.price = priceValue;
        }

        if (propertyData.rentPerMonth) {
            const rentValue = parseFloat(propertyData.rentPerMonth);
            if (isNaN(rentValue) || rentValue <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Rent per month must be a positive number'
                });
            }
            propertyData.rentPerMonth = rentValue;
        }

        if (propertyData.installmentPlan) {
            if (propertyData.installmentPlan.downPayment) {
                const downPaymentValue = parseFloat(propertyData.installmentPlan.downPayment);
                if (isNaN(downPaymentValue) || downPaymentValue <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Down payment must be a positive number'
                    });
                }
                propertyData.installmentPlan.downPayment = downPaymentValue;
            }
            if (propertyData.installmentPlan.monthlyInstallment) {
                const monthlyValue = parseFloat(propertyData.installmentPlan.monthlyInstallment);
                if (isNaN(monthlyValue) || monthlyValue <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Monthly installment must be a positive number'
                    });
                }
                propertyData.installmentPlan.monthlyInstallment = monthlyValue;
            }
        }

        const property = await Property.create(propertyData);

        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            property
        });
    } catch (error) {
        console.error('Create property error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const agentId = req.user.userId;

        const property = await Property.findOne({ _id: id, agentId });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found or unauthorized'
            });
        }

        const oldImages = property.images || [];
        const newImages = req.body.images || [];

        const imagesToDelete = oldImages.filter(oldImage => !newImages.includes(oldImage));

        if (imagesToDelete.length > 0) {
            console.log(`Deleting ${imagesToDelete.length} old property images`);
            const { successCount, failureCount } = await deleteImagesFromSupabase(imagesToDelete);
            console.log(`Image deletion result - Success: ${successCount}, Failed: ${failureCount}`);
        }

        let updateData = { ...req.body };

        if (updateData.price) {
            const priceValue = parseFloat(updateData.price);
            if (isNaN(priceValue) || priceValue <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price must be a positive number'
                });
            }
            updateData.price = priceValue;
        }

        if (updateData.rentPerMonth) {
            const rentValue = parseFloat(updateData.rentPerMonth);
            if (isNaN(rentValue) || rentValue <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Rent per month must be a positive number'
                });
            }
            updateData.rentPerMonth = rentValue;
        }

        if (updateData.installmentPlan) {
            if (updateData.installmentPlan.downPayment) {
                const downPaymentValue = parseFloat(updateData.installmentPlan.downPayment);
                if (isNaN(downPaymentValue) || downPaymentValue <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Down payment must be a positive number'
                    });
                }
                updateData.installmentPlan.downPayment = downPaymentValue;
            }
            if (updateData.installmentPlan.monthlyInstallment) {
                const monthlyValue = parseFloat(updateData.installmentPlan.monthlyInstallment);
                if (isNaN(monthlyValue) || monthlyValue <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Monthly installment must be a positive number'
                    });
                }
                updateData.installmentPlan.monthlyInstallment = monthlyValue;
            }
        }

        const updatedProperty = await Property.findOneAndUpdate(
            { _id: id, agentId },
            { $set: updateData },
            { new: true, runValidators: false }
        );

        if (!updatedProperty) {
            return res.status(404).json({
                success: false,
                message: 'Property not found or unauthorized'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Property updated successfully',
            property: updatedProperty
        });
    } catch (error) {
        console.error('Update property error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const agentId = req.user.userId;

        const property = await Property.findOne({ _id: id, agentId });

        if (!property) {
            return res.status(404).json({
                message: 'Property not found or unauthorized'
            });
        }

        if (property.images && property.images.length > 0) {
            console.log(`Deleting ${property.images.length} images for property ${id}`);
            const { successCount, failureCount } = await deleteImagesFromSupabase(property.images);
            console.log(`Image deletion result - Success: ${successCount}, Failed: ${failureCount}`);
        }

        await Property.findOneAndDelete({ _id: id, agentId });

        res.status(200).json({
            success: true,
            message: 'Property and all associated images deleted successfully'
        });
    } catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const getAgentProperties = async (req, res) => {
    try {
        const agentId = req.user.userId;
        const properties = await Property.find({ agentId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: properties.length,
            properties
        });
    } catch (error) {
        console.error('Get agent properties error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await Property.findById(id)
            .populate('agentId', 'fullName email phoneNumber')
            .lean();

        if (!property) {
            return res.status(404).json({
                message: 'Property not found'
            });
        }

        if (property.agentId) {
            const company = await Company.findOne({ userId: property.agentId._id });
            if (company) {
                property.company = company;
            }
        }

        res.status(200).json({
            success: true,
            property
        });
    } catch (error) {
        console.error('Get property error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const getPropertyByIdForEdit = async (req, res) => {
    try {
        const { id } = req.params;
        const agentId = req.user.userId;

        const property = await Property.findOne({ _id: id, agentId });

        if (!property) {
            return res.status(404).json({
                message: 'Property not found or unauthorized'
            });
        }

        res.status(200).json({
            success: true,
            property
        });
    } catch (error) {
        console.error('Get property for edit error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const getAllProperties = async (req, res) => {
    try {
        const { purpose, city, propertyType, minPrice, maxPrice, search, agentId } = req.query;

        let query = { status: 'Active' };

        if (purpose) {
            query.purpose = purpose;
        }

        if (agentId) {
            query.agentId = agentId;
        }

        if (city) {
            query['location.city'] = { $regex: city, $options: 'i' };
        }

        if (propertyType) {
            query.propertyType = propertyType;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'location.area': { $regex: search, $options: 'i' } },
                { 'location.city': { $regex: search, $options: 'i' } }
            ];
        }

        const properties = await Property.find(query)
            .populate('agentId', 'fullName email phoneNumber')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: properties.length,
            properties
        });
    } catch (error) {
        console.error('Get all properties error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const getPropertiesByAgent = async (req, res) => {
    try {
        const { agentId } = req.params;
        console.log("id", agentId)
        const properties = await Property.find({
            agentId,

        }).sort({ createdAt: -1 });
        console.log("properties", properties)
        const groupedProperties = {
            forSale: {
                houses: properties.filter(p => p.purpose === 'Sale' && p.propertyType === 'House'),
                apartments: properties.filter(p => p.purpose === 'Sale' && p.propertyType === 'Apartment'),
                plots: properties.filter(p => p.purpose === 'Sale' && p.propertyType === 'Plot'),
                commercial: properties.filter(p => p.purpose === 'Sale' && (p.propertyType === 'Commercial' || p.propertyType === 'Office')),
            },
            forRent: {
                houses: properties.filter(p => p.purpose === 'Rent' && p.propertyType === 'House'),
                apartments: properties.filter(p => p.purpose === 'Rent' && p.propertyType === 'Apartment'),
            }
        };

        res.status(200).json({
            success: true,
            total: properties.length,
            properties: groupedProperties
        });
    } catch (error) {
        console.error('Get properties by agent error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};
export const getProperties = async (req, res) => {
    try {
        const { purpose, city, type, minPrice, maxPrice, search } = req.query;

        const query = { status: 'Active' };

        if (purpose) {
            query.purpose = purpose;
        }

        if (city) {
            query['location.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
        }

        if (type) {
            query.propertyType = type;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'location.city': { $regex: search, $options: 'i' } },
                { 'location.area': { $regex: search, $options: 'i' } }
            ];
        }

        const properties = await Property.find(query)
            .populate('agentId', 'fullName email phoneNumber')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            properties
        });
    } catch (error) {
        console.error('Get properties error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

