// =====================================================
// MEDICARE PHARMACY - CHECKOUT
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

        // ---------------------------------------------
        // Check logged-in user
        // ---------------------------------------------

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

            document.getElementById("confirmOrderButton").disabled = true;

            return;
        }


        // ---------------------------------------------
        // Find user's cart
        // ---------------------------------------------

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


        // ---------------------------------------------
        // Load cart items
        // ---------------------------------------------

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


        // ---------------------------------------------
        // Display products
        // ---------------------------------------------

        displayCheckoutProducts();


        // ---------------------------------------------
        // Calculate total
        // ---------------------------------------------

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

    document.getElementById("checkoutProducts").innerHTML = `

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


    document.getElementById("confirmOrderButton").disabled = true;


    document.getElementById("checkoutGST")
        .textContent = "₹0.00";

    document.getElementById("checkoutDelivery")
        .textContent = "₹0.00";

    document.getElementById("checkoutTotal")
        .textContent = "₹0.00";

}


// =====================================================
// DISPLAY CHECKOUT PRODUCTS
// =====================================================

function displayCheckoutProducts() {

    const container =
        document.getElementById("checkoutProducts");


    container.innerHTML = "";


    checkoutCartItems.forEach(function(item) {

        const product =
            item.products;


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


        const productHTML = `

            <div class="d-flex justify-content-between mb-3">

                <div>

                    <strong>
                        ${productName}
                    </strong>

                    <br>

                    <small class="text-muted">

                        ${brand}

                        × ${quantity}

                    </small>

                </div>


                <span>

                    ₹${total.toFixed(2)}

                </span>

            </div>

        `;


        container.innerHTML += productHTML;

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


    // GST
    const gst =
        checkoutSubtotal * GST_RATE;


    // Delivery
    const delivery =
        checkoutSubtotal > 0
            ? DELIVERY_CHARGE
            : 0;


    // Grand total
    const grandTotal =
        checkoutSubtotal +
        gst +
        delivery;


    document.getElementById("checkoutGST")
        .textContent =
        "₹" + gst.toFixed(2);


    document.getElementById("checkoutDelivery")
        .textContent =
        "₹" + delivery.toFixed(2);


    document.getElementById("checkoutTotal")
        .textContent =
        "₹" + grandTotal.toFixed(2);

}


// =====================================================
// CREATE ADDRESS
// =====================================================

async function createAddress(user) {

    const fullName =
        document.getElementById("fullName")
            .value.trim();


    const mobile =
        document.getElementById("mobile")
            .value.trim();


    const address =
        document.getElementById("address")
            .value.trim();


    const city =
        document.getElementById("city")
            .value.trim();


    const state =
        document.getElementById("state")
            .value;


    const pincode =
        document.getElementById("pincode")
            .value.trim();


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
// CREATE ORDER
// =====================================================

async function createOrder(
    user,
    address,
    paymentMethod
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

            total_amount:
                grandTotal,

            status:
                "pending",

            payment_status:
                "pending",

            address_id:
                address.id

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
    paymentMethod
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


    const paymentStatus =
        paymentMethod ===
        "Cash on Delivery"
            ? "pending"
            : "pending";


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
                null

        });


    if (error) {
        throw error;
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
        .eq("user_id", user.id)
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
        .eq("cart_id", cart.id);


    if (itemsError) {
        throw itemsError;
    }

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


    // ---------------------------------------------
    // Browser validation
    // ---------------------------------------------

    const form =
        document.getElementById(
            "checkoutForm"
        );


    if (!form.checkValidity()) {

        form.reportValidity();

        return;

    }


    // ---------------------------------------------
    // Payment method
    // ---------------------------------------------

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


    // ---------------------------------------------
    // Mobile validation
    // ---------------------------------------------

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


    // ---------------------------------------------
    // Pincode validation
    // ---------------------------------------------

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


    // ---------------------------------------------
    // Check cart
    // ---------------------------------------------

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


        // -----------------------------------------
        // Get user
        // -----------------------------------------

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


        // -----------------------------------------
        // Create address
        // -----------------------------------------

        const address =
            await createAddress(user);


        // -----------------------------------------
        // Create order
        // -----------------------------------------

        const order =
            await createOrder(
                user,
                address,
                paymentMethod.value
            );


        // -----------------------------------------
        // Create order items
        // -----------------------------------------

        await createOrderItems(order);


        // -----------------------------------------
        // Create payment record
        // -----------------------------------------

        await createPayment(
            order,
            paymentMethod.value
        );


        // -----------------------------------------
        // Clear cart
        // -----------------------------------------

        await clearCart(user);


        // -----------------------------------------
        // Success
        // -----------------------------------------

        alert(
            "Order placed successfully!\n\n" +
            "Order ID: " +
            order.id +
            "\n\n" +
            "Payment Method: " +
            paymentMethod.value
        );


        // Go to home
        window.location.href =
            "index.html";

    }

    catch (error) {

        console.error(
            "Order creation error:",
            error
        );


        alert(
            "Unable to place your order.\n\n" +
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
            .getElementById("checkoutForm")
            .addEventListener(
                "submit",
                confirmOrder
            );

    }
);