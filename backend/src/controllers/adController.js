import Ad from '../models/ad.model.js';
import { deleteImagesFromSupabase } from '../config/supabase.js';

export const createAd = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { adType } = req.body;

        if (!['jobs', 'renting', 'buying'].includes(adType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ad type'
            });
        }

        let adData = { userId, ...req.body };

        if (adData.adType === 'jobs') {
            if (adData.budget) {
                const budgetValue = parseFloat(adData.budget);
                if (isNaN(budgetValue) || budgetValue <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Budget must be a positive number'
                    });
                }
                adData.budget = budgetValue;
            }
        } else if (adData.adType === 'renting') {
            adData.category = 'Renting';
            if (adData.rent) {
                const rentValue = parseFloat(adData.rent);
                if (isNaN(rentValue) || rentValue <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Rent must be a positive number'
                    });
                }
                adData.rent = rentValue;
            }
            if (adData.budget) delete adData.budget;
            if (adData.timeline) delete adData.timeline;
            if (adData.category_temp) delete adData.category_temp;
        } else if (adData.adType === 'buying') {
            adData.category = 'Buying';
            if (adData.budget) {
                const budgetValue = parseFloat(adData.budget);
                if (isNaN(budgetValue) || budgetValue <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Budget must be a positive number'
                    });
                }
                adData.budget = budgetValue;
            }
            if (adData.rent) delete adData.rent;
            if (adData.timeline) delete adData.timeline;
            if (adData.category_temp) delete adData.category_temp;
        }

        const ad = await Ad.create(adData);

        res.status(201).json({
            success: true,
            message: 'Ad created successfully',
            ad
        });
    } catch (error) {
        console.error('Create ad error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const getAllAds = async (req, res) => {
    try {
        const { adType, category, city, search } = req.query;
        let query = { status: 'Active' };

        if (adType) {
            query.adType = adType;
        }

        if (category) {
            query.category = category;
        }

        if (city) {
            query['location.city'] = { $regex: city, $options: 'i' };
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const ads = await Ad.find(query)
            .populate('userId', 'fullName phoneNumber email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: ads.length,
            ads
        });
    } catch (error) {
        console.error('Get ads error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const getUserAds = async (req, res) => {
    try {
        const userId = req.user.userId;
        const ads = await Ad.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: ads.length,
            ads
        });
    } catch (error) {
        console.error('Get user ads error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const getAdById = async (req, res) => {
    try {
        const { id } = req.params;
        const ad = await Ad.findById(id).populate('userId', 'fullName phoneNumber email');

        if (!ad) {
            return res.status(404).json({
                message: 'Ad not found'
            });
        }

        res.status(200).json({
            success: true,
            ad
        });
    } catch (error) {
        console.error('Get ad error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const updateAd = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        console.log('Update Ad - Request User ID:', userId);
        console.log('Update Ad - Ad ID:', id);

        const existingAd = await Ad.findById(id);

        if (!existingAd) {
            return res.status(404).json({
                success: false,
                message: 'Ad not found'
            });
        }

        console.log('Update Ad - Ad Owner ID:', existingAd.userId.toString());
        console.log('Update Ad - Match:', existingAd.userId.toString() === userId.toString());

        if (existingAd.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own ads'
            });
        }

        const oldImages = existingAd.images || [];
        const newImages = req.body.images || [];

        const imagesToDelete = oldImages.filter(oldImage => !newImages.includes(oldImage));

        if (imagesToDelete.length > 0) {
            console.log(`Deleting ${imagesToDelete.length} old images`);
            const { successCount, failureCount } = await deleteImagesFromSupabase(imagesToDelete);
            console.log(`Image deletion result - Success: ${successCount}, Failed: ${failureCount}`);
        }

        const updateData = { ...req.body };

        const adType = updateData.adType || existingAd.adType;

        if (updateData.adType === 'construction-repair') {
            updateData.adType = 'construction';
        }

        if (adType === 'construction') {
            if (updateData.budget) {
                const budgetValue = parseFloat(updateData.budget);
                if (isNaN(budgetValue) || budgetValue <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Budget must be a positive number'
                    });
                }
                updateData.budget = budgetValue;
            }
        } else if (adType === 'renting') {
            updateData.category = 'Renting';
            if (updateData.rent) {
                const rentValue = parseFloat(updateData.rent);
                if (isNaN(rentValue) || rentValue <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Rent must be a positive number'
                    });
                }
                updateData.rent = rentValue;
            }
            if (updateData.budget) delete updateData.budget;
            if (updateData.timeline) delete updateData.timeline;
        } else if (adType === 'buying') {
            updateData.category = 'Buying';
            if (updateData.budget) {
                const budgetValue = parseFloat(updateData.budget);
                if (isNaN(budgetValue) || budgetValue <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Budget must be a positive number'
                    });
                }
                updateData.budget = budgetValue;
            }
            if (updateData.rent) delete updateData.rent;
            if (updateData.timeline) delete updateData.timeline;
        }

        const ad = await Ad.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Ad updated successfully',
            ad
        });
    } catch (error) {
        console.error('Update ad error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const deleteAd = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const ad = await Ad.findOne({ _id: id, userId });

        if (!ad) {
            return res.status(404).json({
                message: 'Ad not found or unauthorized'
            });
        }

        if (ad.images && ad.images.length > 0) {
            console.log(`Deleting ${ad.images.length} images for ad ${id}`);
            const { successCount, failureCount } = await deleteImagesFromSupabase(ad.images);
            console.log(`Image deletion result - Success: ${successCount}, Failed: ${failureCount}`);
        }

        await Ad.findOneAndDelete({ _id: id, userId });

        res.status(200).json({
            success: true,
            message: 'Ad and all associated images deleted successfully'
        });
    } catch (error) {
        console.error('Delete ad error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};
