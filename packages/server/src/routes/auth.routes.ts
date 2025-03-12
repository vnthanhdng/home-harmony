import {Router, Request, Response} from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import {body, validationResult} from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

const isValidPhone = (phone: string) => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
}

//Validation middleware
const registerValidation = [
    body('username')
        .isLength({min: 3, max: 30})
        .withMessage('Username must be between 3 and 30 characters')
        .isAlphanumeric()
        .withMessage('Username must be alphanumeric')
        .trim(),
    body('password')
        .isLength({min: 8})
        .withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain an uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain a lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain a number'),
    body('email').custom((value, {req}) => {
        if (!value && !req.body.phone) {
            throw new Error('Email or phone is required');
        }

        if (value && !isValidEmail(value)) {
            throw new Error('Please provide a valid email address');
        }

        return true;
    }),

    body('phone').custom((value, {req}) => {
        if (value && !isValidPhone(value)) {
            throw new Error('Please provide a valid phone number');
        }

        return true;
    }),
];

//Register a new user
router.post('/register', [...registerValidation], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array() });
        }

        const {username, email, phone, password} = req.body;

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    email ? {email} : {},
                    phone ? {phone} : {},
                    {username}
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({message: 'User with this email, phone number, or username already exists'});
        }

        //Hash pw
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        //for now, just log it
        //in real case, would send this via email or sms
        console.log(`Verification code for ${email || phone}: ${verificationCode}`)

        const newUser = await prisma.user.create({
            data: {
                username,
                email: email || null,
                phone: phone || null,
                password: hashedPassword,
            }
        });

        // create jwt token
        const token = jwt.sign(
            { id: newUser.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } as SignOptions
        );

        return res.status(201).json({
            message: 'User registered successfully. Please verify your email/phone.',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                phone: newUser.phone,
                createdAt: newUser.createdAt
            },
            token,
            verificationCode
        });
    } catch (error) {
        console.log('Registration error: ', error);
        return res.status(500).json({message: 'Server error during registration'});
    }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
    try {
        const {username, email, phone, password} = req.body;

        if (!username && !email && !phone) {
            return res.status(400).json({message: 'Please provide username, email, or phone number'});
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    username ? {username} : {},
                    email ? {email} : {},
                    phone ? {phone} : {}
                ]
            }
        });

        if (!user) {
            return res.status(401).json({message: 'Invalid credentials'});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({message: 'Invalid credentials'});
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } as SignOptions
        );

        return res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                createdAt: user.createdAt
            },
            token
        });
    } catch (error) {
        console.log('Login error: ', error);
        return res.status(500).json({message: 'Server error during login'});
    }
});

router.post('/verify', async (req: Request, res: Response) => {
    try {
        const {userId, code} = req.body;

        if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
            return res.status(400).json({message: 'Invalid verification code'});
        }
        
        const user = await prisma.user.findUnique({
            where: {id: userId}
        });

        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        return res.json({
            message: 'Verification successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.log('Verification error: ', error);
        return res.status(500).json({message: 'Server error during verification'});
    }
});

export default router;