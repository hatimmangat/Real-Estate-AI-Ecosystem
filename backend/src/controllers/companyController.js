import Company from '../models/companies.model.js';
import { deleteImagesFromSupabase } from '../config/supabase.js';

export const createProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const existingProfile = await Company.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        message: 'Profile already exists. Use update endpoint instead.'
      });
    }

    const profile = await Company.create({
      userId,
      ...req.body
    });

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      profile
    });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("updating...", req.body);

    const existingProfile = await Company.findOne({ userId });

    if (!existingProfile) {
      return res.status(404).json({
        message: 'Profile not found. Create profile first.'
      });
    }

    if (req.body.agencyLogo && existingProfile.agencyLogo && existingProfile.agencyLogo !== req.body.agencyLogo) {
      console.log('Deleting old agency logo:', existingProfile.agencyLogo);
      try {
        const { successCount, failureCount } = await deleteImagesFromSupabase([existingProfile.agencyLogo]);
        console.log(`Agency logo deletion result - Success: ${successCount}, Failed: ${failureCount}`);
      } catch (deleteError) {
        console.warn('Warning: Failed to delete old agency logo:', deleteError.message);
      }
    }

    if (req.body.ceoProfilePicture && existingProfile.ceoProfilePicture && existingProfile.ceoProfilePicture !== req.body.ceoProfilePicture) {
      console.log('Deleting old CEO profile picture:', existingProfile.ceoProfilePicture);
      try {
        const { successCount, failureCount } = await deleteImagesFromSupabase([existingProfile.ceoProfilePicture]);
        console.log(`CEO profile picture deletion result - Success: ${successCount}, Failed: ${failureCount}`);
      } catch (deleteError) {
        console.warn('Warning: Failed to delete old CEO profile picture:', deleteError.message);
      }
    }

    const profile = await Company.findOneAndUpdate(
      { userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        message: 'Profile not found. Create profile first.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await Company.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getAllProfiles = async (req, res) => {
  try {
    const profiles = await Company.find()
      .populate('userId', 'fullName email phoneNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: profiles.length,
      profiles
    });
  } catch (error) {
    console.error('Get all profiles error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Company.findById(id)
      .populate('userId', 'fullName email phoneNumber');

    if (!profile) {
      return res.status(404).json({
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      profile: {
        ...profile.toObject(),
        agentUserId: profile.userId._id
      }
    });
  } catch (error) {
    console.error('Get profile by ID error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getTopCompanies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const topCompanies = await Company.find()
      .sort({ rating: -1, reviewCount: -1, createdAt: -1 })
      .limit(limit)
      .populate('userId', 'fullName');

    res.status(200).json({
      success: true,
      count: topCompanies.length,
      companies: topCompanies
    });
  } catch (error) {
    console.error('Get top companies error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
