// ======================================================
// MEDICARE PHARMACY - PRODUCT DETAILS
// ======================================================

let currentProduct = null;


// ======================================================
// LOAD PRODUCT FROM SUPABASE
// ======================================================

async function loadProductDetails() {

    console.log("Loading product details...");

    try {

        // Get product ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const idValue = urlParams.get("id");

        if (!idValue) {
            alert("Product not found.");
            return;
        }

        // URL format: medicine-1
        const productId = Number(idValue.replace("medicine-", ""));

        if (!productId) {
            alert("Invalid product ID.");
            return;
        }

        console.log("Product ID:", productId);


        // Get product from Supabase
        const { data, error } = await db
            .from("products")
            .select(`
                id,
                name,
                price,
                brand,
                generic,
                product_type,
                prescription_required,
                popularity,
                newest,
                category_id,
                categories (
                    name
                )
            `)
            .eq("id", productId)
            .single();


        if (error) {

            console.error("Product loading error:", error);

            alert("Unable to load product details.");

            return;
        }


        if (!data) {

            alert("Product not found.");

            return;
        }


        // Store current product
        currentProduct = data;


        // ==================================================
        // DISPLAY PRODUCT
        // ==================================================

        displayProductDetails(data);

    }

    catch (error) {

        console.error(
            "Unexpected product details error:",
            error
        );

        alert("Something went wrong while loading the product.");

    }

}


// ======================================================
// DISPLAY PRODUCT DETAILS
// ======================================================

function displayProductDetails(product) {

    console.log("Displaying:", product);


    // Product name
    const productName =
        document.getElementById("productName");

    if (productName) {
        productName.textContent = product.name;
    }


    // Product price
    const productPrice =
        document.getElementById("productPrice");

    if (productPrice) {
        productPrice.textContent =
            `₹${Number(product.price).toFixed(2)}`;
    }


    // Brand
    const productBrand =
        document.getElementById("productBrand");

    if (productBrand) {
        productBrand.textContent =
            product.brand || "Not Available";
    }


    // Generic
    const productGeneric =
        document.getElementById("productGeneric");

    if (productGeneric) {
        productGeneric.textContent =
            product.generic || "Not Available";
    }


    // Product type
    const productType =
        document.getElementById("productType");

    if (productType) {

        productType.textContent =
            product.product_type ||
            (
                product.prescription_required
                    ? "Prescription"
                    : "OTC"
            );

    }


    // Prescription
    const prescription =
        document.getElementById("prescription");

    if (prescription) {

        prescription.textContent =
            product.prescription_required
                ? "Yes"
                : "No";

    }

}


// ======================================================
// ADD TO CART
// ======================================================

async function addToCart() {

    console.log("Add to Cart clicked.");


    if (!currentProduct) {

        alert("Product information is not available.");

        return;
    }


    try {

        // --------------------------------------------------
        // CHECK LOGIN
        // --------------------------------------------------

        const {
            data: { user },
            error: userError
        } = await db.auth.getUser();


        if (userError) {

            console.error(
                "User check error:",
                userError
            );

            alert("Unable to check your login status.");

            return;
        }


        // --------------------------------------------------
        // USER NOT LOGGED IN
        // --------------------------------------------------

        if (!user) {

            alert(
                "Please login to add products to your cart."
            );

            window.location.href = "login.html";

            return;
        }


        // --------------------------------------------------
        // GET QUANTITY
        // --------------------------------------------------

        const quantityInput =
            document.getElementById("quantity");

        let quantity =
            quantityInput
                ? Number(quantityInput.value)
                : 1;


        if (!Number.isInteger(quantity) || quantity < 1) {

            quantity = 1;

        }


        // --------------------------------------------------
        // FIND USER CART
        // --------------------------------------------------

        let {
            data: cart,
            error: cartError
        } = await db
            .from("cart")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();


        if (cartError) {

            console.error(
                "Cart lookup error:",
                cartError
            );

            alert("Unable to access your cart.");

            return;
        }


        // --------------------------------------------------
        // CREATE CART IF IT DOES NOT EXIST
        // --------------------------------------------------

        if (!cart) {

            const {
                data: newCart,
                error: createCartError
            } = await db
                .from("cart")
                .insert({
                    user_id: user.id
                })
                .select("id")
                .single();


            if (createCartError) {

                console.error(
                    "Create cart error:",
                    createCartError
                );

                alert("Unable to create your cart.");

                return;
            }


            cart = newCart;

        }


        // --------------------------------------------------
        // CHECK EXISTING CART ITEM
        // --------------------------------------------------

        const {
            data: existingItem,
            error: existingItemError
        } = await db
            .from("cart_items")
            .select("id, quantity")
            .eq("cart_id", cart.id)
            .eq("product_id", currentProduct.id)
            .maybeSingle();


        if (existingItemError) {

            console.error(
                "Cart item lookup error:",
                existingItemError
            );

            alert("Unable to check your cart.");

            return;
        }


        // --------------------------------------------------
        // UPDATE EXISTING PRODUCT
        // --------------------------------------------------

        if (existingItem) {

            const newQuantity =
                Number(existingItem.quantity) + quantity;


            const {
                error: updateError
            } = await db
                .from("cart_items")
                .update({
                    quantity: newQuantity,
                    price: Number(currentProduct.price)
                })
                .eq("id", existingItem.id);


            if (updateError) {

                console.error(
                    "Update cart error:",
                    updateError
                );

                alert("Unable to update your cart.");

                return;
            }


            alert(
                `${currentProduct.name} quantity updated to ${newQuantity}.`
            );

        }


        // --------------------------------------------------
        // ADD NEW PRODUCT
        // --------------------------------------------------

        else {

            const {
                error: insertError
            } = await db
                .from("cart_items")
                .insert({

                    cart_id: cart.id,

                    product_id: currentProduct.id,

                    quantity: quantity,

                    price: Number(currentProduct.price)

                });


            if (insertError) {

                console.error(
                    "Add to cart error:",
                    insertError
                );

                alert(
                    "Unable to add product to cart."
                );

                return;
            }


            alert(
                `${currentProduct.name} added to your cart.`
            );

        }


        console.log("Product added successfully.");

    }

    catch (error) {

        console.error(
            "Unexpected cart error:",
            error
        );

        alert(
            "Something went wrong while adding the product."
        );

    }

}


// ======================================================
// BUY NOW
// ======================================================

async function buyNow() {

    console.log("Buy Now clicked.");

    await addToCart();

    // After adding the product,
    // open the checkout page.

    window.location.href = "checkout.html";

}


// ======================================================
// PAGE LOAD
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "MediCare Pharmacy: Product Details page"
        );

        loadProductDetails();

    }
);