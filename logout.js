$(document).ready(function() {
  var token = $.cookie('token');
  $.removeCookie('uid', { path: '/', domain: '.rg.cape.io' });
  $.removeCookie('token', { path: '/', domain: '.rg.cape.io' });

  $.ajax({
    url: 'http://rg.cape.io/logout',
    type: 'GET',
    headers: { Authorization: 'bearer '+token },
    contentType: 'application/json',
    success: function(result) {
      window.location = document.referrer;
    },
    fail: function(result) {
      window.location = document.referrer;
    },
    error: function(result) {
      window.location = document.referrer;
    }
  });
});