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
                          function(data, obj, res) {
                            console.log(data);
                            $.cookie('session', '', { expires: 7, path: '/', domain: '.rg.cape.io' });
                            console.log($.cookie('session'));
                          });
  });
});