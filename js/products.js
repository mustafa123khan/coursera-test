// ======================================================
// MEDICARE PHARMACY - SUPABASE PRODUCT CATALOG + CART
// ======================================================

// Products will come from Supabase
let medicines = [];

// ======================================================
// SELECTED CATEGORY
// ======================================================

let selectedCategory = "All";


// ======================================================
// LOAD PRODUCTS FROM SUPABASE
// ======================================================

async function loadProducts() {

    console.log("Loading products from Supabase...");

    try {

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
            .order("id", { ascending: true });


        if (error) {

            console.error("Supabase error:", error);

            alert("Unable to load products from database.");

            return;
        }


        // Convert Supabase data
        // into website format

        medicines = data.map(product => ({

            id: product.id,

            name: product.name,

            brand: product.brand || "",

            generic: product.generic || "",

            category:
                product.categories?.name || "Medicines",

            type:
                product.product_type ||
                (
                    product.prescription_required
                        ? "Prescription"
                        : "OTC"
                ),

            price: Number(product.price),

            prescription:
                product.prescription_required
                    ? "Yes"
                    : "No",

            popularity:
                product.popularity || 0,

            newest:
                product.newest || 0

        }));


        console.log(
            "Products loaded from Supabase:",
            medicines.length
        );


        displayProducts(medicines);

    }

    catch (error) {

        console.error(
            "Unexpected error loading products:",
            error
        );

        alert("Something went wrong while loading products.");

    }

}


// ======================================================
// ADD PRODUCT TO CART
// ======================================================

async function addToCart(productId) {

    console.log("Adding product to cart:", productId);


    try {

        // ----------------------------------------------
        // CHECK LOGIN
        // ----------------------------------------------

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


        // ----------------------------------------------
        // USER NOT LOGGED IN
        // ----------------------------------------------

        if (!user) {

            alert(
                "Please login to add products to your cart."
            );

            window.location.href = "login.html";

            return;

        }


        // ----------------------------------------------
        // FIND PRODUCT
        // ----------------------------------------------

        const product =
            medicines.find(
                item => Number(item.id) === Number(productId)
            );


        if (!product) {

            alert("Product not found.");

            return;

        }


        console.log(
            "Logged in user:",
            user.email
        );


        // ----------------------------------------------
        // FIND USER CART
        // ----------------------------------------------

        let { data: cart, error: cartError } =
            await db
                .from("cart")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();


        if (cartError) {

            console.error(
                "Cart lookup error:",
                cartError
            );

            alert(
                "Unable to access your cart."
            );

            return;

        }


        // ----------------------------------------------
        // CREATE CART IF IT DOES NOT EXIST
        // ----------------------------------------------

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

                alert(
                    "Unable to create your cart."
                );

                return;

            }


            cart = newCart;

        }


        console.log(
            "Cart ID:",
            cart.id
        );


        // ----------------------------------------------
        // CHECK IF PRODUCT ALREADY EXISTS IN CART
        // ----------------------------------------------

        const {
            data: existingItem,
            error: existingItemError
        } = await db
            .from("cart_items")
            .select("id, quantity")
            .eq("cart_id", cart.id)
            .eq("product_id", product.id)
            .maybeSingle();


        if (existingItemError) {

            console.error(
                "Cart item lookup error:",
                existingItemError
            );

            alert(
                "Unable to check your cart."
            );

            return;

        }


        // ----------------------------------------------
        // PRODUCT ALREADY IN CART
        // ----------------------------------------------

        if (existingItem) {

            const newQuantity =
                Number(existingItem.quantity) + 1;


            const {
                error: updateError
            } = await db
                .from("cart_items")
                .update({
                    quantity: newQuantity,
                    price: product.price
                })
                .eq("id", existingItem.id);


            if (updateError) {

                console.error(
                    "Update cart item error:",
                    updateError
                );

                alert(
                    "Unable to update your cart."
                );

                return;

            }


            alert(
                `${product.name} quantity increased to ${newQuantity}.`
            );

        }


        // ----------------------------------------------
        // NEW PRODUCT
        // ----------------------------------------------

        else {

            const {
                error: insertItemError
            } = await db
                .from("cart_items")
                .insert({

                    cart_id: cart.id,

                    product_id: product.id,

                    quantity: 1,

                    price: product.price

                });


            if (insertItemError) {

                console.error(
                    "Add cart item error:",
                    insertItemError
                );

                alert(
                    "Unable to add product to cart."
                );

                return;

            }


            alert(
                `${product.name} added to your cart.`
            );

        }


        console.log(
            "Cart updated successfully."
        );

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
// OPEN CART
// ======================================================

