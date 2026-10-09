
 // MediCare Pharmacy
 // Public Razorpay Test Key ID

exports.handler = async function () {
    const keyId = process.env.RAZORPAY_PUBLIC_KEY_ID;

    if (!keyId) {
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                error: "Razorpay public Key ID is not configured"
            })
        };
    }

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            keyId: keyId
        })
    };
};