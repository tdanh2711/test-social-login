function statusChangeCallback(response) {
    console.log(response);
}

FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
});