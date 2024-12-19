const { getNotifisationForUser, getCountNotify } = require("./user.notification.service");

module.exports = {
    NotificationController: async (req, res) => {
        const { email, phone } = req.query;
        try {
            getNotifisationForUser(email, phone, (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Internal server error" });
                }
                return res.status(200).json({ message: result });
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
    NotifiCountController: async (req, res) => {
        const { user_id } = req.query;
        try {
            getCountNotify(user_id, (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Internal server error" });
                }
                return res.status(200).json({ message: result });
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Internal server error" });

        }
    }
}