import User from '../models/user.model.js';
import supabase from '../config/supabase.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const { data: { user: supabaseUser }, error: supabaseError } = await supabase.auth.getUser(token);

    if (supabaseError || !supabaseUser) {
      return res.status(401).json({
        message: 'Invalid or expired token'
      });
    }

    const user = await User.findOne({ supabaseUid: supabaseUser.id });

    if (!user) {
      return res.status(401).json({
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: 'User account has been deactivated'
      });
    }

    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      companyId: user.companyId
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};