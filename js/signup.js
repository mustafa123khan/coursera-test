// ===============================
// SUPABASE SIGNUP
// ===============================

const signupForm = document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        // Get form values
        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        const successMessage = document.getElementById("successMessage");
        const errorMessage = document.getElementById("errorMessage");

        // Hide old messages
        successMessage.classList.add("d-none");
        errorMessage.classList.add("d-none");

        // Check password
        if (password !== confirmPassword) {

            errorMessage.textContent = "Passwords do not match.";
            errorMessage.classList.remove("d-none");

            return;
        }

        // Check password length
        if (password.length < 6) {

            errorMessage.textContent =
                "Password must be at least 6 characters.";

            errorMessage.classList.remove("d-none");

            return;
        }

        // Check phone number
        if (!/^[0-9]{10}$/.test(phone)) {

            errorMessage.textContent =
                "Please enter a valid 10-digit mobile number.";

            errorMessage.classList.remove("d-none");

            return;
        }

        try {

            // Create Supabase account
            const { data, error } = await db.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {
                        full_name: fullName,
                        phone: phone,
                        username: username
                    }

                }

            });

            // Supabase error
            if (error) {

                console.error("Signup error:", error);

                errorMessage.textContent = error.message;
                errorMessage.classList.remove("d-none");

                return;
            }

            // Success
            successMessage.textContent =
                "Account created successfully! Please check your email and confirm your account before logging in.";

            successMessage.classList.remove("d-none");

            // Clear form
            signupForm.reset();

            console.log("Supabase signup successful:", data);

        } catch (error) {

            console.error("Unexpected error:", error);

            errorMessage.textContent =
                "Something went wrong. Please try again.";

            errorMessage.classList.remove("d-none");
        }

    });

}