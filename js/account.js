$(document).ready(function() {
  $.ajax({ url: "http://rg.cape.io/templates/mini/account.html" })
  .done(function(template) {
    console.log("step #1");
    $.ajax({ url: '/_api/db/_entity/users/'+$.cookie('uid')+'/profile.json'})
    .done(function(user_info)) {
      console.log(user_info);
      console.log(template);
    });
  });
});