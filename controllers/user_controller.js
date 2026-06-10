import userModel from  '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

async function userRegister(req, res) {
    if(!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try{
        const {username, email, password} = req.body;
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = new userModel({
            username,
            email,
            password: hashedPassword
        });
        await user.save();
        return res.status(201).json({ message: "User registered successfully" });
    }catch(err) {
        console.log("Error while registering user")
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function userLogin(req, res) {
    const {email,password} = req.body;
    if(!email || !password) {
        return res.status(400).json({message: "All fields are required"})
    }
    try{
        console.log(email, password);
        const user = await userModel.findOne({ email: email });
        if(!user) {
            return res.status(404).json({message: "User not found"})
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(401).json({message: "Invalid password"})
        }
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        return res.status(200).json({
            message: "User logged in successfully",
            token: token,
            userId: user._id,
            username: user.username
        });
    }catch(err) {
        console.log("Error while logging in user")
        return res.status(500).json({message: "Internal server error"})
    }
}

export { userRegister, userLogin };