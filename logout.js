$(document).ready(function() {
  var token = $.cookie('token');
  $.removeCookie('uid', { path: '/'});
  $.removeCookie('token', { path: '/'});

  $.ajax({
    url: rg_options.api + '/logout',
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