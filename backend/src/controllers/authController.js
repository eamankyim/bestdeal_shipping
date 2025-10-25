const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const crypto = require('crypto');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (with invitation token) or Admin
 */
exports.register = asyncHandler(async (req, res) => {
  const { email, password, name, role = 'user' } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return sendError(res, 400, 'User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  // Save refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return sendSuccess(res, 201, 'User registered successfully', {
    user,
    token,
    refreshToken,
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 Login attempt for:', email);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('❌ User not found:', email);
    return sendError(res, 401, 'Invalid email or password');
  }

  console.log('✅ User found:', user.name);

  // Check if user is active
  if (!user.active) {
    console.log('❌ User inactive:', email);
    return sendError(res, 403, 'Your account has been deactivated');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    console.log('❌ Invalid password for:', email);
    return sendError(res, 401, 'Invalid email or password');
  }

  console.log('✅ Password validated for:', email);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Generate tokens
  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  console.log('🔑 Tokens generated for:', email);

  // Save refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  console.log('✅ Login successful for:', user.name, '| Role:', user.role);

  return sendSuccess(res, 200, 'Login successful', {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    token,
    refreshToken,
  });
});

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, 400, 'Refresh token is required');
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Check if refresh token exists in database
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken,
      userId: decoded.id,
      revoked: false,
      expiresAt: { gte: new Date() },
    },
  });

  if (!storedToken) {
    return sendError(res, 401, 'Invalid or expired refresh token');
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
    },
  });

  if (!user || !user.active) {
    return sendError(res, 401, 'User not found or inactive');
  }

  // Generate new tokens
  const newToken = generateToken({ id: user.id, email: user.email, role: user.role });
  const newRefreshToken = generateRefreshToken({ id: user.id });

  // Revoke old refresh token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  // Save new refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return sendSuccess(res, 200, 'Token refreshed successfully', {
    token: newToken,
    refreshToken: newRefreshToken,
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Revoke refresh token
    await prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId: req.user.id,
      },
      data: { revoked: true },
    });
  }

  return sendSuccess(res, 200, 'Logged out successfully');
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
exports.getCurrentUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      phone: true,
      active: true,
      emailVerified: true,
      createdAt: true,
      lastLogin: true,
    },
  });

  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  return sendSuccess(res, 200, 'User retrieved successfully', { user });
});

/**
 * @route   POST /api/auth/send-invite
 * @desc    Send invitation to new user
 * @access  Admin
 */
exports.sendInvite = asyncHandler(async (req, res) => {
  const { email, role } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return sendError(res, 400, 'User with this email already exists');
  }

  // Check for pending invitation
  const pendingInvite = await prisma.invitation.findFirst({
    where: {
      email,
      status: 'pending',
      expiresAt: { gte: new Date() },
    },
  });

  if (pendingInvite) {
    return sendError(res, 400, 'Invitation already sent to this email');
  }

  // Generate invitation token
  const token = crypto.randomBytes(32).toString('hex');

  // Create invitation
  const invitation = await prisma.invitation.create({
    data: {
      email,
      role,
      invitedBy: req.user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    include: {
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // TODO: Send email with invitation link
  const inviteLink = `${process.env.FRONTEND_URL}/accept-invite/${token}`;

  return sendSuccess(res, 201, 'Invitation sent successfully', {
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      inviteLink,
      expiresAt: invitation.expiresAt,
    },
  });
});

/**
 * @route   POST /api/auth/accept-invite/:token
 * @desc    Accept invitation and create account
 * @access  Public
 */
exports.acceptInvite = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, name } = req.body;

  // Find invitation
  const invitation = await prisma.invitation.findFirst({
    where: {
      token,
      status: 'pending',
      expiresAt: { gte: new Date() },
    },
  });

  if (!invitation) {
    return sendError(res, 400, 'Invalid or expired invitation');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: invitation.email },
  });

  if (existingUser) {
    return sendError(res, 400, 'User already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: invitation.email,
      passwordHash,
      name,
      role: invitation.role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  // Update invitation status
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      status: 'accepted',
      acceptedAt: new Date(),
    },
  });

  // Generate tokens
  const authToken = generateToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  // Save refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return sendSuccess(res, 201, 'Account created successfully', {
    user,
    token: authToken,
    refreshToken,
  });
});

