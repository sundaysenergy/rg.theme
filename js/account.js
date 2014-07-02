$(document).ready(function() {
  var token = $.cookie('token');
  // Redirect to login page if we don't have a token
  if (!token) window.location = '/trade/login.html#destination=' + encodeURIComponent(window.location.pathname);

  // Fetch the template
  var account_info = Hogan.compile($('#details-template').html());
  console.log(rg_options.api);
  var url_path = rg_options.api + '/_api/user/'
  var pk = $.cookie('uid');

  // Fetch the user information
  $.ajaxSetup({ cache: false });
  $.ajax({ url: url_path+pk})
  .done(function(user_info) {
    // Add the compiled and rendered template to the page
    $('.account-information').html(account_info.render(user_info));
    // Set default options.
    $.fn.editable.defaults.pk = pk;
    $.fn.editable.defaults.mode = 'inline';
    $.fn.editable.defaults.url = url_path;
    $.fn.editable.defaults.ajaxOptions = {
      type: 'PUT',
      dataType: 'json',
      headers: { Authorization: token }
    }

    // Make fields editable
    $('.account-information .editable').editable({});
    $('.account-information #address').editable({value:user_info});
  });
});
