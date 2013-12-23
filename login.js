$(document).ready(function() {
  $('form').on('submit', function(e) {
    e.preventDefault();
    var username = $('input[type=email]').val();
    var password = $('input[type=password]').val();
    var posting = $.post('http://rg.cape.io/login', 
                          {
                            username: username,
                            password: password
                          }, 
                          function(data) {
                            console.log(data);
                            baseDomain = '.rg.cape.io',
                            expireAfter = new Date();
                            expireAfter.setDate(expireAfter.getDate() + 7);
                            document.cookie="id={'id':'" + '' + "'}; domain=" + baseDomain + "; expires=" + expireAfter + "; path=/";
                            console.log(data);
                          });
  })
  .fail(function(data) {
    console.log("It failed. shucks");
  });
});