function showCart() {

    window.location.href = "checkout.html";

}


// ======================================================
// DISPLAY PRODUCTS
// ======================================================

function displayProducts(productList) {

    const container =
        document.getElementById("productContainer");

    const noProducts =
        document.getElementById("noProducts");


    if (!container) {

        console.error(
            "productContainer not found."
        );

        return;

    }


    container.innerHTML = "";


    if (productList.length === 0) {

        if (noProducts) {

            noProducts.style.display = "block";

        }

        updateProductCount(0);

        return;

    }


    if (noProducts) {

        noProducts.style.display = "none";

    }


    productList.forEach(product => {

        const prescriptionBadge =
            product.prescription === "Yes"

                ? `<span class="badge bg-danger">
                    Prescription
                   </span>`

                : `<span class="badge bg-success">
                    OTC
                   </span>`;


        const card =
            document.createElement("div");


        card.className =
            "col-lg-4 col-md-6 mb-4";


        card.innerHTML = `

            <div class="card h-100 shadow-sm border-0 product-card">

                <!-- PRODUCT ICON -->

                <div class="text-center pt-4">

                    <div
                        class="mx-auto d-flex align-items-center justify-content-center"
                        style="
                            width:100px;
                            height:100px;
                            background:#eaf4ff;
                            border-radius:50%;
                            font-size:45px;
                        "
                    >
                        💊
                    </div>

                </div>


                <!-- PRODUCT INFORMATION -->

                <div class="card-body d-flex flex-column">

                    <div class="d-flex justify-content-between mb-2">

                        <span class="badge bg-primary">

                            ${product.category}

                        </span>


                        ${prescriptionBadge}

                    </div>


                    <h5 class="card-title">

                        ${product.name}

                    </h5>


                    <p class="mb-1">

                        <strong>Brand:</strong>
                        ${product.brand}

                    </p>


                    <p class="mb-1">

                        <strong>Generic:</strong>
                        ${product.generic}

                    </p>


                    <p class="text-muted mb-2">

                        <strong>Type:</strong>
                        ${product.type}

                    </p>


                    <div class="text-warning mb-2">

                        ★ ★ ★ ★ ★

                    </div>


                    <h4 class="text-primary mb-3">

                        ₹${product.price}

                    </h4>


                    <!-- BUTTONS -->

                    <div class="mt-auto">

                        <a
                            href="products-details.html?id=medicine-${product.id}"
                            class="btn btn-outline-primary w-100 mb-2"
                        >

                            <i class="bi bi-eye"></i>

                            View Product

                        </a>


                        <button
                            type="button"
                            class="btn btn-primary w-100"
                            onclick="addToCart(${product.id})"
                        >

                            <i class="bi bi-cart-plus"></i>

                            Add to Cart

                        </button>

                    </div>


                </div>

            </div>

        `;


        container.appendChild(card);

    });


    updateProductCount(productList.length);

}


// ======================================================
// PRODUCT COUNT
// ======================================================

function updateProductCount(count) {

    const productCount =
        document.getElementById("productCount");


    if (productCount) {

        productCount.textContent =
            `${count} Products Found`;

    }

}


// ======================================================
// FILTER PRODUCTS
// ======================================================

