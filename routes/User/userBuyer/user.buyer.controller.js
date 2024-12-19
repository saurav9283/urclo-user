const { UserBuyerService, DeletebuyerRecode } = require("./user.buyer.service");
// const { providerNotifyService } = require("../../Provider/providerNotify/provider.notify.service");
const {  publishToQueue } = require('../../../utils/RabbitMQ .js');

module.exports = {
    UserBuyerController: async (req, res) => {
        try {
            const { user_id, orders } = req.body;
            console.log('user_id, orders:', user_id, orders);

            if (!user_id || !Array.isArray(orders) || orders.length === 0) {
                return res.status(400).json({ message: "Invalid input: User ID and orders are required." });
            }

            const orderPromises = orders?.map(async (order) => {
                const { sub_cat_id, provider_id, quantity, schedule_time, schedule_date } = order;
                console.log('schedule_time: ', schedule_time, schedule_date);
                console.log('Processing order:', sub_cat_id, provider_id, quantity);

                if (!sub_cat_id || !provider_id || !quantity || !schedule_date || !schedule_time) {
                    return Promise.reject({ message: "Invalid order details", order });
                }

                try {
                    const resultinsert = await new Promise((resolve, reject) => {
                        UserBuyerService(user_id, sub_cat_id, provider_id, quantity, schedule_time, schedule_date, async (err, result) => {
                            if (err) {
                                console.error("Error processing order:", err);
                                return reject({ message: "Failed to process order", error: err, order });
                            }
                            console.log('result: ', result);
                            if (result.affectedRows  > 0) {
                                const message = {
                                    user_id,
                                    provider_id,
                                    schedule_time,
                                    provider_id
                                };
                                publishToQueue('provider_message_queue', JSON.stringify(message));
                                console.log(`Order message sent to RabbitMQ: ${JSON.stringify(message)}`);

                                return resolve(result);
                            }
                            else {
                                return reject({ message: "No rows affected", order });
                            }

                        });
                    });
                    return resultinsert;
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
                return res.status(400).json({ message: "Provider is busy at this time", rejectedResults });
            } else {
                return res.status(200).json({
                    message: "All services bought successfully", results
                });
            }

        } catch (error) {
            console.error("Internal Server Error:", error);
            return res.status(500).json({ message: "Internal Server Error", error });
        }
    },
};
