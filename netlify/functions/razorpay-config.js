// =====================================================
// MEDICARE PHARMACY
// PUBLIC RAZORPAY TEST KEY ID
// =====================================================

exports.handler = async function () {

    return {
        statusCode: 200,

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            keyId: process.env.RAZORPAY_KEY_ID
        })
    };

};