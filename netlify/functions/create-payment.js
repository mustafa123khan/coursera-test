// MediCare Pharmacy
// Netlify Function - Create Razorpay Test Order

exports.handler = async function (event) {

    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({
                error: "Method not allowed"
            })
        };
    }

    try {

        const Razorpay = require("razorpay");

        // Razorpay credentials will come from
        // Netlify environment variables.
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const body = JSON.parse(event.body);

        const amount = Number(body.amount);

        if (!amount || amount <= 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Invalid amount"
                })
            };
        }

        // Razorpay expects the amount in paise.
        const amountInPaise = Math.round(amount * 100);

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: "medicare_" + Date.now()
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency
            })
        };

    } catch (error) {

        console.error("Razorpay order error:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: "Unable to create payment order"
            })
        };
    }
};