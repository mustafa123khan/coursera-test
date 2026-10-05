document.addEventListener("DOMContentLoaded", async function () {

    // ==========================================
    // GET NAVBAR ELEMENTS
    // ==========================================

    const loginNavItem = document.getElementById("loginNavItem");
    const signupNavItem = document.getElementById("signupNavItem");
    const userMenu = document.getElementById("userMenu");
    const userName = document.getElementById("userName");
    const logoutButton = document.getElementById("logoutButton");


    // ==========================================
    // CHECK CURRENT LOGIN SESSION
    // ==========================================

    try {

        const {
            data: { session },
            error
        } = await db.auth.getSession();


        if (error) {

            console.error("Session error:", error);
            return;

        }


        // ==========================================
        // USER IS LOGGED IN
        // ==========================================

        if (session && session.user) {

            console.log("User is logged in:", session.user.email);

            console.log(
                "User metadata:",
                session.user.user_metadata
            );


            // ------------------------------------------
            // HIDE LOGIN
            // ------------------------------------------

            if (loginNavItem) {

                loginNavItem.classList.add("d-none");

            }


            // ------------------------------------------
            // HIDE SIGNUP
            // ------------------------------------------

            if (signupNavItem) {

                signupNavItem.classList.add("d-none");

            }


            // ------------------------------------------
            // SHOW USER MENU
            // ------------------------------------------

            if (userMenu) {

                userMenu.classList.remove("d-none");

            }


            // ==========================================
            // GET USER NAME
            // ==========================================

            const metadata = session.user.user_metadata || {};

            const fullName = metadata.full_name;
            const username = metadata.username;
            const email = session.user.email;


            // ==========================================
            // DISPLAY USER NAME
            // ==========================================

            if (userName) {

                if (fullName && fullName.trim() !== "") {

                    userName.textContent = fullName;

                } 
                else if (username && username.trim() !== "") {

                    userName.textContent = username;

                } 
                else if (email) {

                    userName.textContent = email.split("@")[0];

                } 
                else {

                    userName.textContent = "My Account";

                }

            }

        }


        // ==========================================
        // USER IS NOT LOGGED IN
        // ==========================================

        else {

            console.log("No user logged in.");


            if (loginNavItem) {

                loginNavItem.classList.remove("d-none");

            }


            if (signupNavItem) {

                signupNavItem.classList.remove("d-none");

            }


            if (userMenu) {

                userMenu.classList.add("d-none");

            }

        }


        // ==========================================
        // LOGOUT
        // ==========================================

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                async function () {

                    try {

                        const { error } =
                            await db.auth.signOut();


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


                        alert(
                            "You have been logged out successfully."
                        );


                        window.location.href = "index.html";

                    } 
                    catch (logoutError) {

                        console.error(
                            "Unexpected logout error:",
                            logoutError
                        );

                        alert(
                            "Something went wrong while logging out."
                        );

                    }

                }
            );

        }


    } 
    catch (error) {

        console.error(
            "Authentication error:",
            error
        );

    }

});