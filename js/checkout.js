// =====================================================
// MEDICARE PHARMACY - CHECKOUT
// RAZORPAY TEST MODE
// =====================================================

let checkoutCartItems = [];
let checkoutSubtotal = 0;

const GST_RATE = 0.05;
const DELIVERY_CHARGE = 40;


// =====================================================
// LOAD CHECKOUT
// =====================================================

async function loadCheckout() {

    const productsContainer =
        document.getElementById("checkoutProducts");

    try {

        const {
            data: { user },
            error: userError
        } = await db.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!user) {

            productsContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-person-lock"></i>
                    Please login before checkout.
                </div>

                <a href="login.html"
                   class="btn btn-primary">
                    Login
                </a>
            `;

            document.getElementById(
                "confirmOrderButton"
            ).disabled = true;

            return;
        }


        const {
            data: cart,
            error: cartError
        } = await db
            .from("cart")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (cartError) {
            throw cartError;
        }


        if (!cart) {

            showEmptyCart();

            return;
        }


        const {
            data: items,
            error: itemsError
        } = await db
            .from("cart_items")
            .select(`
                id,
                cart_id,
                product_id,
                quantity,
                price,
                products (
                    id,
                    name,
                    brand,
                    price
                )
            `)
            .eq("cart_id", cart.id)
            .order("id", {
                ascending: true
            });

        if (itemsError) {
            throw itemsError;
        }


        checkoutCartItems = items || [];


        if (checkoutCartItems.length === 0) {

            showEmptyCart();

            return;
        }


        displayCheckoutProducts();

        calculateCheckoutTotal();

    }

    catch (error) {

        console.error(
            "Checkout loading error:",
            error
        );

        productsContainer.innerHTML = `
            <div class="alert alert-danger">
                Unable to load your checkout.
                Please try again.
            </div>
        `;
    }
}


// =====================================================
// SHOW EMPTY CART
// =====================================================

function showEmptyCart() {

    document.getElementById(
        "checkoutProducts"
    ).innerHTML = `

        <div class="text-center py-3">

            <i class="bi bi-cart-x display-5 text-muted"></i>

            <h5 class="mt-3">
                Your cart is empty
            </h5>

            <a
                href="products.html"
                class="btn btn-primary mt-2">

                Browse Products

            </a>

        </div>
    `;


    document.getElementById(
        "confirmOrderButton"
    ).disabled = true;


    document.getElementById(
        "checkoutGST"
    ).textContent = "₹0.00";


    document.getElementById(
        "checkoutDelivery"
    ).textContent = "₹0.00";


    document.getElementById(
        "checkoutTotal"
    ).textContent = "₹0.00";
}


// =====================================================
// DISPLAY CHECKOUT PRODUCTS
// =====================================================

function displayCheckoutProducts() {

    const container =
        document.getElementById(
            "checkoutProducts"
        );

    container.innerHTML = "";


    checkoutCartItems.forEach(function(item) {

        const product = item.products;

        const productName =
            product?.name || "Product";

        const brand =
            product?.brand || "";

        const price =
            Number(item.price);

        const quantity =
            Number(item.quantity);

        const total =
            price * quantity;


        container.innerHTML += `

            <div class="d-flex justify-content-between mb-3">

                <div>

                    <strong>
                        ${productName}
                    </strong>

                    <br>

                    <small class="text-muted">
                        ${brand} × ${quantity}
                    </small>

                </div>

                <span>
                    ₹${total.toFixed(2)}
                </span>

            </div>
        `;
    });
}


// =====================================================
// CALCULATE TOTAL
// =====================================================

function calculateCheckoutTotal() {

    checkoutSubtotal = 0;


    checkoutCartItems.forEach(function(item) {

        const price =
            Number(item.price);

        const quantity =
            Number(item.quantity);

        checkoutSubtotal +=
            price * quantity;
    });


    const gst =
        checkoutSubtotal * GST_RATE;


    const delivery =
        checkoutSubtotal > 0
            ? DELIVERY_CHARGE
            : 0;


    const grandTotal =
        checkoutSubtotal +
        gst +
        delivery;


    document.getElementById(
        "checkoutGST"
    ).textContent =
        "₹" + gst.toFixed(2);


    document.getElementById(
        "checkoutDelivery"
    ).textContent =
        "₹" + delivery.toFixed(2);


    document.getElementById(
        "checkoutTotal"
    ).textContent =
        "₹" + grandTotal.toFixed(2);
}


// =====================================================
// CREATE ADDRESS
// =====================================================

async function createAddress(user) {

    const fullName =
        document.getElementById(
            "fullName"
        ).value.trim();


    const mobile =
        document.getElementById(
            "mobile"
        ).value.trim();


    const address =
        document.getElementById(
            "address"
        ).value.trim();


    const city =
        document.getElementById(
            "city"
        ).value.trim();


    const state =
        document.getElementById(
            "state"
        ).value;


    const pincode =
        document.getElementById(
            "pincode"
        ).value.trim();


    const {
        data,
        error
    } = await db
        .from("addresses")
        .insert({

            user_id: user.id,

            full_name: fullName,

            phone: mobile,

            address_line: address,

            city: city,

            state: state,

            pincode: pincode

        })
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


// =====================================================
// CREATE SUPABASE ORDER
// =====================================================

async function createOrder(
    user,
    address
) {

    const gst =
        checkoutSubtotal * GST_RATE;


    const delivery =
        checkoutSubtotal > 0
            ? DELIVERY_CHARGE
            : 0;


    const grandTotal =
        checkoutSubtotal +
        gst +
        delivery;


    const {
        data,
        error
    } = await db
        .from("orders")
        .insert({

            user_id: user.id,

            total_amount: grandTotal,

            status: "pending",

            payment_status: "pending",

            address_id: address.id

        })
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


// =====================================================
// CREATE ORDER ITEMS
// =====================================================

async function createOrderItems(order) {

    const orderItems =
        checkoutCartItems.map(function(item) {

            return {

                order_id:
                    order.id,

                product_id:
                    item.product_id,

                quantity:
                    Number(item.quantity),

                price:
                    Number(item.price)
            };
        });


    const {
        error
    } = await db
        .from("order_items")
        .insert(orderItems);


    if (error) {
        throw error;
    }
}


// =====================================================
// CREATE PAYMENT RECORD
// =====================================================

async function createPayment(
    order,
    paymentMethod,
    transactionId = null,
    paymentStatus = "pending"
) {

    const gst =
        checkoutSubtotal * GST_RATE;


    const delivery =
        checkoutSubtotal > 0
            ? DELIVERY_CHARGE
            : 0;


    const grandTotal =
        checkoutSubtotal +
        gst +
        delivery;


    const {
        error
    } = await db
        .from("payments")
        .insert({

            order_id:
                order.id,

            amount:
                grandTotal,

            payment_method:
                paymentMethod,

            payment_status:
                paymentStatus,

            transaction_id:
                transactionId
        });


    if (error) {
        throw error;
    }
}


// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

async function verifyRazorpayPayment(response) {

    const verifyResponse =
        await fetch(
            "/.netlify/functions/verify-payment",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    razorpay_order_id:
                        response.razorpay_order_id,

                    razorpay_payment_id:
                        response.razorpay_payment_id,

                    razorpay_signature:
                        response.razorpay_signature

                })
            }
        );


    const data =
        await verifyResponse.json();


    if (
        !verifyResponse.ok ||
        !data.success
    ) {

        throw new Error(
            data.error ||
            "Payment verification failed."
        );
    }


    return data;
}


// =====================================================
// UPDATE PAYMENT AFTER VERIFIED SUCCESS
// =====================================================

async function updatePaymentSuccess(
    orderId,
    paymentId
) {

    const {
        error
    } = await db
        .from("payments")
        .update({

            payment_status:
                "paid",

            transaction_id:
                paymentId

        })
        .eq(
            "order_id",
            orderId
        );


    if (error) {
        throw error;
    }


    const {
        error: orderError
    } = await db
        .from("orders")
        .update({

            payment_status:
                "paid",

            status:
                "confirmed"

        })
        .eq(
            "id",
            orderId
        );


    if (orderError) {
        throw orderError;
    }
}


// =====================================================
// CLEAR CART
// =====================================================

async function clearCart(user) {

    const {
        data: cart,
        error: cartError
    } = await db
        .from("cart")
        .select("id")
        .eq(
            "user_id",
            user.id
        )
        .maybeSingle();


    if (cartError) {
        throw cartError;
    }


    if (!cart) {
        return;
    }


    const {
        error: itemsError
    } = await db
        .from("cart_items")
        .delete()
        .eq(
            "cart_id",
            cart.id
        );


    if (itemsError) {
        throw itemsError;
    }
}


// =====================================================
// GET GRAND TOTAL
// =====================================================

function getGrandTotal() {

    const gst =
        checkoutSubtotal * GST_RATE;


    const delivery =
        checkoutSubtotal > 0
            ? DELIVERY_CHARGE
            : 0;


    return (
        checkoutSubtotal +
        gst +
        delivery
    );
}


// =====================================================
// CREATE RAZORPAY TEST ORDER
// =====================================================

async function createRazorpayOrder(amount) {

    const response =
        await fetch(
            "/.netlify/functions/create-payment",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    amount: amount
                })
            }
        );


    const data =
        await response.json();


    if (
        !response.ok ||
        !data.success
    ) {

        throw new Error(
            data.error ||
            "Unable to create Razorpay order."
        );
    }


    return data;
}


// =====================================================
// GET RAZORPAY PUBLIC KEY
// =====================================================

async function getRazorpayKey() {

    const response =
        await fetch(
            "/.netlify/functions/razorpay-config"
        );


    const data =
        await response.json();


    if (
        !response.ok ||
        !data.keyId
    ) {

        throw new Error(
            "Unable to load Razorpay Key ID."
        );
    }


    return data.keyId;
}


// =====================================================
// OPEN RAZORPAY TEST CHECKOUT
// =====================================================

async function openRazorpayCheckout(
    user,
    order,
    address,
    paymentMethod
) {

    if (
        typeof Razorpay ===
        "undefined"
    ) {

        throw new Error(
            "Razorpay Checkout script was not loaded."
        );
    }


    const amount =
        getGrandTotal();


    // Get Razorpay Test Key ID
    const razorpayKey =
        await getRazorpayKey();


    // Create Razorpay Test Order
    const razorpayOrder =
        await createRazorpayOrder(
            amount
        );


    const options = {

        // TEST MODE KEY ID
        key:
            razorpayKey,

        amount:
            razorpayOrder.amount,

        currency:
            "INR",

        name:
            "MediCare Pharmacy",

        description:
            "MediCare Pharmacy Test Payment",

        order_id:
            razorpayOrder.orderId,


        handler:
            async function(response) {

                try {

                    console.log(
                        "Razorpay Test Payment:",
                        response
                    );


                    // -----------------------------------------
                    // VERIFY PAYMENT ON SERVER
                    // -----------------------------------------

                    await verifyRazorpayPayment(
                        response
                    );


                    // -----------------------------------------
                    // UPDATE SUPABASE
                    // -----------------------------------------

                    await updatePaymentSuccess(
                        order.id,
                        response.razorpay_payment_id
                    );


                    // -----------------------------------------
                    // CLEAR CART
                    // -----------------------------------------

                    await clearCart(
                        user
                    );


                    alert(
                        "Test payment successful!\n\n" +
                        "Order ID: " +
                        order.id +
                        "\n\n" +
                        "Razorpay Payment ID: " +
                        response.razorpay_payment_id
                    );


                    window.location.href =
                        "index.html";

                }

                catch (error) {

                    console.error(
                        "Payment verification/update error:",
                        error
                    );


                    alert(
                        "Payment verification failed.\n\n" +
                        error.message
                    );

                }

            },


        prefill: {

            name:
                document.getElementById(
                    "fullName"
                ).value.trim(),

            contact:
                document.getElementById(
                    "mobile"
                ).value.trim()

        },


        theme: {

            color:
                "#0d6efd"

        },


        modal: {

            ondismiss:
                function() {

                    alert(
                        "Payment window closed.\n\n" +
                        "Your payment was not completed."
                    );

                }

        }

    };


    const razorpay =
        new Razorpay(options);


    razorpay.open();
}


// =====================================================
// CONFIRM ORDER
// =====================================================

async function confirmOrder(event) {

    event.preventDefault();


    const button =
        document.getElementById(
            "confirmOrderButton"
        );


    const form =
        document.getElementById(
            "checkoutForm"
        );


    if (!form.checkValidity()) {

        form.reportValidity();

        return;
    }


    const paymentMethod =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );


    if (!paymentMethod) {

        alert(
            "Please select a payment method."
        );

        return;
    }


    const mobile =
        document.getElementById(
            "mobile"
        ).value.trim();


    if (!/^[0-9]{10}$/.test(mobile)) {

        alert(
            "Please enter a valid 10-digit mobile number."
        );

        return;
    }


    const pincode =
        document.getElementById(
            "pincode"
        ).value.trim();


    if (!/^[0-9]{6}$/.test(pincode)) {

        alert(
            "Please enter a valid 6-digit pincode."
        );

        return;
    }


    if (
        !checkoutCartItems ||
        checkoutCartItems.length === 0
    ) {

        alert(
            "Your cart is empty."
        );

        return;
    }


    try {

        button.disabled = true;

        button.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2">
            </span>
            Processing Order...
        `;


        const {
            data: { user },
            error: userError
        } = await db.auth.getUser();


        if (userError) {
            throw userError;
        }


        if (!user) {

            alert(
                "Please login before placing an order."
            );

            window.location.href =
                "login.html";

            return;
        }


        // ---------------------------------------------
        // Create address
        // ---------------------------------------------

        const address =
            await createAddress(user);


        // ---------------------------------------------
        // Create Supabase order
        // ---------------------------------------------

        const order =
            await createOrder(
                user,
                address
            );


        // ---------------------------------------------
        // Create order items
        // ---------------------------------------------

        await createOrderItems(
            order
        );


        // =================================================
        // CASH ON DELIVERY
        // =================================================

        if (
            paymentMethod.value ===
            "Cash on Delivery"
        ) {

            await createPayment(
                order,
                "Cash on Delivery",
                null,
                "pending"
            );


            await clearCart(user);


            alert(
                "Order placed successfully!\n\n" +
                "Order ID: " +
                order.id +
                "\n\n" +
                "Payment Method: Cash on Delivery"
            );


            window.location.href =
                "index.html";


            return;
        }


        // =================================================
        // RAZORPAY TEST PAYMENT
        // =================================================

        await createPayment(
            order,
            paymentMethod.value,
            null,
            "pending"
        );


        await openRazorpayCheckout(
            user,
            order,
            address,
            paymentMethod.value
        );

    }

    catch (error) {

        console.error(
            "Order creation error:",
            error
        );


        alert(
            "Unable to continue with payment.\n\n" +
            "Error: " +
            error.message
        );


        button.disabled = false;


        button.innerHTML = `
            <i class="bi bi-check-circle"></i>
            Confirm Order
        `;
    }
}


// =====================================================
// START CHECKOUT
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadCheckout();


        document
            .getElementById(
                "checkoutForm"
            )
            .addEventListener(
                "submit",
                confirmOrder
            );

    }
);