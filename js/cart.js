let cartItemsData = [];
let couponApplied = false;

const GST_RATE = 0.05;
const DELIVERY_CHARGE = 40;


/* =====================================================
   LOAD CART FROM SUPABASE
===================================================== */

async function loadCart() {

    const cartItemsContainer =
        document.getElementById("cartItems");

    const emptyCart =
        document.getElementById("emptyCart");

    try {

        // Get logged-in user
        const {
            data: { user },
            error: userError
        } = await db.auth.getUser();


        if (userError) {
            throw userError;
        }


        // User must be logged in
        if (!user) {

            cartItemsContainer.innerHTML = `
                <div class="text-center py-5">

                    <i class="bi bi-person-lock display-1 text-muted"></i>

                    <h4 class="mt-3">
                        Please login to view your cart
                    </h4>

                    <a href="login.html" class="btn btn-primary mt-3">
                        Login
                    </a>

                </div>
            `;

            emptyCart.style.display = "none";

            calculateTotal();

            return;
        }


        // Find user's cart
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


        // No cart yet
        if (!cart) {

            cartItemsData = [];

            cartItemsContainer.innerHTML = "";

            emptyCart.style.display = "block";

            calculateTotal();

            return;
        }


        // Get cart items + product information
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
                    generic,
                    price,
                    image
                )
            `)
            .eq("cart_id", cart.id)
            .order("id", { ascending: true });


        if (itemsError) {
            throw itemsError;
        }


        cartItemsData = items || [];

        displayCart();

    } catch (error) {

        console.error("Cart loading error:", error);

        cartItemsContainer.innerHTML = `
            <div class="alert alert-danger">
                Unable to load your cart.
            </div>
        `;

        emptyCart.style.display = "none";
    }
}


/* =====================================================
   DISPLAY CART
===================================================== */

function displayCart() {

    const cartItems =
        document.getElementById("cartItems");

    const emptyCart =
        document.getElementById("emptyCart");


    if (cartItemsData.length === 0) {

        cartItems.innerHTML = "";

        emptyCart.style.display = "block";

        calculateTotal();

        return;
    }


    emptyCart.style.display = "none";

    cartItems.innerHTML = "";


    cartItemsData.forEach(function(item, index) {

        const product = item.products;

        const productName =
            product?.name || "Product";

        const brand =
            product?.brand || "";

        const price =
            Number(item.price);

        const quantity =
            Number(item.quantity);

        const itemTotal =
            price * quantity;


        const productHTML = `

            <div class="border-bottom pb-4 mb-4">

                <div class="row align-items-center">

                    <div class="col-md-5">

                        <h5>
                            ${productName}
                        </h5>

                        <p class="text-muted mb-1">
                            ${brand}
                        </p>

                        <strong>
                            ₹${price.toFixed(2)}
                        </strong>

                    </div>


                    <div class="col-md-4">

                        <label class="d-block mb-2">
                            Quantity:
                        </label>

                        <div class="input-group">

                            <button
                                type="button"
                                class="btn btn-outline-secondary"
                                onclick="decreaseQuantity(${index})">

                                -

                            </button>


                            <input
                                type="text"
                                class="form-control text-center"
                                value="${quantity}"
                                readonly>


                            <button
                                type="button"
                                class="btn btn-outline-secondary"
                                onclick="increaseQuantity(${index})">

                                +

                            </button>

                        </div>

                    </div>


                    <div class="col-md-3 text-md-end">

                        <strong>
                            ₹${itemTotal.toFixed(2)}
                        </strong>

                        <br>


                        <button
                            type="button"
                            class="btn btn-sm btn-danger mt-2"
                            onclick="removeItem(${index})">

                            Remove

                        </button>

                    </div>

                </div>

            </div>

        `;


        cartItems.innerHTML += productHTML;

    });


    calculateTotal();
}


/* =====================================================
   INCREASE QUANTITY
===================================================== */

async function increaseQuantity(index) {

    const item = cartItemsData[index];

    if (!item) return;


    const newQuantity =
        Number(item.quantity) + 1;


    const { error } = await db
        .from("cart_items")
        .update({
            quantity: newQuantity
        })
        .eq("id", item.id);


    if (error) {

        console.error(error);

        alert("Unable to update quantity.");

        return;
    }


    item.quantity = newQuantity;

    displayCart();
}


/* =====================================================
   DECREASE QUANTITY
===================================================== */

async function decreaseQuantity(index) {

    const item = cartItemsData[index];

    if (!item) return;


    const currentQuantity =
        Number(item.quantity);


    if (currentQuantity <= 1) {
        return;
    }


    const newQuantity =
        currentQuantity - 1;


    const { error } = await db
        .from("cart_items")
        .update({
            quantity: newQuantity
        })
        .eq("id", item.id);


    if (error) {

        console.error(error);

        alert("Unable to update quantity.");

        return;
    }


    item.quantity = newQuantity;

    displayCart();
}


/* =====================================================
   REMOVE ITEM
===================================================== */

async function removeItem(index) {

    const item = cartItemsData[index];

    if (!item) return;


    const { error } = await db
        .from("cart_items")
        .delete()
        .eq("id", item.id);


    if (error) {

        console.error(error);

        alert("Unable to remove product.");

        return;
    }


    cartItemsData.splice(index, 1);

    displayCart();
}


/* =====================================================
   APPLY COUPON
===================================================== */

function applyCoupon() {

    const couponInput =
        document.getElementById("couponInput");

    const couponMessage =
        document.getElementById("couponMessage");


    const coupon =
        couponInput.value.trim().toUpperCase();


    if (coupon === "MEDI10") {

        couponApplied = true;

        couponMessage.textContent =
            "Coupon applied! 10% discount.";

        couponMessage.className =
            "text-success";

    } else {

        couponApplied = false;

        couponMessage.textContent =
            "Invalid coupon code.";

        couponMessage.className =
            "text-danger";
    }


    calculateTotal();
}


/* =====================================================
   CALCULATE TOTAL
===================================================== */

function calculateTotal() {

    let subtotal = 0;


    cartItemsData.forEach(function(item) {

        subtotal +=
            Number(item.price) *
            Number(item.quantity);

    });


    const gst =
        subtotal * GST_RATE;


    let delivery = 0;


    if (subtotal > 0) {

        delivery = DELIVERY_CHARGE;

    }


    let discount = 0;


    if (couponApplied) {

        discount =
            subtotal * 0.10;

    }


    const grandTotal =
        subtotal +
        gst +
        delivery -
        discount;


    document.getElementById("subtotal").textContent =
        subtotal.toFixed(2);


    document.getElementById("gst").textContent =
        gst.toFixed(2);


    document.getElementById("delivery").textContent =
        delivery.toFixed(2);


    document.getElementById("discount").textContent =
        discount.toFixed(2);


    document.getElementById("grandTotal").textContent =
        grandTotal.toFixed(2);
}


/* =====================================================
   CHECKOUT
===================================================== */

function proceedToCheckout() {

    if (cartItemsData.length === 0) {

        alert("Your cart is empty.");

        return;
    }


    window.location.href =
        "checkout.html";
}


/* =====================================================
   PAGE LOAD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadCart();

    }
);