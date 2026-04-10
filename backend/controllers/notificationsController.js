const Notification = require('../models/Notification');
const User = require('../models/User');
const socketService = require('../services/socketService');

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments({ recipient: req.user.id });

    res.status(200).json({
      success: true,
      data: notifications,
      total,
      hasMore: page * limit < total
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

// @desc    Mark a specific notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Accept direct hire request notification
// @route   PUT /api/notifications/:id/accept-hire
// @access  Private (worker recipient)
exports.acceptDirectHireRequest = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
      type: 'direct_hire_request'
    });

    if (!notification) {
      return res.status(404).json({ message: 'Direct hire request not found' });
    }

    if (notification.actionStatus === 'accepted') {
      return res.status(400).json({ message: 'Request already accepted' });
    }

    notification.actionStatus = 'accepted';
    notification.read = true;
    await notification.save();

    if (notification.sender) {
      const workerUser = await User.findById(req.user.id).select('name');
      const customerNotification = await Notification.create({
        recipient: notification.sender,
        sender: req.user.id,
        type: 'direct_hire_accepted',
        title: 'Hire Request Accepted',
        message: `${workerUser?.name || 'Worker'} accepted your direct hire request.`,
        link: '/dashboard',
        actionStatus: 'accepted'
      });
      socketService.emitNotification(notification.sender, customerNotification);
    }

    return res.status(200).json({
      success: true,
      message: 'Direct hire request accepted',
      data: notification
    });
  } catch (error) {
    console.error('Error accepting direct hire request:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
