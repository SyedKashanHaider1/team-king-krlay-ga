/**
 * Authentication — Email/Password + JWT Refresh
 * AI Marketing Command Center
 */
window.Auth = {
  user: null,

  init() {
    // Load saved user and token
    const savedUser = Store.get("user");
    const token = localStorage.getItem("mcc_token");
    if (savedUser && token) {
      this.user = savedUser;
      API.setToken(token);
      this._verifyTokenAndShowApp();
    } else {
      this._showLogin();
    }
  },

  _verifyTokenAndShowApp() {
    // Verify token by calling /me
    API.getMe().then(() => {
      this._showApp();
    }).catch(() => {
      this.logout(true); // Silent logout if invalid
    });
  },

  showLogin() {
    document.getElementById("login-tab").classList.add("active");
    document.getElementById("signup-tab").classList.remove("active");
    document.getElementById("login-form").classList.remove("hidden");
    document.getElementById("signup-form").classList.add("hidden");
  },

  showSignup() {
    document.getElementById("signup-tab").classList.add("active");
    document.getElementById("login-tab").classList.remove("active");
    document.getElementById("signup-form").classList.remove("hidden");
    document.getElementById("login-form").classList.add("hidden");
  },

  async signup(event) {
    event.preventDefault();
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;

    const btn = document.getElementById("signup-btn");
    btn.classList.add("btn-loading");
    btn.disabled = true;

    try {
      const data = await API.signup({ name, email, password });
      this._loginSuccess(data);
    } catch (err) {
      Toast.error("Signup Failed", err.message);
    } finally {
      btn.classList.remove("btn-loading");
      btn.disabled = false;
    }
  },

  async login(event) {
    event.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    const btn = document.getElementById("login-btn");
    btn.classList.add("btn-loading");
    btn.disabled = true;

    try {
      const data = await API.login({ email, password });
      this._loginSuccess(data);
    } catch (err) {
      Toast.error("Login Failed", err.message);
    } finally {
      btn.classList.remove("btn-loading");
      btn.disabled = false;
    }
  },

  _loginSuccess(data) {
    this.user = data.user;
    API.setToken(data.access_token);
    Store.set("user", data.user);
    this._showApp();
    Toast.success(`Welcome, ${data.user.name}!`, "Your Marketing Command Center is ready");
  },

  logout(silent = false) {
    try {
      API.logout();
    } catch (_) {}
    this.user = null;
    API.clearToken();
    Store.remove("user");
    Store.remove("current_page");
    if (!silent) Toast.info("Logged out", "See you next time!");
    this._showLogin();
    // Reset app state
    if (window.AppRouter) AppRouter.resetState();
  },

  _showLogin() {
    document.getElementById("login-page").style.display = "flex";
    document.getElementById("app-page").classList.remove("visible");
  },

  _showApp() {
    document.getElementById("login-page").style.display = "none";
    document.getElementById("app-page").classList.add("visible");
    if (window.AppRouter) AppRouter.init();
  }
};
