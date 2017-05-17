const passport = require("passport");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const crypto = require("crypto");
const promisify = require("es6-promisify");

exports.login = passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlask: "Failed Login!",
  successRedirect: "/",
  successFlash: "You are now logged in!"
});

exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "You are now logged out!");
  res.redirect("/");
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash("error", "Ooops you must be logged in to do that!");
  res.redirect("/login");
};

exports.forgot = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash("error", "No account with that email exists.");
    return res.redirect("/login");
  }

  user.resetPassowordToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordExpires = Date.now() + 3600000; //1 hour from now

  await user.save();

  const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPassowordToken}`;
  req.flash(
    "success",
    `You have been emailed a password reset link ${resetUrl}`
  );
  res.redirect("/login");
};

exports.reset = async (req, res) => {
  const token = req.params["token"];
  const user = User.findOne({
    resetPassowordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash("error", "Password reset is invalid or has expired.");
    return res.redirect("/login");
  }
  res.render("reset", { title: "Reset your Password." });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body["password-confirm"]) {
    next();
    return;
  }
  req.flash("error", "Passwords do not match!");
  res.redirect("back");
};

exports.update = async (req, res) => {
  const token = req.params["token"];
  const user = await User.findOne({
    resetPassowordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash("error", "Password reset is invalid or has expired.");
    return res.redirect("/login");
  }

  console.log('##################',user);
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);

  user.resetPassowordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatededUser = await user.save();
  await req.login(updatededUser);
  req.flash("success", "Your password has been reset! You are now logged in!");
  res.redirect("/");
};