/**
 * @route   GET /api/auth/invitations
 * @desc    Get all invitations (Admin only)
 * @access  Admin
 */
exports.getInvitations = asyncHandler(async (req, res) => {
  const { status, limit = 100, skip = 0 } = req.query;

  // Build where clause
  const where = {};
  if (status) {
    where.status = status;
  }

  // Fetch invitations
  const invitations = await prisma.invitation.findMany({
    where,
    take: parseInt(limit),
    skip: parseInt(skip),
    include: {
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get total count
  const total = await prisma.invitation.count({ where });

  return sendSuccess(res, 200, 'Invitations retrieved successfully', {
    invitations,
    total,
    limit: parseInt(limit),
    skip: parseInt(skip),
  });
});

/**
 * @route   GET /api/auth/users
 * @desc    Get all users/team members (Admin only)
 * @access  Admin
 */
exports.getUsers = asyncHandler(async (req, res) => {
  const { role, status, limit = 100, skip = 0 } = req.query;

  // Build where clause
  const where = {};
  if (role) {
    where.role = role;
  }
  if (status) {
    // Map status to active boolean (database uses active, not status)
    where.active = status === 'active';
  }

  // Fetch users
  const rawUsers = await prisma.user.findMany({
    where,
    take: parseInt(limit),
    skip: parseInt(skip),
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      active: true,
      emailVerified: true,
      createdAt: true,
      lastLogin: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Transform data to include status
  const users = rawUsers.map(user => ({
    ...user,
    status: user.active ? 'active' : 'inactive',
  }));

  // Get total count
  const total = await prisma.user.count({ where });

  return sendSuccess(res, 200, 'Users retrieved successfully', {
    users,
    total,
    limit: parseInt(limit),
    skip: parseInt(skip),
  });
});

/**
 * @route   POST /api/auth/create-superadmin
 * @desc    Create first superadmin (only if no admin exists)
 * @access  Public (one-time only)
 */
exports.createSuperAdmin = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Check if any admin or superadmin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { role: 'admin' },
        { role: 'superadmin' },
      ],
    },
  });

  if (existingAdmin) {
    return sendError(res, 403, 'Superadmin already exists. This endpoint is disabled.');
  }

  // Check if user with email exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return sendError(res, 400, 'User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create superadmin
  const superadmin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: 'superadmin',
      active: true,
      emailVerified: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const token = generateToken({ id: superadmin.id, email: superadmin.email, role: superadmin.role });
  const refreshToken = generateRefreshToken({ id: superadmin.id });

  // Save refresh token
  await prisma.refreshToken.create({
    data: {
      userId: superadmin.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  console.log('✅ Superadmin created successfully:', superadmin.email);

  return sendSuccess(res, 201, 'Superadmin created successfully', {
    user: superadmin,
    token,
    refreshToken,
  });
});

/**
 * @route   PATCH /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!currentPassword || !newPassword) {
    return sendError(res, 400, 'Current password and new password are required');
  }

  if (newPassword.length < 6) {
    return sendError(res, 400, 'New password must be at least 6 characters long');
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);

  if (!isPasswordValid) {
    return sendError(res, 401, 'Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
    },
  });

  // Revoke all existing refresh tokens for security
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revoked: false,
    },
    data: {
      revoked: true,
    },
  });

  console.log('✅ Password changed successfully for:', user.email);

  return sendSuccess(res, 200, 'Password changed successfully. Please login again with your new password.');
});

/**
 * @route   PATCH /api/auth/update-profile
 * @desc    Update user profile (name, phone, avatar)
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatarData } = req.body;
  const userId = req.user.id;

  // Build update data
  const updateData = {};
  
  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  
  // Handle avatar upload (base64 image data stored as URL in database)
  if (avatarData) {
    updateData.avatarUrl = avatarData; // Store base64 data URL directly
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      avatarUrl: true,
      active: true,
      emailVerified: true,
      createdAt: true,
      lastLogin: true,
    },
  });

  console.log('✅ Profile updated successfully for:', updatedUser.email);

  return sendSuccess(res, 200, 'Profile updated successfully', { user: updatedUser });
});


