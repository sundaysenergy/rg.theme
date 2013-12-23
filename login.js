$(document).ready(function() {
  $('form').on('submit', function(e) {
    var template = Hogan.compile('<div style="position:fixed; top:40%; left:35%; width: 30%;" class="alert alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>{{message}}</div>');
    e.preventDefault();
    var username = $('input[type=email]').val();
    var password = $('input[type=password]').val();
    var posting = $.post('http://rg.cape.io/login', 
                          {
                            username: username,
                            password: password
                          }, 
                          function(data, obj, res) {
                            $.cookie('token', data.token, { expires: 7, path: '/', domain: '.rg.cape.io' });
                            if (data.token == false) {
                              $('body').append(template.render({message:'Login succeed. Your token has been stored as a cookie!'}));
                            } else {
                              $('body').append(template.render({message:'Login failed.'}));
                            }
                          });
  });
});