import User from '../models/user.model.js';
import Company from '../models/companies.model.js';
import Property from '../models/property.model.js';
import Auction from '../models/auction.model.js';
import Project from '../models/project.model.js';
import Ad from '../models/ad.model.js';
import Review from '../models/review.model.js';
import supabase, { deleteImagesFromSupabase } from '../config/supabase.js';

export const signup = async (req, res) => {
  const { name, email, role, profilePicture, supabaseUid, supabaseToken } = req.body;

  const rollbackSupabase = async () => {
    if (supabaseUid) {
      try {
        await supabase.auth.admin.deleteUser(supabaseUid);
        console.log(`Successfully deleted orphaned Supabase user: ${supabaseUid}`);
      } catch (deleteError) {
        console.error(`Failed to delete orphaned Supabase user ${supabaseUid}:`, deleteError);
      }
    }
  };

  try {
    console.log('Backend signup received request for:', { email, name, role, supabaseUid });

    if (/^\d/.test(name)) {
      console.log('Signup validation failed: Name starts with a digit');
      await rollbackSupabase();
      return res.status(400).json({
        message: 'Name cannot start with a digit'
      });
    }

    if (!profilePicture) {
      console.log('Signup validation failed: Profile picture missing');
      await rollbackSupabase();
      return res.status(400).json({
        message: 'Profile picture is required'
      });
    }

    if (!supabaseUid) {
      console.log('Signup validation failed: Supabase UID missing');
      return res.status(400).json({
        message: 'Supabase UID required'
      });
    }

    try {
      console.log('Verifying Supabase user ID with admin client...');
      const { data: { user: supabaseUser }, error } = await supabase.auth.admin.getUserById(supabaseUid);
      if (error || !supabaseUser || supabaseUser.id !== supabaseUid) {
        console.error('Supabase admin getUser mismatch or error:', error);
        await rollbackSupabase();
        return res.status(401).json({
          message: 'Invalid Supabase user ID'
        });
      }
      console.log('Supabase user verified successfully:', supabaseUser.email);
    } catch (error) {
      console.error('Supabase admin getUser exception:', error);
      await rollbackSupabase();
      return res.status(401).json({
        message: 'Invalid Supabase user ID',
        error: error.message
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Signup validation failed: User already exists with email:', email);
      await rollbackSupabase();
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    console.log('Creating user in MongoDB...');
    const user = await User.create({
      fullName: name,
      email,
      profilePicture,
      supabaseUid,
      role: role || 'user'
    });

    console.log('User created successfully in MongoDB:', user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email.',
      email: user.email
    });
  } catch (error) {
    console.error('Signup caught exception in outer block:', error);
    await rollbackSupabase();
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const signupRollback = async (req, res) => {
  try {
    const { supabaseUid } = req.body;
    if (!supabaseUid) {
      return res.status(400).json({ message: 'Supabase UID is required' });
    }

    // Safety check: ensure user doesn't exist in MongoDB before deleting from Supabase
    const userExistsInMongo = await User.findOne({ supabaseUid });
    if (userExistsInMongo) {
      return res.status(400).json({
        message: 'Cannot rollback: user registration already completed in MongoDB'
      });
    }

    const { error } = await supabase.auth.admin.deleteUser(supabaseUid);
    if (error) {
      return res.status(500).json({
        message: 'Failed to delete Supabase user during rollback',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Supabase user successfully rolled back'
    });
  } catch (error) {
    console.error('Rollback error:', error);
    return res.status(500).json({
      message: 'Server error during rollback',
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { supabaseToken, supabaseUid, role } = req.body;

    if (!supabaseToken || !supabaseUid) {
      return res.status(400).json({
        message: 'Supabase authentication required'
      });
    }

    let supabaseUser;
    try {
      const { data: { user }, error } = await supabase.auth.getUser(supabaseToken);
      if (error || !user || user.id !== supabaseUid) {
        return res.status(401).json({
          message: 'Invalid Supabase token'
        });
      }
      supabaseUser = user;
    } catch (error) {
      return res.status(401).json({
        message: 'Invalid Supabase token',
        error: error.message
      });
    }

    let user = await User.findOne({ supabaseUid });
    if (!user) {
      // If user signed in with Google, we can automatically create their profile if email matches
      const existingUserByEmail = await User.findOne({ email: supabaseUser.email });
      if (existingUserByEmail) {
        existingUserByEmail.supabaseUid = supabaseUid;
        if (role) {
          existingUserByEmail.role = role;
        }
        await existingUserByEmail.save();
        user = existingUserByEmail;
      } else if (supabaseUser.app_metadata?.provider === 'google' || supabaseUser.identities?.some(id => id.provider === 'google')) {
        // Automatic sign up for Google users
        user = await User.create({
          fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
          email: supabaseUser.email,
          profilePicture: supabaseUser.user_metadata?.avatar_url || 'https://via.placeholder.com/150',
          supabaseUid,
          role: role || 'user'
        });
      } else {
        return res.status(404).json({
          message: 'User not found. Please sign up first.'
        });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: 'User account has been deactivated. Please contact support.'
      });
    }

    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture,
      role: user.role
    };

    res.status(200).json({
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, phoneNumber, profilePicture } = req.body;

    if (fullName && /^\d/.test(fullName)) {
      return res.status(400).json({
        message: 'Name cannot start with a digit'
      });
    }

    const existingUser = await User.findById(userId);

    if (profilePicture && existingUser && existingUser.profilePicture && existingUser.profilePicture !== profilePicture) {
      console.log('Deleting old user profile picture');
      const { successCount, failureCount } = await deleteImagesFromSupabase([existingUser.profilePicture]);
      console.log(`Profile picture deletion result - Success: ${successCount}, Failed: ${failureCount}`);
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (profilePicture) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const DeleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.profilePicture) {
      console.log('Deleting user profile picture');
      const { successCount, failureCount } = await deleteImagesFromSupabase([user.profilePicture]);
      console.log(`Profile picture deletion result - Success: ${successCount}, Failed: ${failureCount}`);
    }

    if (user.supabaseUid) {
      try {
        await supabase.auth.admin.deleteUser(user.supabaseUid);
        console.log(`Supabase user ${user.supabaseUid} deleted successfully`);
      } catch (supabaseAuthError) {
        console.error('Supabase auth deletion error:', supabaseAuthError);
        // Supabase returns standard errors, let's log and keep going or handle it
      }
    }

    if (user.role === 'agent') {
      const company = await Company.findOne({ userId: userId });
      if (company && company.logo) {
        console.log('Deleting company logo');
        await deleteImagesFromSupabase([company.logo]);
      }

      await Company.findOneAndDelete({ userId: userId });

      const properties = await Property.find({ agentId: userId });
      for (const property of properties) {
        if (property.images && property.images.length > 0) {
          console.log(`Deleting ${property.images.length} images for property`);
          await deleteImagesFromSupabase(property.images);
        }
      }
      await Property.deleteMany({ agentId: userId });

      const auctions = await Auction.find({ createdBy: userId });
      for (const auction of auctions) {
        if (auction.images && auction.images.length > 0) {
          console.log(`Deleting ${auction.images.length} images for auction`);
          await deleteImagesFromSupabase(auction.images);
        }
      }
      await Auction.deleteMany({ createdBy: userId });

      const projects = await Project.find({ userId: userId });
      for (const project of projects) {
        if (project.images && project.images.length > 0) {
          console.log(`Deleting ${project.images.length} images for project`);
          await deleteImagesFromSupabase(project.images);
        }
      }
      await Project.deleteMany({ userId: userId });
      const ads = await Ad.find({ userId: userId });
      for (const ad of ads) {
        if (ad.images && ad.images.length > 0) {
          console.log(`Deleting ${ad.images.length} images for ad`);
          await deleteImagesFromSupabase(ad.images);
        }
      }
      await Ad.deleteMany({ userId: userId });
    }
    else {
      const properties = await Property.find({ agentId: userId });
      for (const property of properties) {
        if (property.images && property.images.length > 0) {
          console.log(`Deleting ${property.images.length} images for property`);
          await deleteImagesFromSupabase(property.images);
        }
      }
      await Property.deleteMany({ agentId: userId });
      const ads = await Ad.find({ userId: userId });
      for (const ad of ads) {
        if (ad.images && ad.images.length > 0) {
          console.log(`Deleting ${ad.images.length} images for ad`);
          await deleteImagesFromSupabase(ad.images);
        }
      }
      await Ad.deleteMany({ userId: userId });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: 'Account deleted successfully with all associated images',
      success: true
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      message: 'Failed to delete account',
      error: error.message
    });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await User.findById(userId);

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
export const checkUserExists = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'User not found. Please sign up first.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User exists',
      exists: true
    });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getAllProfessionals = async (req, res) => {
  try {
    const { role, page = 1, limit = 12, search } = req.query;

    let query = {
      role: { $in: ['agent', 'architect', 'designer', 'developer', 'contractor', 'project-manager', 'legal', 'plumber', 'electrician', 'painter', 'tiles-master', 'carpenter'] }
    };

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const professionals = await User.find(query)
      .select('_id fullName email role profilePicture phoneNumber createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Calculate average rating for each professional
    const professionalsWithRatings = await Promise.all(
      professionals.map(async (professional) => {
        const reviews = await Review.find({ professionalId: professional._id });
        const averageRating = reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : 0;

        return {
          ...professional.toObject(),
          averageRating: parseFloat(averageRating),
          reviewCount: reviews.length
        };
      })
    );

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      professionals: professionalsWithRatings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get professionals error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getProfessionalById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-firebaseUid -__v');

    if (!user) {
      return res.status(404).json({
        message: 'Professional not found'
      });
    }

    // Get projects created by this user
    const projects = await Project.find({ userId: id })
      .select('_id title description images rating location createdAt')
      .limit(5)
      .sort({ createdAt: -1 });

    // Get ads posted by this user
    const ads = await Ad.find({ userId: id })
      .select('_id title type description images createdAt')
      .limit(5)
      .sort({ createdAt: -1 });

    // Get reviews for this professional from Review model
    const reviews = await Review.find({ professionalId: id })
      .populate('reviewerId', 'fullName profilePicture')
      .sort({ createdAt: -1 });

    // Format reviews to match frontend expectations
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      professionalId: review.professionalId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      reviewerId: review.reviewerId
    }));

    res.status(200).json({
      success: true,
      user,
      projects,
      ads,
      reviews: formattedReviews
    });
  } catch (error) {
    console.error('Get professional by ID error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const saveProfessionalProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { specialization, city, email, website, address, about, mobile, landline, profilePicture, resume } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Delete old resume if updating with a new one
    if (resume && user.resume && user.resume !== resume) {
      console.log('Deleting old resume');
      const { successCount, failureCount } = await deleteImagesFromSupabase([user.resume]);
      console.log(`Resume deletion result - Success: ${successCount}, Failed: ${failureCount}`);
    }
    user.specialization = specialization || user.specialization;
    user.city = city || user.city;
    user.email = email || user.email;
    user.website = website || user.website;
    user.address = address || user.address;
    user.about = about || user.about;
    user.mobile = mobile || user.mobile;
    user.landline = landline || user.landline;

    if (resume) user.resume = resume;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Professional profile saved successfully',
      profile: user
    });
  } catch (error) {
    console.error('Save professional profile error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};