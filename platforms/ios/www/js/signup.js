function clearSignup() {
    var user = document.getElementById("in-username-signup");
    var password = document.getElementById("in-password1");
    var password2 = document.getElementById("in-password2");
    var name = document.getElementById("in-name");
    var lastname = document.getElementById("in-lastname");
    var email = document.getElementById("in-email");
    
    user.value = "";
    password.value = "";
    password2.value = "";
    name.value = "";
    lastname.value = "";
    email.value = "";
    
    console.log("clearing fields");
    
}
