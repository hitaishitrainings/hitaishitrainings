document.addEventListener("DOMContentLoaded", () => {
  const student = JSON.parse(localStorage.getItem("loggedInUser"));
  const trainer = JSON.parse(localStorage.getItem("trainerUser"));

  const userDisplay = document.getElementById("header-username");
  const userImage = document.getElementById("header-userimage");

  const studentLoginLink = document.getElementById("login-link");
  const trainerLoginLink = document.getElementById("trainer-login-link");
  const profileDropdown = document.getElementById("profile-dropdown");

  // Determine which user is logged in
  let currentUser = student || trainer;
  let userType = student ? "student" : trainer ? "trainer" : null;

  if (currentUser) {
    // Show greeting
    if (userDisplay) userDisplay.innerText = `👋 Hello, ${currentUser.fullname}`;

    // Show profile image
    // if (userImage) {
    //   let imagePath = "default-avatar.png"; // default fallback

    //   if (currentUser.profileImage) {
    //     // If image path already starts with /uploads or http/https, use it directly
    //     if (
    //       currentUser.profileImage.startsWith("/uploads") ||
    //       currentUser.profileImage.startsWith("http")
    //     ) {
    //       imagePath = currentUser.profileImage;
    //     } else {
    //       // Otherwise, assume it's just a filename in uploads folder
    //       imagePath = `/uploads/${currentUser.profileImage}`;
    //     }
    //   }

    //   userImage.src = imagePath;
    //   userImage.style.display = "inline-block";
    // }
if (userImage) {
  let imagePath = "/uploads/default-trainer.png"; // default fallback

  if (currentUser.profileImage) {
    // If image path already starts with /uploads or http/https, use it directly
    if (
      currentUser.profileImage.startsWith("/uploads") ||
      currentUser.profileImage.startsWith("http")
    ) {
      imagePath = currentUser.profileImage;
    } else {
      // Otherwise, assume it's just a filename in uploads folder
      imagePath = `/uploads/${currentUser.profileImage}`;
    }
  }

  userImage.src = imagePath;
  userImage.style.display = "inline-block";

  // Add onerror fallback to default if file missing
  userImage.onerror = function () {
    this.onerror = null;
    this.src = "/uploads/default-trainer.png";
  };
}

    // Hide login links
    if (studentLoginLink) studentLoginLink.style.display = "none";
    if (trainerLoginLink) trainerLoginLink.style.display = "none";

    // Show profile dropdown
    if (profileDropdown) profileDropdown.style.display = "block";

    // Logout handling
    const logoutLink = document.getElementById("logout-link");
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (userType === "student") localStorage.removeItem("loggedInUser");
        else if (userType === "trainer") localStorage.removeItem("trainerUser");
        window.location.reload();
      });
    }
  } else {
    // No user logged in
    if (userDisplay) userDisplay.innerText = "";
    if (userImage) userImage.style.display = "none";
    if (studentLoginLink) studentLoginLink.style.display = "inline-block";
    if (trainerLoginLink) trainerLoginLink.style.display = "inline-block";
    if (profileDropdown) profileDropdown.style.display = "none";
  }
});