function filterProducts() {

    const searchElement =
        document.getElementById("searchInput");

    const typeElement =
        document.getElementById("typeFilter");

    const brandElement =
        document.getElementById("brandFilter");

    const prescriptionElement =
        document.getElementById("prescriptionFilter");

    const minPriceElement =
        document.getElementById("minPrice");

    const maxPriceElement =
        document.getElementById("maxPrice");

    const sortElement =
        document.getElementById("sortFilter");


    const searchText =
        searchElement
            ? searchElement.value.toLowerCase().trim()
            : "";


    const type =
        typeElement
            ? typeElement.value
            : "All";


    const brand =
        brandElement
            ? brandElement.value
            : "All";


    const prescription =
        prescriptionElement
            ? prescriptionElement.value
            : "All";


    const minPrice =
        minPriceElement &&
        minPriceElement.value !== ""

            ? Number(minPriceElement.value)

            : 0;


    const maxPrice =
        maxPriceElement &&
        maxPriceElement.value !== ""

            ? Number(maxPriceElement.value)

            : Infinity;


    const sort =
        sortElement
            ? sortElement.value
            : "Default";


    let filteredProducts =
        medicines.filter(product => {

            const matchesSearch =

                product.name
                    .toLowerCase()
                    .includes(searchText)

                ||

                product.brand
                    .toLowerCase()
                    .includes(searchText)

                ||

                product.generic
                    .toLowerCase()
                    .includes(searchText);


            const matchesCategory =

                selectedCategory === "All"

                ||

                product.category === selectedCategory;


            const matchesType =

                type === "All"

                ||

                product.type === type;


            const matchesBrand =

                brand === "All"

                ||

                product.brand === brand;


            const matchesPrescription =

                prescription === "All"

                ||

                product.prescription === prescription;


            const matchesPrice =

                product.price >= minPrice

                &&

                product.price <= maxPrice;


            return (

                matchesSearch &&

                matchesCategory &&

                matchesType &&

                matchesBrand &&

                matchesPrescription &&

                matchesPrice

            );

        });


    // ==================================================
    // SORTING
    // ==================================================

    if (sort === "PriceLow") {

        filteredProducts.sort(
            (a, b) => a.price - b.price
        );

    }

    else if (sort === "PriceHigh") {

        filteredProducts.sort(
            (a, b) => b.price - a.price
        );

    }

    else if (sort === "Popularity") {

        filteredProducts.sort(
            (a, b) => b.popularity - a.popularity
        );

    }

    else if (sort === "Newest") {

        filteredProducts.sort(
            (a, b) => b.newest - a.newest
        );

    }


    displayProducts(filteredProducts);

}


// ======================================================
// CATEGORY FILTER
// ======================================================

function filterCategory(category, button) {

    selectedCategory = category;


    document
        .querySelectorAll(".category-btn")
        .forEach(btn => {

            btn.classList.remove("active");

        });


    if (button) {

        button.classList.add("active");

    }


    filterProducts();

}


// ======================================================
// RESET FILTERS
// ======================================================

function resetFilters() {

    selectedCategory = "All";


    const searchInput =
        document.getElementById("searchInput");

    const typeFilter =
        document.getElementById("typeFilter");

    const brandFilter =
        document.getElementById("brandFilter");

    const prescriptionFilter =
        document.getElementById("prescriptionFilter");

    const minPrice =
        document.getElementById("minPrice");

    const maxPrice =
        document.getElementById("maxPrice");

    const sortFilter =
        document.getElementById("sortFilter");


    if (searchInput)
        searchInput.value = "";


    if (typeFilter)
        typeFilter.value = "All";


    if (brandFilter)
        brandFilter.value = "All";


    if (prescriptionFilter)
        prescriptionFilter.value = "All";


    if (minPrice)
        minPrice.value = "";


    if (maxPrice)
        maxPrice.value = "";


    if (sortFilter)
        sortFilter.value = "Default";


    document
        .querySelectorAll(".category-btn")
        .forEach(btn => {

            btn.classList.remove("active");

        });


    const firstCategoryButton =
        document.querySelector(".category-btn");


    if (firstCategoryButton) {

        firstCategoryButton.classList.add("active");

    }


    displayProducts(medicines);

}


// ======================================================
// PAGE LOAD
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "MediCare Pharmacy: Connecting to Supabase..."
        );

        loadProducts();

    }
);