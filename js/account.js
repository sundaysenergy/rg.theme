$(document).ready(function() {
  // Redirect to login page if we don't have a token
  if (_.isUndefined($.cookie('token'))) window.location = '/trade/login.html#destination=' + encodeURIComponent(window.location.pathname);
  $.ajaxSetup({ cache: false });
  // Fetch the template
  $.ajax({ url: rg_options.api + "/templates/mini/account.html" })
  .done(function(template) {
    var account_info = Hogan.compile(template);
    // Fetch the user information
    $.ajax({ url: rg_options.api + '/_api/user/_entity/'+$.cookie('uid')})
    .done(function(user_info) {
      // Add the compiled and rendered template to the page
      $('.account-information').html(account_info.render(user_info));
      // Set default to inline editing for bootstrap editable
      $.fn.editable.defaults.mode = 'inline';
      // Make fields editable
      $('.account-information .editable').editable({
          type: 'select',
          ajaxOptions: {
            type: 'put',
            dataType: 'json'
          },
          pk: 1,
          url: function(params) {
            var obj = {};
            obj[params.name] = params.value;
            var token = $.cookie('token');
            $.ajax({
              url: rg_options.api + "/_api/user/_entity/"+$.cookie("uid")+"?merge=true",
              type: 'PUT',
              data: JSON.stringify(obj),
              headers: { Authorization: token },
              contentType: 'application/json',
              success: function(result) {
                console.log(result);
              },
              fail: function(result) {
                console.log(result);
              }
            });
            return;
          }
      });
    });
  });
});