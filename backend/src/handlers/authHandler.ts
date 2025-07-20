import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../models/Users'
import { logger } from '../utils/logger'
import {
  authRegisterDuration,
  authLoginDuration,
  authGetUserDuration,
} from '../utils/metrics'

export const register = async (req: any, res: any) => {
  const endTimer = authRegisterDuration.startTimer()
  const { name, email, password, role, handle, region } = req.body

  logger.info({ name, email, handle, role, region }, 'Auth:Register start')
  logger.debug('Register payload:', req.body)

  try {
    logger.debug('Checking for existing email…')
    const existingEmail = await User.findOne({ email })
    if (existingEmail) {
      logger.warn({ email }, 'Auth:Register email in use')
      endTimer({ status: 'error' })
      return res.status(400).json({ message: 'User already exists' })
    }

    logger.debug('Checking for existing handle…')
    const existingHandle = await User.findOne({ handle })
    if (existingHandle) {
      logger.warn({ handle }, 'Auth:Register handle in use')
      endTimer({ status: 'error' })
      return res.status(400).json({ message: 'Handle already in use' })
    }

    logger.debug('Generating salt and hashing password…')
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    logger.debug('Password hashed')

    logger.debug('Creating user document…')
    const user = new User({
      handle,
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      region,
    })
    await user.save()
    logger.debug({ userId: user._id }, 'User saved to DB')

    logger.debug('Signing JWT token…')
    const payload = { id: user._id, role: user.role }
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: '24h',
    })
    logger.debug('JWT created', token)

    endTimer({ status: 'success' })
    logger.info({ userId: user._id }, 'Auth:Register success')
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        handle: user.handle,
        name: user.name,
        email: user.email,
        role: user.role,
        region: user.region,
      },
    })
  } catch (error) {
    endTimer({ status: 'error' })
    logger.error({ err: error }, 'Auth:Register error')
    return res.status(500).json({ message: 'Error registering user' })
  }
}

export const login = async (req: any, res: any) => {
  const endTimer = authLoginDuration.startTimer()
  const { email, password } = req.body

  logger.info({ email }, 'Auth:Login start')
  logger.debug('Login payload:', req.body)

  if (!process.env.JWT_SECRET) {
    logger.error('Auth:Login missing JWT_SECRET')
    endTimer({ status: 'error' })
    return res
      .status(500)
      .json({ message: 'Server misconfiguration: JWT secret missing' })
  }

  try {
    logger.debug('Looking up user by email…')
    const user = await User.findOne({ email })
    if (!user) {
      logger.warn({ email }, 'Auth:Login user not found')
      endTimer({ status: 'error' })
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    logger.debug('Comparing passwords…')
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      logger.warn({ email }, 'Auth:Login wrong password')
      endTimer({ status: 'error' })
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    logger.debug('Password match, signing token…')
    const payload = { id: user._id, role: user.role }
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: '24h',
    })
    logger.debug('JWT created', token)

    endTimer({ status: 'success' })
    logger.info({ userId: user._id }, 'Auth:Login success')
    return res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    })
  } catch (error) {
    endTimer({ status: 'error' })
    logger.error({ err: error }, 'Auth:Login error')
    return res.status(500).json({ message: 'Error logging in' })
  }
}

export const getCurrentUser = async (req: any, res: any) => {
  const endTimer = authGetUserDuration.startTimer()
  const userId = req.user.id

  logger.info({ userId }, 'Auth:GetCurrentUser start')
  logger.debug('Fetching user from DB…')

  try {
    const user = await User.findById(userId).select('-password')
    logger.debug('User fetched:', user)

    endTimer({ status: 'success' })
    logger.info({ userId }, 'Auth:GetCurrentUser success')
    return res.status(200).json(user)
  } catch (error) {
    endTimer({ status: 'error' })
    logger.error({ err: error }, 'Auth:GetCurrentUser error')
    return res.status(500).json({ message: 'Error fetching current user' })
  }
}
