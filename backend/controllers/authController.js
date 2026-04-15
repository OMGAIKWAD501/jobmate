const User = require('../models/User');
const Worker = require('../models/Worker');
const jwt = require('jsonwebtoken');

// ✅ REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password, role });
    await user.save();

    if (role === 'worker') {
      const worker = new Worker({ user: user._id, skills: [] });
      await worker.save();
    }

    res.status(201).json({
      message: 'User registered successfully',
      user
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // ✅ SESSION SAVE
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let workerDetails = null;
    if (user.role === 'worker') {
      workerDetails = await Worker.findOne({ user: user._id });
    }

    res.json({
      user,
      workerDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ UPDATE LOCATION
exports.updateMyLocation = async (req, res) => {
  try {
    res.json({
      message: "Location updated successfully"
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};