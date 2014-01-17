$(document).ready(function() {
  $.removeCookie('uid');
  $.removeCookie('token');
  window.location = document.referrer;
});