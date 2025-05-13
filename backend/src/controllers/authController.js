const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateResetToken } = require("../utils/generateToken");
const { sendEmail } = require("../utils/sendEmail");

/**
 * Generate JWT token with user credentials
 * @param {string} id - User ID
 * @param {string} name - User name
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (id, name, role) => {
  return jwt.sign({ id, name, role }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, phoneNumber } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: req.t("auth.userExists"),
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "user", // Default to user if role not provided
      department: department,
      phoneNumber: phoneNumber,
    });

    // Generate token
    const token = generateToken(user._id, user.name, user.role);

    // Set token in HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24h
    });

    // Return user data without password
    res.status(201).json({
      success: true,
      message: req.t("auth.registerSuccess"),
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: req.t("auth.serverConnectError"),
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: req.t("auth.provideBoth"),
      });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: req.t("auth.invalidCredentials"),
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: req.t("auth.invalidCredentials"),
      });
    }

    // Generate token
    const token = generateToken(user._id, user.name, user.role);

    // Set token in HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Return user data without password
    res.status(200).json({
      success: true,
      message: req.t("auth.loginSuccess"),
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: req.t("auth.serverConnectError"),
      error: error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        phoneNumber: user.phoneNumber,
        department: user.department,
        borrowedBooks: user.borrowedBooks,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: req.t("auth.provideEmail"),
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: req.t("auth.resetPasswordEmailSent"),
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();

    // Set token and expiration in database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Get the base URL from request
    const protocol = req.protocol;
    const host = req.get("host");

    // Handle temp-mail and other services that might append their domain to the link
    // Create reset URL with absolute path
    const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}`;

    // Create a note in the email about temp-mail services
    const tempMailNote =
      "Note: If you're using a temporary email service, please copy and paste the entire link into your browser if clicking doesn't work.";

    // Create email content
    const emailOptions = {
      to: user.email,
      subject: req.t("auth.resetPasswordSubject"),
      text: `${req.t("auth.resetPasswordText")}\n\n${resetUrl}\n\n${req.t("auth.resetPasswordExpiry")}\n\n${tempMailNote}`,
      html: `
        <p>${req.t("auth.resetPasswordText")}</p>
        <p><a href="${resetUrl}">${req.t("auth.resetPasswordLink")}</a></p>
        <p>${req.t("auth.resetPasswordExpiry")}</p>
        <p><small><em>${tempMailNote}</em></small></p>
      `,
    };

    // Send email
    await sendEmail(emailOptions);

    // Return success message
    res.status(200).json({
      success: true,
      message: req.t("auth.resetPasswordEmailSent"),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: req.t("auth.serverConnectError"),
      error: error.message,
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: req.t("auth.provideTokenAndPassword"),
      });
    }

    // Find user by token and check if expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: req.t("auth.invalidOrExpiredToken"),
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: req.t("auth.passwordMinLength"),
      });
    }

    // Set new password
    user.password = newPassword;

    // Clear reset token fields
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // Save the user
    await user.save();

    // Return success message
    res.status(200).json({
      success: true,
      message: req.t("auth.passwordResetSuccess"),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: req.t("auth.serverConnectError"),
      error: error.message,
    });
  }
};
