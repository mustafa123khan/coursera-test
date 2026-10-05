document.addEventListener("DOMContentLoaded", async function () {

    const profileForm = document.getElementById("profileForm");

    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const usernameInput = document.getElementById("username");

    const successMessage = document.getElementById("successMessage");
    const errorMessage = document.getElementById("errorMessage");

    const updateButton = document.getElementById("updateButton");


    // =====================================================
    // GET LOGGED-IN USER
    // =====================================================

    const {
        data: { user },
        error
    } = await db.auth.getUser();


    // =====================================================
    // USER NOT LOGGED IN
    // =====================================================

    if (error || !user) {

        alert("Please login first.");

        window.location.href = "login.html";

        return;
    }


    // =====================================================
    // GET USER METADATA
    // =====================================================

    const metadata = user.user_metadata || {};


    // =====================================================
    // DISPLAY USER INFORMATION
    // =====================================================

    fullNameInput.value = metadata.full_name || "";

    emailInput.value = user.email || "";

    phoneInput.value = metadata.phone || "";

    usernameInput.value = metadata.username || "";



    // =====================================================
    // UPDATE PROFILE
    // =====================================================

    profileForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        successMessage.classList.add("d-none");

        errorMessage.classList.add("d-none");


        const fullName = fullNameInput.value.trim();

        const phone = phoneInput.value.trim();

        const username = usernameInput.value.trim();


        // =================================================
        // VALIDATION
        // =================================================

        if (fullName === "") {

            errorMessage.textContent =
                "Please enter your full name.";

            errorMessage.classList.remove("d-none");

            return;
        }


        if (phone !== "" && !/^[0-9]{10}$/.test(phone)) {

            errorMessage.textContent =
                "Please enter a valid 10-digit phone number.";

            errorMessage.classList.remove("d-none");

            return;
        }


        // =================================================
        // DISABLE BUTTON
        // =================================================

        updateButton.disabled = true;

        updateButton.innerHTML = `
            <span class="spinner-border spinner-border-sm"></span>
            Updating...
        `;


        try {


            // =============================================
            // UPDATE SUPABASE AUTH METADATA
            // =============================================

            const { error: updateError } =
                await db.auth.updateUser({

                    data: {

                        full_name: fullName,

                        phone: phone,

                        username: username

                    }

                });


            if (updateError) {

                throw updateError;

            }


            // =============================================
            // SUCCESS
            // =============================================

            successMessage.textContent =
                "Profile updated successfully.";

            successMessage.classList.remove("d-none");


        } catch (error) {

            console.error("Profile update error:", error);


            errorMessage.textContent =
                error.message ||
                "Unable to update profile.";

            errorMessage.classList.remove("d-none");


        } finally {


            // =============================================
            // ENABLE BUTTON
            // =============================================

            updateButton.disabled = false;

            updateButton.innerHTML = `
                <i class="bi bi-save"></i>
                Update Profile
            `;

        }

    });

});