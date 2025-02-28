const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure 'uploads' folder exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

/**
 * @route GET /
 * @desc Fetch users and render the index page
 */
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        const message = req.session.message || null;
        req.session.message = null; // Clear session message after showing it

        res.render('index', { 
            title: 'Home Page', 
            users: users, 
            message: message 
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});
/**
 * @route GET /about
 * @desc Render the About page
 */
router.get('/about', (req, res) => {
    res.render('about', { title: 'About Us' });
});

/**
 * @route GET /contact
 * @desc Render the Contact page
 */
router.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact Us' });
});

/**
 * @route GET /add
 * @desc Render the Add User page
 */
router.get('/add', (req, res) => {
    res.render('user', { title: 'Add User', message: req.session.message });
});

/**
 * @route POST /add
 * @desc Add a new user
 */
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (!name || !email || !phone) {
            req.session.message = {
                type: 'danger',
                message: 'All fields are required!',
            };
            return res.redirect('/add');
        }

        const user = new User({
            name,
            email,
            phone,
            image: req.file ? req.file.filename : null,
        });

        await user.save();

        req.session.message = {
            type: 'success',
            message: 'User added successfully!',
        };

        res.redirect('/');
    } catch (err) {
        req.session.message = {
            type: 'danger',
            message: err.message,
        };
        res.redirect('/add');
    }
});

/**
 * @route GET /edit/:id
 * @desc Render Edit User page
 */
router.get('/edit/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            req.session.message = {
                type: 'danger',
                message: 'User not found!',
            };
            return res.redirect('/');
        }

        res.render('edit_users', { 
            title: 'Edit User', 
            user: user,
            message: req.session.message || null
        });

        req.session.message = null; // Clear message after showing
    } catch (err) {
        console.error("Error fetching user:", err);
        res.redirect('/');
    }
});

/**
 * @route POST /edit/:id
 * @desc Update User & Redirect to Home
 */
router.post('/edit/:id', upload.single('image'), async (req, res) => {
    try {
        let id = req.params.id;
        const { name, email, phone } = req.body;

        let updateData = { name, email, phone };

        if (req.file) {
            const user = await User.findById(id);

            // Delete old image if exists
            if (user && user.image) {
                const oldImagePath = path.join(uploadDir, user.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            updateData.image = req.file.filename; // Save new image
        }

        await User.findByIdAndUpdate(id, updateData);

        req.session.message = {
            type: 'success',
            message: 'User updated successfully!',
        };

        res.redirect('/'); // Redirect to home page after edit
    } catch (err) {
        console.error("Error updating user:", err);
        req.session.message = {
            type: 'danger',
            message: 'Failed to update user!',
        };
        res.redirect('/edit/' + req.params.id);
    }
});

/**
 * @route GET /delete/:id
 * @desc Delete User
 */
router.get('/delete/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            req.session.message = {
                type: 'danger',
                message: 'User not found!',
            };
            return res.redirect('/');
        }

        // Delete user image if exists
        if (user.image) {
            const imagePath = path.join(uploadDir, user.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await User.findByIdAndDelete(id);

        req.session.message = {
            type: 'success',
            message: 'User deleted successfully!',
        };

        res.redirect('/');
    } catch (err) {
        console.error("Error deleting user:", err);
        req.session.message = {
            type: 'danger',
            message: 'Failed to delete user!',
        };
        res.redirect('/');
    }
});

module.exports = router;
