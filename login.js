$(document).ready(function() {
  $('form').on('submit', function(e) {
    var template = Hogan.compile('<div style="position:fixed; background: #fff; height: 20%; top:40%; left:35%; width: 30%;" class="alert alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>{{message}}</div>');
    e.preventDefault();
    var username = $('input[type=email]').val();
    var password = $('input[type=password]').val();
    var posting = $.post('http://rg.cape.io/login', 
                          {
                            username: username,
                            password: password
                          }, 
                          function(data) {
                            $.cookie('token', data.token, { expires: 1, path: '/', domain: '.rg.cape.io' });
                            $.cookie('uid', data.uid, { expires: 1, path: '/', domain: '.rg.cape.io' });
                            $('body').append(template.render({message:'Login succeed. Your token has been stored as a cookie!'}));
                            $('form').hide();
                            if (_.isUndefined(hash.get('destination')) == false) window.location = hash.get('destination');
                          })
                          .fail(function(data) {
                            if (data.status) {
                              $('body').append(template.render({message:'Login failed.'}));
                            }
                          });
  });
});