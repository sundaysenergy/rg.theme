$(document).ready(function() {
  $.ajax({ url: "http://rg.cape.io/templates/mini/account.html" })
  .done(function(template) {
    var account_info = Hogan.compile(template);
    $.ajax({ url: '/_api/db/_entity/user/'+$.cookie('uid')+'/profile.json'})
    .done(function(user_info) {
      $('.account-information').html(account_info.render(user_info));
    });
  });
});