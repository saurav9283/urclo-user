const bcrypt = require('bcrypt');
const crypto = require('crypto');
const moment = require('moment');
const { getUserByEmail, getUserByPhone, saveUser, checkRegisteredUser, OtpVerify, checkRegisteredUserWithPhone, OtpVerifyPhone, OtpForLogin, findTokenInDatabase, updatePassword, findUserById, LogoutService } = require('../userAuth/auth.service');
const { sendEmail } = require('../../../services/email-service');
const jwt = require('jsonwebtoken');
const { saveResetToken } = require('../../../lib/saveToken');
const { NotificationController } = require('../userNotification/user.notification.controller');
const { notificationService } = require('../userNotification/user.notification.service');
const { name } = require('ejs');
module.exports = {
    register: async (req, res) => {
        try {
            const { name, email, phone, password, provider } = req.body;
            console.log('req.body: ', req.body);

            if (!provider) {
                return res.status(400).json({ msg: "Provider is required" });
            }
            // Validate input
            if (!name || (!email && !phone)) {
                return res.status(400).json({ msg: "All fields are required" });
            }

            const emailExists = await new Promise((resolve, reject) => {
                getUserByEmail(email, (err, result) => {
                    if (err) reject(err);
                    resolve(result && result?.length > 0);
                });
            });

            if (emailExists) {
                return res.status(400).json({ msg: "User already exists with this email" });
            }

            // Check if user exists by phone
            const phoneExists = await new Promise((resolve, reject) => {
                getUserByPhone(phone, (err, result) => {
                    if (err) reject(err);
                    resolve(result && result?.length > 0);
                });
            });

            if (phoneExists) {
                return res.status(400).json({ msg: "User already exists with this phone" });
            }

            // Hash the password
            let hashedPassword;
            if (password) {

                hashedPassword = await bcrypt.hash(password, 10);
            }
            const otp = Math.floor(100000 + Math.random() * 900000);

            let userProvider;
            if (provider === 'email') {
                userProvider = 'email';
            }
            else if (provider === 'phone') {
                userProvider = 'phone';
            }
            else if (provider === 'google') {
                userProvider = 'Google';
            }
            else if (provider === 'Facebook') {
                userProvider = 'Facebook';
            }
            else if (provider === 'Apple') {
                userProvider = 'Apple';
            }
            else {
                return res.status(400).json({ msg: "Invalid provider" });
            }
            // Save the user to the database
            const newUser = {
                name,
                email: email ? email : null,
                phone: phone ? phone : null,
                password: hashedPassword ? hashedPassword : null,
                provider: userProvider,
                otp: otp ? otp : null,
            };

            saveUser(newUser, (err, result) => {
                if (err) {
                    console.error("Error saving user:", err);
                    return res.status(500).json({ msg: "Internal server error" });
                }
                return res.status(201).json({ msg: result });

            });
        } catch (error) {
            console.error("Unexpected error:", error);
            return res.status(500).json({ msg: "Internal server error" });
        }
    },

    verifyEmailOtp: async (req, res) => {
        try {
            const { email, otp } = req.body;

            // Validate input
            if (!email || !otp) {
                return res.status(400).json({ msg: "Email and OTP are required" });
            }

            // Check if user exists by email
            const user = await new Promise((resolve, reject) => {
                getUserByEmail(email, (err, result) => {
                    if (err) reject(err);
                    resolve(result && result.length > 0 ? result[0] : null);
                });
            });

            if (!user) {
                return res.status(404).json({ msg: "User not found" });
            }

            if (user.otp !== otp) {
                return res.status(400).json({ msg: "Invalid OTP" });
            }

            // Update the user's status to verified
            user.isVerified = 1;

            OtpVerify(user, (err, result) => {
                if (err) {
                    console.error("Error saving user:", err);
                    return res.status(500).json({ msg: "Internal server error" });
                }
                return res.status(200).json({ msg: "Email verified successfully" });
            });
        } catch (error) {
            console.error("Unexpected error:", error);
            return res.status(500).json({ msg: "Internal server error" });
        }
    },
    verifyPhoneOtp: async (req, res) => {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ msg: "Phone and OTP are required" });
        }
        const user = await new Promise((resolve, reject) => {
            getUserByPhone(phone, (err, result) => {
                if (err) reject(err);
                resolve(result && result.length > 0 ? result[0] : null);
            });
        });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        if (user?.otp !== otp) {
            return res.status(400).json({ msg: "Invalid OTP" });
        }
        user.isVerified = 1;
        OtpVerifyPhone(user, async (err, result, user_id) => {
            if (err) {
                console.error("Error saving user:", err);
                return res.status(500).json({ msg: "Internal server error" });
            }
            else {
                const tokenPayload = {
                    userId: user.id,
                    phone: user.phone,
                    name: user.name,
                };

                const jwtToken = jwt.sign(tokenPayload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
                await notificationService(user.id, user.name);
                return res.status(200).json({ msg: "Phone verified successfully", user_id: user.id, token: jwtToken,name:user.name });
            }
        });
    },
    resendEmailOtp: async (req, res) => {
        try {
            const { email } = req.body;

            // Validate input
            if (!email) {
                return res.status(400).json({ msg: "Email is required" });
            }

            // Check if user exists by email
            const user = await new Promise((resolve, reject) => {
                getUserByEmail(email, (err, result) => {
                    if (err) reject(err);
                    resolve(result && result.length > 0 ? result[0] : null);
                });
            });


            // Generate new OTP
            const otp = Math.floor(100000 + Math.random() * 900000);

            // Save the new OTP
            user.otp = otp;

            checkRegisteredUser(user, (err, result) => {
                if (err) {
                    console.error("Error saving user:", err);
                    return res.status(500).json({ msg: "Internal server error" });
                }
                const payload = {
                    from: process.env.MAIL_SENDER_EMAIL,
                    to: email,
                    subject: 'OTP for email verification',
                    template: `emailotp.ejs`,
                    data: {
                        name: user.name,
                        otp: otp,
                    },
                }
                sendEmail(payload)
                    .then(info => {
                        return res.status(200).json({ msg: "OTP re-sent successfully" });
                    })
                    .catch(error => {
                        console.error("Error sending email:", error);
                        return res.status(400).json({ msg: "Error sending email:" });
                    });
            });
        } catch (error) {
            console.error("Unexpected error:", error);
            return res.status(500).json({ msg: "Internal server error" });
        }
    },
    resendPhoneOtp: async (req, res) => {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ msg: "Phone is required" });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        user.otp = otp;
        await new Promise((resolve, reject) => {
            checkRegisteredUserWithPhone(user, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
        return res.status(200).json({ msg: "OTP re-sent successfully" });

    },
    login: async (req, res) => {
        try {
            const { email, password, phone, otp } = req.body;
            console.log('req.body: ', req.body);
            if (!phone) {
                if (!email || !password) {
                    return res.status(400).json({ msg: "Email and password are required" });
                }
            }
            if (phone) {
                // if(!otp)
                // {
                //     return res.status(400).json({ msg: "Phone and OTP are required" });
                // }
                const user = await new Promise((resolve, reject) => {
                    getUserByPhone(phone, (err, result) => {
                        if (err) {
                            console.error("Error getting user:", err);
                            return reject(err);
                        }
                        console.log(result.length, "result.length")
                        resolve(result && result.length > 0 ? result[0] : null);
                    });
                });
                console.log(user, "=-=")
                if (!user) {
                    return res.status(404).json({ msg: "User not found" });
                }
                if (!user.isVerified) {
                    return res.status(400).json({ msg: "Your phone number is not verified" });
                }
                const newotp = Math.floor(100000 + Math.random() * 900000);

                const newPlayload = {
                    phone: phone,
                    otp: newotp,
                }
                console.log(newPlayload)
                OtpForLogin(newPlayload, async (err, result) => {
                    if (err) {
                        console.error("Error saving user:", err);
                        return res.status(500).json({ msg: "Internal server error" });
                    }
                    else {
                        
                        return res.status(201).json({ msg: "OTP sent successfully"});
                    }

                })

            }
            else {
                const user = await new Promise((resolve, reject) => {
                    getUserByEmail(email, (err, result) => {
                        // console.log('result: ', result[0]?.id);
                        if (err) return reject(err);
                        resolve(result && result.length > 0 ? result[0] : null);
                    });
                });

                if (!user) {
                    return res.status(404).json({ msg: "User notttt found" });
                }
                if (!user.isVerified) {
                    return res.status(400).json({ msg: "Your email ID is not verified" });
                }
                const passwordMatch = await bcrypt.compare(password, user.password);
                if (!passwordMatch) {
                    return res.status(400).json({ msg: "Invalid password" });
                }
                else {
                    const tokenPayload = {
                        userId: user.id,
                        email: user.email,
                        name: user.name,
                    };
                    const jwtToken = jwt.sign(tokenPayload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

                    await notificationService(user.id, user.name);

                    return res.status(201).json({ msg: "Login successful", user_id: user.id, token: jwtToken,name:user.name });
                }
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            return res.status(500).json({ msg: "Internal server error" });
        }
    },
    forgotPassword: async (req, res) => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ msg: "Email is required" });
        }
        const user = await new Promise((resolve, reject) => {
            getUserByEmail(email, (err, result) => {
                if (err) return reject(err);
                resolve(result && result.length > 0 ? result[0] : null);
            });
        });
        console.log('user: ', user);
        if (!user) {
            return res.status(400).json({ msg: "You are not registered with this email yet!" });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        console.log('resetToken: ', resetToken);
        const tokenExpiry = moment().add(1, 'hours').format('YYYY-MM-DD HH:mm:ss');
        const iat = moment().unix();

        const tokenPayload = {
            resetToken: resetToken,
            email: email,
            expiry: tokenExpiry,
            iat: iat,
            userId: user.id,
        }
        // console.log(process.env.JWT_SECRET_KEY, "process")
        const jwtToken = jwt.sign(tokenPayload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        const resetLink = `http://localhost:3000/login/reset-password?token=${encodeURIComponent(jwtToken)}`;

        const payload = {
            from: process.env.MAIL_SENDER_EMAIL,
            to: user.email,
            subject: '[URCLO] Password Reset E-mail',
            template: `forgotpassword.ejs`,
            data: {
                name: user.name,
                resetLink,
            },
        };
        const currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');

        // console.log(payload, "payload=-=-");
        await saveResetToken(user.id, jwtToken, tokenExpiry, iat, currentDateTime);
        await sendEmail(payload);
        return res.status(200).json({ msg: "Password reset link sent successfully" });
    },
    resetPassword: async (req, res) => {
        const { token } = req.query;
        const { password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ msg: "Token and new password are required." });
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            console.log('Decoded Token:', decoded);
            const { email, userId } = decoded;
            console.log('userId: ', userId);
            const hashedPassword = await bcrypt.hash(password, 10);
            await updatePassword(userId, hashedPassword);
            return res.status(200).json({ msg: "Password reset successful" });
        } catch (error) {
            console.log('error: ', error);
            return res.status(500).json({ msg: "Internal server error" });
        }
    },
    LogoutController: async (req, res) => {
        const { user_id, type } = req.body;
        // console.log('user_id: ', user_id);
        // console.log('type: ', type);
        if (!user_id) {
            return res.status(400).json({ msg: "User ID is required" });
        }
        if (!type) {
            return res.status(400).json({ msg: "Type is required" });
        }
        LogoutService(user_id, type, (err, result) => {
            if (err) {
                console.error("Error saving user:", err);
                return res.status(500).json({ msg: "Internal server error" });
            }
            return res.status(200).json({ msg: "Logout successful" });
        });
    },
};
