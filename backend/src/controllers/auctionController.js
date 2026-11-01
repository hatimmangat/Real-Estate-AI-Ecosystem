import Auction from '../models/auction.model.js';
import User from '../models/user.model.js';
import { deleteImagesFromSupabase } from '../config/supabase.js';

export const createAuction = async (req, res) => {
    try {
        console.log('=== CREATE AUCTION CONTROLLER ===');
        console.log('User from middleware:', req.user);
        console.log('User role:', req.user?.role);

        const {
            title,
            description,
            propertyType,
            location,
            startingPrice,
            reservePrice,
            startDate,
            endDate,
            specifications,
            images
        } = req.body;

        if (!title || !description || !location?.address || !location?.city) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!startingPrice || !reservePrice || !startDate || !endDate) {
            return res.status(400).json({ message: 'Missing pricing or date information' });
        }

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                message: 'At least one property image is required',
                field: 'images'
            });
        }

        const invalidImages = images.filter(img => !img || typeof img !== 'string' || img.trim() === '');
        if (invalidImages.length > 0) {
            return res.status(400).json({
                message: 'All images must be valid URLs',
                field: 'images'
            });
        }

        const startingPriceValue = parseFloat(startingPrice);
        const reservePriceValue = parseFloat(reservePrice);

        console.log('Original prices:', { startingPrice, reservePrice });
        console.log('Parsed prices:', { startingPriceValue, reservePriceValue });

        if (isNaN(startingPriceValue) || startingPriceValue <= 0 || isNaN(reservePriceValue) || reservePriceValue <= 0) {
            return res.status(400).json({
                message: 'Prices must be positive numbers'
            });
        }

        const now = new Date();
        const auctionStartDate = new Date(startDate);
        const auctionEndDate = new Date(endDate);

        let auctionStatus = 'upcoming';
        if (auctionStartDate <= now && auctionEndDate > now) {
            auctionStatus = 'active';
        } else if (auctionEndDate <= now) {
            auctionStatus = 'ended';
        }

        const auction = new Auction({
            title,
            description,
            propertyType,
            location,
            startingPrice: startingPriceValue,
            currentBid: startingPriceValue,
            reservePrice: reservePriceValue,
            startDate: auctionStartDate,
            endDate: auctionEndDate,
            status: auctionStatus,
            specifications: specifications || {},
            images: images.filter(img => img && img.trim()),
            createdBy: req.user.id || req.user.userId,
            companyId: req.user.companyId
        });

        console.log('About to save auction with numeric prices:', {
            startingPrice: startingPriceValue,
            reservePrice: reservePriceValue
        });

        const savedAuction = await auction.save();
        console.log('Auction saved successfully:', savedAuction._id);

        await savedAuction.populate('createdBy', 'fullName email profilePicture');

        res.status(201).json({
            success: true,
            message: 'Auction created successfully',
            auction: savedAuction
        });
    } catch (error) {
        console.error('Create auction error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Server error while creating auction',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const getAllAuctions = async (req, res) => {
    try {
        const { status, propertyType, city } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (propertyType) filter.propertyType = propertyType;
        if (city) filter['location.city'] = new RegExp(city, 'i');

        const auctions = await Auction.find(filter)
            .populate('createdBy', 'fullName email profilePicture')
            .populate('companyId', 'name logo')
            .sort({ createdAt: -1 });

        res.json({ auctions });
    } catch (error) {
        console.error('Get auctions error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getAuctionById = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id)
            .populate('createdBy', 'fullName email phone profilePicture')
            .populate('companyId', 'name logo contactInfo')
            .populate('bids.userId', 'fullName');

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        res.json({ auction });
    } catch (error) {
        console.error('Get auction error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getMyAuctions = async (req, res) => {
    try {
        const auctions = await Auction.find({ createdBy: req.user.id })
            .populate('companyId', 'name logo')
            .sort({ createdAt: -1 });

        res.json({ auctions });
    } catch (error) {
        console.error('Get my auctions error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateAuction = async (req, res) => {
    try {
        const { title, description, startingPrice, reservePrice, startDate, endDate, images, specifications } = req.body;
        const auctionId = req.params.id;

        const auction = await Auction.findById(auctionId);

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        if (auction.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to edit this auction'
            });
        }

        if (auction.status === 'active' && auction.bids && auction.bids.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit an active auction that has received bids'
            });
        }

        if (auction.status === 'ended') {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit an ended auction'
            });
        }

        const oldImages = auction.images || [];
        const newImages = images || [];

        const imagesToDelete = oldImages.filter(oldImage => !newImages.includes(oldImage));

        if (imagesToDelete.length > 0) {
            console.log(`Deleting ${imagesToDelete.length} old auction images`);
            const { successCount, failureCount } = await deleteImagesFromSupabase(imagesToDelete);
            console.log(`Image deletion result - Success: ${successCount}, Failed: ${failureCount}`);
        }

        if (startingPrice && (!auction.bids || auction.bids.length === 0)) {
            const startingPriceValue = parseFloat(startingPrice);
            if (isNaN(startingPriceValue) || startingPriceValue <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Starting price must be a positive number'
                });
            }
        }

        if (reservePrice) {
            const reservePriceValue = parseFloat(reservePrice);
            if (isNaN(reservePriceValue) || reservePriceValue <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Reserve price must be a positive number'
                });
            }
        }

        if (startDate && endDate) {
            const newStartDate = new Date(startDate);
            const newEndDate = new Date(endDate);

            if (newEndDate <= newStartDate) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date'
                });
            }

            auction.startDate = newStartDate;
            auction.endDate = newEndDate;

            const now = new Date();
            if (newStartDate <= now && newEndDate > now) {
                auction.status = 'active';
            } else if (newEndDate <= now) {
                auction.status = 'ended';
            } else {
                auction.status = 'upcoming';
            }
        }

        if (title) auction.title = title;
        if (description) auction.description = description;
        if (images) auction.images = images;
        if (specifications) auction.specifications = specifications;

        if (startingPrice && (!auction.bids || auction.bids.length === 0)) {
            const startingPriceValue = parseFloat(startingPrice);
            if (isNaN(startingPriceValue) || startingPriceValue <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Starting price must be a positive number'
                });
            }
            auction.startingPrice = startingPriceValue;
            auction.currentBid = startingPriceValue;
        }

        if (reservePrice) {
            const reservePriceValue = parseFloat(reservePrice);
            if (isNaN(reservePriceValue) || reservePriceValue <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Reserve price must be a positive number'
                });
            }
            auction.reservePrice = reservePriceValue;
        }

        await auction.save();

        const updatedAuction = await Auction.findById(auctionId)
            .populate('createdBy', 'fullName email profilePicture')
            .populate('companyId', 'name logo');

        res.json({
            success: true,
            message: 'Auction updated successfully',
            auction: updatedAuction
        });
    } catch (error) {
        console.error('Error updating auction:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};


export const deleteAuction = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        if (auction.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this auction' });
        }

        if (auction.status === 'active') {
            return res.status(400).json({ message: 'Cannot delete active auction' });
        }

        if (auction.images && auction.images.length > 0) {
            console.log(`Deleting ${auction.images.length} images for auction ${req.params.id}`);
            const { successCount, failureCount } = await deleteImagesFromSupabase(auction.images);
            console.log(`Image deletion result - Success: ${successCount}, Failed: ${failureCount}`);
        }

        await auction.deleteOne();
        res.json({
            success: true,
            message: 'Auction and all associated images deleted successfully'
        });
    } catch (error) {
        console.error('Delete auction error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


