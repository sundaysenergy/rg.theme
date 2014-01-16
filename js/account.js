$(document).ready(function() {
  $.ajax({ url: "http://rg.cape.io/templates/mini/account.html" })
  .done(function(template) {
    var account_info = Hogan.compile(template);
    $.ajax({ url: 'http://rg.cape.io/_api/db/_entity/user/'+$.cookie('uid')+'/profile.json'})
    .done(function(user_info) {
      $('.account-information').html(account_info.render(user_info));
      $.fn.editable.defaults.mode = 'inline';
      $('.account-information .editable').editable({
          type: 'select',
          ajaxOptions: {
            type: 'put',
            dataType: 'json'
          },
          pk: 1,
          url: function(params) {
            console.log(params);
            var obj = {};
            obj[params[name]] = params.value;
            var token = $.cookie('token');
            console.log(obj);
            $.ajax({
              url: "http://rg.cape.io/_api/db/_entity/user/"+$.cookie("uid")+"/profile.json?merge=true",
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