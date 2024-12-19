const { UserBuyerService, DeletebuyerRecode } = require("./user.buyer.service");
// const { providerNotifyService } = require("../../Provider/providerNotify/provider.notify.service");
module.exports = {
    UserBuyerController: async (req, res) => {
        try {
            const { user_id, orders } = req.body;
            console.log('user_id, orders:', user_id, orders);

            if (!user_id || !Array.isArray(orders) || orders.length === 0) {
                return res.status(400).json({ message: "Invalid input: User ID and orders are required." });
            }

            const orderPromises = orders?.map(async (order) => {
                const { sub_cat_id, provider_id, quantity, schedule_time,schedule_date } = order;
                console.log('schedule_time: ', schedule_time,schedule_date);
                console.log('Processing order:', sub_cat_id, provider_id, quantity);

                if (!sub_cat_id || !provider_id || !quantity || !schedule_date || !schedule_time) {
                    return Promise.reject({ message: "Invalid order details", order });
                }

                try {
                    const result = await new Promise((resolve, reject) => {
                        UserBuyerService(user_id, sub_cat_id, provider_id, quantity, schedule_time,schedule_date, async (err, result) => {
                            if (err) {
                                console.error("Error processing order:", err);
                                return reject({ message: "Failed to process order", error: err, order });
                            }
                            try {
                                // await providerNotifyService(user_id, provider_id,schedule_time);
                                return resolve(result);
                            } catch (notifyError) {
                                console.error("Notification error:", notifyError);
                                return reject({
                                    message: "Order processed, but notification failed",
                                    error: notifyError,
                                    order,
                                });
                            }
                        });
                    });

                    return result;
                } catch (error) {
                    console.error("Order processing failed:", error);
                    return Promise.reject(error);
                }
            });

            // Wait for all orders to finish
            const results = await Promise.allSettled(orderPromises);
            console.log('results: ', results);

            // Check if the first result is rejected (or any rejection in the results)
            const rejectedResults = results.filter(result => result.status === "rejected");
            if (rejectedResults.length > 0) {
                const { sub_cat_id, provider_id } = orders[0]; 
                return  res.status(400).json({ message: "Provider is busy at this time", rejectedResults });
            } else {
                return res.status(200).json({
                    message: "All services bought successfully",results
                });
            }

        } catch (error) {
            console.error("Internal Server Error:", error);

            const { sub_cat_id, provider_id } = orders[0]; 
    
            return res.status(500).json({ message: "Internal Server Error", error });
        }
    },
};
 