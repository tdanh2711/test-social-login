(function(d, s, id) {                      // Load the SDK asynchronously
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

window.fbAsyncInit = function() {
    FB.init({
      appId            : '259912551918103',
      autoLogAppEvents : true,
      xfbml            : true,
      version          : 'v7.0'
    });

    // Check social login
    checkSocialLogin().then(values => {
        if (values.includes(true)) {
            // User has logged in (Fb or Gg)
            // --> Show buttons logout
            document.getElementById('social-logout').classList.remove('d-none');
            
            // If user not logged in Fb --> Hide buttons logout Fb
            // If user not logged in Gg --> Hide buttons logout Gg
            [fbLoggedIn, ggLoggedIn] = values;
            if (!fbLoggedIn) document.querySelectorAll('.btn-fb-logout').forEach(e =>  e.classList.add('d-none'));
            if (!ggLoggedIn) document.querySelectorAll('.btn-gg-logout').forEach(e =>  e.classList.add('d-none'));
        } else {
            // User has not logged in
            // --> Show buttons login
            document.getElementById('social-login').classList.remove('d-none');
        }
    });
};


/** @type {() => Promise<boolean>} */
const checkFbLogin = () => new Promise(
    resolve => FB.getLoginStatus(
        resp => resolve(resp.status === 'connected')
    )
);

/** @type {() => Promise<boolean>} */
const checkGgLogin = () => new Promise(
    resolve => setTimeout(() => resolve(false), 2000)
);

/** @type {() => Promise<[boolean, boolean]>} */
const checkSocialLogin = () => new Promise(
    resolve => Promise.all([checkFbLogin(), checkGgLogin()]).then(
        values => resolve(values)
    )
);
