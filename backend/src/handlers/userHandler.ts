import User from '../models/Users'
import bcrypt from 'bcryptjs'

const getUsers = async (req: any, res: any) => {
    try {
        const users = await User.find().select('-password')
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' })
    }
}

const getUserById = async (req: any, res: any) => {
    try {
        const user = await User.findById(req.params.id).select('-password')

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' })
        }

        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user' })
    }
}


const createUser = async (req: any, res: any) => {
    try {
        const { name, email, password, role } = req.body

        let user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({ message: 'User already exists' })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        
        user = new User({ name, email, password: hashedPassword, role: role || 'user' })
        await user.save();

        res.status(201).json({ message: 'User created successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' })
    }
}

const updateUser = async (req: any, res: any) => {
    try {
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'No autorizado para editar este usuario' });
        }

        const { name, email, password, role } = req.body

        const userFields: any = {};
        if (name) userFields.name = name;
        if (email) userFields.email = email;

        if (role && req.user.role === 'admin') {
            userFields.role = role;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)
            userFields.password = hashedPassword
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: userFields },
            { new: true }
        ).select('-password')

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' })
    }
}

const deleteUser = async (req: any, res: any) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        await User.findByIdAndDelete(req.params.id)

        res.status(200).json({ message: 'User deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' })
    }
}

export { getUsers, getUserById, createUser, updateUser, deleteUser };