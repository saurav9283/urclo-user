const { AddToCartService, RemoveFromCartService, GetCartService } = require("./user.cart.service");

module.exports = {
    AddToCartController: async (req, res) => {
        try {
            const { user_id,masterId,cat_id, sub_cat_id, quantity } = req.body;
            if (!user_id) {
                return res.status(400).json({ message: "You are not Login" });
            }
            if (!sub_cat_id || !quantity || !masterId || !cat_id) {
                return res.status(400).json({ message: "Please provide all the fields" });
            }
            AddToCartService(user_id,masterId,cat_id, sub_cat_id, quantity, (err, result,count) => {
                if (err) {
                    return res.status(500).json({ message: "Internal Server Error" });
                }
                return res.status(200).json({ message: result,count });
            });


        } catch (error) {
            console.log('error: ', error
            );
            return res.status(500).json({ message: "Internal Server Error"});
        }
    },
    RemoveFromCartController: async (req, res) => {
        try {
            const { user_id, cat_id,masterId ,sub_cat_id } = req.body;
            if (!user_id) {
                return res.status(400).json({ message: "You are not Login" });
            }
            if (!sub_cat_id || !masterId || !cat_id) {
                return res.status(400).json({ message: "Please provide all the fields" });
            }
            RemoveFromCartService(user_id,masterId,cat_id, sub_cat_id, (err, result,count) => {
                if (err) {
                    return res.status(500).json({ message: "Internal Server Error" });
                }
                return res.status(200).json({ message: result,count });
            });
        } catch (error) {
            console.log('error: ', error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    },
    GetCartController: async (req, res) => {
        const { user_id } = req.body;

        GetCartService(user_id, (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Internal Server Error" });
            }
            return res.status(200).json({ message: result });
        });
    },
    GetCOuntCartController: async (req, res) => {
        const { user_id } = req.body;

        // GetCountCartService(user_id, (err, result) => {
        //     if (err) {
        //         return res.status(500).json({ message: "Internal Server Error" });
        //     }
        //     return res.status(200).json({ message: result.length });
        // });
    }
}