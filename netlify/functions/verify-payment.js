// MediCare Pharmacy
// Netlify Function - Verify Razorpay Test Payment

const crypto = require("crypto");

exports.handler = async function (event) {

    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({
                success: false,
                error: "Method not allowed"
            })
        };
    }

    try {

        const body = JSON.parse(event.body);

        const razorpayOrderId = body.razorpay_order_id;
        const razorpayPaymentId = body.razorpay_payment_id;
        const razorpaySignature = body.razorpay_signature;

        // Check required values
        if (
            !razorpayOrderId ||
            !razorpayPaymentId ||
            !razorpaySignature
        ) {

            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    error: "Missing Razorpay payment details"
                })
            };

        }


        // Create the signature using Razorpay secret
        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                razorpayOrderId + "|" + razorpayPaymentId
            )
            .digest("hex");


        // Compare signatures
        const isValid =
            generatedSignature === razorpaySignature;


        if (!isValid) {

            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    error: "Payment verification failed"
                })
            };

        }


        // Payment is verified
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: "Payment verified successfully",
                orderId: razorpayOrderId,
                paymentId: razorpayPaymentId
            })
        };


    } catch (error) {

        console.error(
            "Razorpay verification error:",
            error
        );

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: "Server error during payment verification"
            })
        };

    }

};