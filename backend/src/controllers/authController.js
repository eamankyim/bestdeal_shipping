const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const { autoSeedIfNeeded } = require('../utils/seedUtils');
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
      active: true, // User is active by default
      emailVerified: true, // Auto-verify emails by default
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

  // Normalize email to lowercase for consistency
  const normalizedEmail = email?.toLowerCase().trim();

  console.log('═══════════════════════════════════════════════');
  console.log('🔐 LOGIN ATTEMPT');
  console.log('═══════════════════════════════════════════════');
  console.log('📧 Email (original):', email);
  console.log('📧 Email (normalized):', normalizedEmail);
  console.log('📋 Password provided:', password ? 'Yes' : 'No');
  console.log('📋 Password length:', password?.length || 0);
  console.log('═══════════════════════════════════════════════');

  // Find user with case-insensitive email search
  console.log('🔍 Searching for user with normalized email:', normalizedEmail);
  console.log('🔍 Using case-insensitive search...');
  
  // Use findMany with case-insensitive mode since Prisma doesn't support case-insensitive findUnique
  const users = await prisma.user.findMany({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      name: true,
      role: true,
      avatarUrl: true,
      warehouseLocation: true, // Include warehouse location
      active: true,
      emailVerified: true,
      createdAt: true,
      lastLogin: true,
    },
    take: 1,
  });
  
  const user = users.length > 0 ? users[0] : null;
  
  if (user) {
    console.log('✅ User found with case-insensitive search');
  }

  if (!user) {
    console.log('❌ USER NOT FOUND');
    console.log('   Searched email (normalized):', normalizedEmail);
    console.log('   Original email:', email);
    console.log('═══════════════════════════════════════════════');
    
    // Try to find any user with similar email for debugging
    const allUsers = await prisma.user.findMany({
      select: { email: true },
      take: 5,
    });
    console.log('📋 Sample emails in database (first 5):');
    allUsers.forEach(u => console.log('   -', u.email));
    
    return sendError(res, 401, 'Invalid email or password');
  }

  console.log('✅ USER FOUND:');
  console.log('   ID:', user.id);
  console.log('   Name:', user.name);
  console.log('   Email in DB:', user.email);
  console.log('   Email match:', user.email.toLowerCase() === normalizedEmail ? '✅ Exact' : '⚠️ Case mismatch');
  console.log('   Role:', user.role);
  console.log('   Active:', user.active);
  console.log('   EmailVerified:', user.emailVerified);
  console.log('   PasswordHash exists:', !!user.passwordHash);
  console.log('   PasswordHash length:', user.passwordHash?.length || 0);
  console.log('   Created:', user.createdAt);
  console.log('   Last Login:', user.lastLogin || 'Never');

  // Check if user is active
  if (!user.active) {
    console.log('❌ USER IS INACTIVE');
    console.log('   Active status:', user.active);
    console.log('═══════════════════════════════════════════════');
    return sendError(res, 403, 'Your account has been deactivated');
  }

  console.log('✅ User is active');

  // Verify password
  console.log('🔐 Verifying password...');
  console.log('   Password provided length:', password?.length || 0);
  console.log('   Stored hash length:', user.passwordHash?.length || 0);
  console.log('   Comparing provided password with stored hash...');
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  console.log('   Password validation result:', isPasswordValid ? '✅ Valid' : '❌ Invalid');

  if (!isPasswordValid) {
    console.log('❌ PASSWORD VALIDATION FAILED');
    console.log('   Password mismatch for:', email);
    console.log('═══════════════════════════════════════════════');
    return sendError(res, 401, 'Invalid email or password');
  }

  console.log('✅ Password validated successfully');

  // Update last login
  console.log('🔄 Updating last login timestamp...');
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });
  console.log('✅ Last login updated');

  // Generate tokens
  console.log('🔑 Generating tokens...');
  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });
  console.log('✅ Tokens generated');
  console.log('   Token length:', token.length);
  console.log('   RefreshToken length:', refreshToken.length);

  // Save refresh token
  console.log('💾 Saving refresh token...');
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });
  console.log('✅ Refresh token saved');

  console.log('═══════════════════════════════════════════════');
  console.log('✅ LOGIN SUCCESSFUL');
  console.log('   User:', user.name);
  console.log('   Role:', user.role);
  console.log('═══════════════════════════════════════════════');

  return sendSuccess(res, 200, 'Login successful', {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      warehouseLocation: user.warehouseLocation || null, // Include warehouse location
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
      warehouseLocation: true, // Include warehouse location
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
  const { email, role, warehouseLocation } = req.body;

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

  // Create invitation (store warehouseLocation if provided)
  const invitation = await prisma.invitation.create({
    data: {
      email,
      role,
      warehouseLocation: warehouseLocation || null, // Store warehouse location
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
  // Use FRONTEND_URL, PRODUCTION_URL, or extract from CORS_ORIGINS, fallback to localhost for development
  let frontendUrl = process.env.FRONTEND_URL;
  
  // If FRONTEND_URL is not set, try PRODUCTION_URL
  if (!frontendUrl && process.env.PRODUCTION_URL) {
    frontendUrl = process.env.PRODUCTION_URL;
  }
  
  // If still not set, try to extract from CORS_ORIGINS (first origin)
  if (!frontendUrl && process.env.CORS_ORIGINS) {
    const corsOrigins = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
    frontendUrl = corsOrigins[0]; // Use first origin
  }
  
  // Final fallback for development
  if (!frontendUrl) {
    frontendUrl = 'http://localhost:3000';
  }
  
  // Ensure URL doesn't have trailing slash
  frontendUrl = frontendUrl.replace(/\/$/, '');
  
  const inviteLink = `${frontendUrl}/accept-invite/${token}`;

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

  console.log('═══════════════════════════════════════════════');
  console.log('🎫 ACCEPT INVITATION PROCESS STARTING');
  console.log('═══════════════════════════════════════════════');
  console.log('📋 Token:', token);
  console.log('📋 Name:', name);
  console.log('📋 Password provided:', password ? 'Yes' : 'No');
  console.log('📋 Password length:', password?.length || 0);
  console.log('═══════════════════════════════════════════════');

  // Find invitation
  console.log('🔍 Searching for invitation with token...');
  const invitation = await prisma.invitation.findFirst({
    where: {
      token,
      status: 'pending',
      expiresAt: { gte: new Date() },
    },
  });

  if (!invitation) {
    console.log('❌ Invitation not found or expired');
    return sendError(res, 400, 'Invalid or expired invitation');
  }

  // Normalize email to lowercase for consistency
  const normalizedEmail = invitation.email?.toLowerCase().trim();

  console.log('✅ Invitation found:');
  console.log('   Email (original):', invitation.email);
  console.log('   Email (normalized):', normalizedEmail);
  console.log('   Role:', invitation.role);
  console.log('   Status:', invitation.status);
  console.log('   Expires:', invitation.expiresAt);

  // Check if user already exists (use normalized email)
  console.log('🔍 Checking if user already exists with normalized email:', normalizedEmail);
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    console.log('❌ User already exists:', existingUser.email);
    console.log('   User ID:', existingUser.id);
    console.log('   User Active:', existingUser.active);
    console.log('   User Verified:', existingUser.emailVerified);
    return sendError(res, 400, 'User already exists');
  }

  console.log('✅ User does not exist, proceeding with creation...');

  // Hash password
  console.log('🔐 Hashing password...');
  const passwordHash = await hashPassword(password);
  console.log('✅ Password hashed successfully');
  console.log('   Hash length:', passwordHash.length);

  // Create user with normalized email
  console.log('👤 Creating user with data:');
  console.log('   Email (normalized):', normalizedEmail);
  console.log('   Name:', name);
  console.log('   Role:', invitation.role);
  console.log('   Active: true');
  console.log('   EmailVerified: true');

  // Create user with warehouseLocation from invitation if provided
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail, // Store email in lowercase
      passwordHash,
      name,
      role: invitation.role,
      warehouseLocation: invitation.warehouseLocation || null, // Set warehouse location from invitation
      active: true, // User is active by default
      emailVerified: true, // Auto-verify emails by default
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      emailVerified: true,
    },
  });

  console.log('✅ User created successfully:');
  console.log('   ID:', user.id);
  console.log('   Email:', user.email);
  console.log('   Name:', user.name);
  console.log('   Role:', user.role);
  console.log('   Active:', user.active);
  console.log('   EmailVerified:', user.emailVerified);

  // Update invitation status
  console.log('🔄 Updating invitation status to accepted...');
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      status: 'accepted',
      acceptedAt: new Date(),
    },
  });
  console.log('✅ Invitation status updated');

  // Generate tokens
  console.log('🔑 Generating tokens...');
  const authToken = generateToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });
  console.log('✅ Tokens generated');

  // Save refresh token
  console.log('💾 Saving refresh token...');
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Refresh token saved');

  console.log('═══════════════════════════════════════════════');
  console.log('✅ ACCOUNT CREATION SUCCESSFUL');
  console.log('═══════════════════════════════════════════════');

  return sendSuccess(res, 201, 'Account created successfully', {
    user,
    token: authToken,
    refreshToken,
  });
});

