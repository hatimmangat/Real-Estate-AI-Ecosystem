import User from '../models/user.model.js';
import AdminRegistration from '../models/adminRegistration.model.js';
import supabase from '../config/supabase.js';

export const checkAdminRegistration = async (req, res) => {
  try {
    let adminReg = await AdminRegistration.findOne();
    
    if (!adminReg) {
      adminReg = await AdminRegistration.create({
        trackingNumber: 0,
        maxAdmins: 1,
        adminCount: 0
      });
    }

    res.status(200).json({
      canRegister: adminReg.trackingNumber === 0,
      trackingNumber: adminReg.trackingNumber,
      adminCount: adminReg.adminCount,
      maxAdmins: adminReg.maxAdmins
    });
  } catch (error) {
    console.error('Check admin registration error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const adminSignup = async (req, res) => {
  const { name, email, password, profilePicture, supabaseUid, supabaseToken } = req.body;

  const rollbackSupabase = async () => {
    if (supabaseUid) {
      try {
        await supabase.auth.admin.deleteUser(supabaseUid);
        console.log(`Successfully deleted orphaned Supabase admin: ${supabaseUid}`);
      } catch (deleteError) {
        console.error(`Failed to delete orphaned Supabase admin ${supabaseUid}:`, deleteError);
      }
    }
  };

  try {
    if (/^\d/.test(name)) {
      await rollbackSupabase();
      return res.status(400).json({
        message: 'Name cannot start with a digit'
      });
    }

    if (!profilePicture) {
      await rollbackSupabase();
      return res.status(400).json({
        message: 'Profile picture is required'
      });
    }

    if (!supabaseUid) {
      return res.status(400).json({
        message: 'Supabase UID required'
      });
    }

    let adminReg = await AdminRegistration.findOne();
    if (!adminReg) {
      adminReg = await AdminRegistration.create({
        trackingNumber: 0,
        maxAdmins: 1,
        adminCount: 0
      });
    }

    if (adminReg.trackingNumber !== 0) {
      await rollbackSupabase();
      return res.status(403).json({
        message: 'Admin registration is closed. Maximum admins reached.'
      });
    }

    try {
      const { data: { user: supabaseUser }, error } = await supabase.auth.admin.getUserById(supabaseUid);
      if (error || !supabaseUser || supabaseUser.id !== supabaseUid) {
        await rollbackSupabase();
        return res.status(401).json({
          message: 'Invalid Supabase user ID'
        });
      }
    } catch (error) {
      await rollbackSupabase();
      return res.status(401).json({
        message: 'Invalid Supabase user ID',
        error: error.message
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await rollbackSupabase();
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      fullName: name,
      email,
      profilePicture,
      supabaseUid,
      role: 'admin'
    });

    adminReg.trackingNumber = 1;
    adminReg.adminCount = 1;
    await adminReg.save();

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully. Please verify your email.',
      email: user.email
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    await rollbackSupabase();
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { supabaseToken, supabaseUid } = req.body;

    if (!supabaseToken || !supabaseUid) {
      return res.status(400).json({
        message: 'Supabase authentication required'
      });
    }

    let decodedToken;
    try {
      const { data: { user }, error } = await supabase.auth.getUser(supabaseToken);
      if (error || !user || user.id !== supabaseUid) {
        return res.status(401).json({
          message: 'Invalid Supabase token'
        });
      }
    } catch (error) {
      return res.status(401).json({
        message: 'Invalid Supabase token',
        error: error.message
      });
    }

    const user = await User.findOne({ supabaseUid, role: 'admin' });
    if (!user) {
      return res.status(404).json({
        message: 'Admin not found. Please sign up first.'
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
    console.error('Admin login error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-supabaseUid').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getUserStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const regularUsers = await User.countDocuments({ role: 'user' });
    const agents = await User.countDocuments({ role: 'agent' });

    res.status(200).json({
      success: true,
      statistics: {
        totalUsers,
        regularUsers,
        agents
      }
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
