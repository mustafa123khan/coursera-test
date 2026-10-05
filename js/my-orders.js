document.addEventListener("DOMContentLoaded", async function () {

    const loadingMessage = document.getElementById("loadingMessage");
    const loginMessage = document.getElementById("loginMessage");
    const noOrders = document.getElementById("noOrders");
    const ordersContainer = document.getElementById("ordersContainer");
    const logoutButton = document.getElementById("logoutButton");

    try {

        // Check logged-in user
        const {
            data: { user },
            error: userError
        } = await db.auth.getUser();

        if (userError) {
            throw userError;
        }

        // Hide loading
        loadingMessage.style.display = "none";

        // User not logged in
        if (!user) {

            loginMessage.style.display = "block";
            return;
        }

        // Get user's orders
        const {
            data: orders,
            error: ordersError
        } = await db
            .from("orders")
            .select(`
                id,
                total_amount,
                status,
                payment_status,
                created_at,
                addresses (
                    full_name,
                    phone,
                    address_line,
                    city,
                    state,
                    pincode
                ),
                order_items (
                    quantity,
                    price,
                    products (
                        name,
                        brand
                    )
                ),
                payments (
                    payment_method,
                    payment_status,
                    transaction_id
                )
            `)
            .eq("user_id", user.id)
            .order("created_at", {
                ascending: false
            });

        if (ordersError) {
            throw ordersError;
        }

        // No orders
        if (!orders || orders.length === 0) {

            noOrders.style.display = "block";
            return;
        }

        // Display orders
        ordersContainer.innerHTML = "";

        orders.forEach(function (order) {

            const orderDate = new Date(order.created_at);

            const formattedDate = orderDate.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

            const formattedTime = orderDate.toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

            let statusClass = "bg-warning text-dark";

            if (order.status === "completed") {
                statusClass = "bg-success";
            }

            if (order.status === "cancelled") {
                statusClass = "bg-danger";
            }

            let paymentClass = "bg-warning text-dark";

            if (order.payment_status === "paid") {
                paymentClass = "bg-success";
            }

            let productsHTML = "";

            if (order.order_items && order.order_items.length > 0) {

                order.order_items.forEach(function (item) {

                    const productName =
                        item.products?.name || "Product";

                    const brand =
                        item.products?.brand || "";

                    const quantity =
                        Number(item.quantity);

                    const price =
                        Number(item.price);

                    const itemTotal =
                        price * quantity;

                    productsHTML += `
                        <div class="border-bottom py-2">

                            <div class="d-flex justify-content-between">

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

                                <strong>
                                    ₹${itemTotal.toFixed(2)}
                                </strong>

                            </div>

                        </div>
                    `;
                });

            }

            const address = order.addresses;

            const addressHTML = address
                ? `
                    <p class="mb-1">
                        <strong>${address.full_name}</strong>
                    </p>

                    <p class="mb-1">
                        ${address.address_line}
                    </p>

                    <p class="mb-1">
                        ${address.city},
                        ${address.state}
                        - ${address.pincode}
                    </p>

                    <p class="mb-0">
                        <i class="bi bi-telephone"></i>
                        ${address.phone}
                    </p>
                `
                : `<p class="text-muted">Address unavailable</p>`;

            let paymentMethod = "Not available";

            if (
                order.payments &&
                order.payments.length > 0
            ) {
                paymentMethod =
                    order.payments[0].payment_method;
            }

            const orderHTML = `

                <div class="card shadow-sm mb-4">

                    <div class="card-header">

                        <div class="row align-items-center">

                            <div class="col-md-6">

                                <strong>
                                    Order #${order.id}
                                </strong>

                                <br>

                                <small class="text-muted">
                                    ${formattedDate}
                                    at
                                    ${formattedTime}
                                </small>

                            </div>

                            <div class="col-md-6 text-md-end mt-2 mt-md-0">

                                <span class="badge ${statusClass}">
                                    ${order.status}
                                </span>

                                <span class="badge ${paymentClass} ms-1">
                                    Payment:
                                    ${order.payment_status}
                                </span>

                            </div>

                        </div>

                    </div>


                    <div class="card-body">

                        <div class="row">

                            <!-- Products -->

                            <div class="col-md-7">

                                <h5 class="mb-3">
                                    <i class="bi bi-cart-check"></i>
                                    Products
                                </h5>

                                ${productsHTML}

                            </div>


                            <!-- Order Information -->

                            <div class="col-md-5 mt-4 mt-md-0">

                                <h5 class="mb-3">
                                    <i class="bi bi-info-circle"></i>
                                    Order Information
                                </h5>

                                <p>
                                    <strong>Payment Method:</strong>
                                    ${paymentMethod}
                                </p>

                                <p>
                                    <strong>Delivery Address:</strong>
                                </p>

                                <div class="bg-light p-3 rounded">
                                    ${addressHTML}
                                </div>

                            </div>

                        </div>

                    </div>


                    <div class="card-footer">

                        <div class="d-flex justify-content-between align-items-center">

                            <strong>
                                Total Amount
                            </strong>

                            <strong class="text-primary fs-5">
                                ₹${Number(order.total_amount).toFixed(2)}
                            </strong>

                        </div>

                    </div>

                </div>

            `;

            ordersContainer.innerHTML += orderHTML;

        });


    } catch (error) {

        console.error(
            "My Orders error:",
            error
        );

        loadingMessage.style.display = "none";

        ordersContainer.innerHTML = `

            <div class="alert alert-danger">

                <i class="bi bi-exclamation-triangle"></i>

                Unable to load your orders.

                <br>

                <small>
                    ${error.message}
                </small>

            </div>

        `;

    }


    // Logout
    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async function () {

                const {
                    error
                } = await db.auth.signOut();

                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                    alert(
                        "Unable to logout. Please try again."
                    );

                    return;
                }

                window.location.href =
                    "login.html";

            }
        );

    }

});