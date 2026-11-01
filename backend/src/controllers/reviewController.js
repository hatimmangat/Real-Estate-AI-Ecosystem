
import Review from '../models/review.model.js';
import Company from '../models/companies.model.js';
import User from '../models/user.model.js';

export const createProfessionalReview = async (req, res) => {
    try {
        const reviewerId = req.user.userId;
        const { professionalId, rating, comment } = req.body;

        if (reviewerId === professionalId) {
            return res.status(400).json({
                message: 'You cannot review your own profile'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: 'Rating must be between 1 and 5'
            });
        }

        const existingReview = await Review.findOne({ professionalId, reviewerId });
        if (existingReview) {
            return res.status(400).json({
                message: 'You have already reviewed this professional'
            });
        }

        const review = await Review.create({
            professionalId,
            reviewerId,
            rating,
            comment
        });

        const populatedReview = await Review.findById(review._id)
            .populate('reviewerId', 'fullName profilePicture');

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review: populatedReview
        });
    } catch (error) {
        console.error('Create professional review error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'You have already reviewed this professional'
            });
        }
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const updateProfessionalReview = async (req, res) => {
    try {
        const reviewerId = req.user.userId;
        const { reviewId } = req.params;
        const { rating, comment } = req.body;

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: 'Rating must be between 1 and 5'
            });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                message: 'Review not found'
            });
        }

        if (review.reviewerId.toString() !== reviewerId.toString()) {
            return res.status(403).json({
                message: 'You are not authorized to update this review'
            });
        }

        review.rating = rating;
        review.comment = comment;
        await review.save();

        const updatedReview = await Review.findById(review._id)
            .populate('reviewerId', 'fullName profilePicture');

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            review: updatedReview
        });
    } catch (error) {
        console.error('Update professional review error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const deleteProfessionalReview = async (req, res) => {
    try {
        const reviewerId = req.user.userId;
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                message: 'Review not found'
            });
        }

        if (review.reviewerId.toString() !== reviewerId.toString()) {
            return res.status(403).json({
                message: 'You are not authorized to delete this review'
            });
        }

        await Review.findByIdAndDelete(reviewId);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete professional review error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const getProfessionalReviews = async (req, res) => {
    try {
        const { professionalId } = req.params;

        const reviews = await Review.find({ professionalId })
            .populate('reviewerId', 'fullName profilePicture')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            reviews
        });
    } catch (error) {
        console.error('Get professional reviews error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const createCompanyReview = async (req, res) => {
    try {
        const reviewerId = req.user.userId;
        const { companyId, rating, comment } = req.body;

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: 'Rating must be between 1 and 5'
            });
        }

        const existingReview = await Review.findOne({ companyId, reviewerId });
        if (existingReview) {
            return res.status(400).json({
                message: 'You have already reviewed this company'
            });
        }

        const review = await Review.create({
            companyId,
            reviewerId,
            rating,
            comment
        });

        await updateCompanyRating(companyId);

        const populatedReview = await Review.findById(review._id)
            .populate('reviewerId', 'fullName profilePicture');

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review: populatedReview
        });
    } catch (error) {
        console.error('Create company review error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'You have already reviewed this company'
            });
        }
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const updateCompanyReview = async (req, res) => {
    try {
        const reviewerId = req.user.userId;
        const { reviewId } = req.params;
        const { rating, comment } = req.body;

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: 'Rating must be between 1 and 5'
            });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                message: 'Review not found'
            });
        }

        if (review.reviewerId.toString() !== reviewerId.toString()) {
            return res.status(403).json({
                message: 'You are not authorized to update this review'
            });
        }

        review.rating = rating;
        review.comment = comment;
        await review.save();

        if (review.companyId) {
            await updateCompanyRating(review.companyId);
        }

        const updatedReview = await Review.findById(review._id)
            .populate('reviewerId', 'fullName profilePicture');

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            review: updatedReview
        });
    } catch (error) {
        console.error('Update company review error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const deleteCompanyReview = async (req, res) => {
    try {
        const reviewerId = req.user.userId;
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                message: 'Review not found'
            });
        }

        if (review.reviewerId.toString() !== reviewerId.toString()) {
            return res.status(403).json({
                message: 'You are not authorized to delete this review'
            });
        }

        const companyId = review.companyId;
        await Review.findByIdAndDelete(reviewId);

        if (companyId) {
            await updateCompanyRating(companyId);
        }

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete company review error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const getCompanyReviews = async (req, res) => {
    try {
        const { companyId } = req.params;

        const reviews = await Review.find({ companyId })
            .populate('reviewerId', 'fullName profilePicture')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            reviews
        });
    } catch (error) {
        console.error('Get company reviews error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

const updateCompanyRating = async (companyId) => {
    try {
        const reviews = await Review.find({ companyId });

        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;

            await Company.findByIdAndUpdate(companyId, {
                rating: averageRating,
                reviewCount: reviews.length
            });

            console.log(`Updated company ${companyId}: rating=${averageRating}, reviewCount=${reviews.length}`);
        }
    } catch (error) {
        console.error('Update company rating error:', error);
    }
};