/**
 * @route   GET /api/auth/invite/:token
 * @desc    Get invitation details by token
 * @access  Public
 */
exports.getInviteByToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Find invitation
  const invitation = await prisma.invitation.findFirst({
    where: {
      token,
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

  if (!invitation) {
    return sendError(res, 404, 'Invitation not found');
  }

  // Check if invitation is expired
  if (new Date(invitation.expiresAt) < new Date()) {
    return sendError(res, 400, 'Invitation has expired');
  }

  // Check if invitation is already accepted
  if (invitation.status === 'accepted') {
    return sendError(res, 400, 'Invitation has already been accepted');
  }

  // Return invitation details (excluding token for security)
  return sendSuccess(res, 200, 'Invitation retrieved successfully', {
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      invitedBy: invitation.inviter?.name || 'Administrator',
    },
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
      warehouseLocation: true, // Include warehouse location
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

  // Auto-seed roles and settings if they don't exist
  const seedResult = await autoSeedIfNeeded();
  if (seedResult.rolesSeeded) {
    console.log('✅ Auto-seeded roles and settings during superadmin creation');
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
 * @route   GET /api/auth/roles
 * @desc    Get all roles with user counts
 * @access  Private (Admin only)
 */
exports.getRoles = asyncHandler(async (req, res) => {
  try {
    // Get all roles
    const roles = await prisma.role.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get user counts by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    // Create a map of role -> user count
    const userCountMap = {};
    usersByRole.forEach(item => {
      userCountMap[item.role] = item._count.id;
    });

    // Attach user counts to roles
    const rolesWithCounts = roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      color: role.color,
      isSystem: role.isSystem,
      userCount: userCountMap[role.name] || 0,
      permissions: role.permissions,
      createdAt: role.createdAt,
    }));

    return sendSuccess(res, 200, 'Roles retrieved successfully', {
      roles: rolesWithCounts,
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    return sendError(res, 500, 'Failed to fetch roles', [error.message]);
  }
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

/**
 * @route   PATCH /api/auth/users/:id
 * @desc    Update user (Admin only - for updating warehouse location, role, etc.)
 * @access  Private (Admin only)
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, warehouseLocation, active } = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    return sendError(res, 404, 'User not found');
  }

  // Build update data
  const updateData = {};
  
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (role !== undefined) updateData.role = role;
  if (warehouseLocation !== undefined) updateData.warehouseLocation = warehouseLocation || null;
  if (active !== undefined) updateData.active = active;

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      warehouseLocation: true,
      active: true,
      emailVerified: true,
      createdAt: true,
      lastLogin: true,
    },
  });

  console.log('✅ User updated successfully:', updatedUser.email);

  return sendSuccess(res, 200, 'User updated successfully', { user: updatedUser });
});


