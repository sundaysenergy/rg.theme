$(document).ready(function() {
  $.removeCookie('uid', { path: '/', domain: '.rg.cape.io' });
  $.removeCookie('token', { path: '/', domain: '.rg.cape.io' });
  window.location = document.referrer;
});