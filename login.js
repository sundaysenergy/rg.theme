$(document).ready(function() {
  $('form').on('submit', function(e) {
    var template = Hogan.compile('<div class="login-failed alert alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><p>{{message}}</p></div>');
    e.preventDefault();
    var username = $('input[type=text]').val();
    var password = $('input[type=password]').val();
    var posting = $.post(rg_options.api + '/_login',
                          { username: username, password: password },
                          function(data) {
                            $.cookie('token', data.token, { expires: 1, path: '/'});
                            $.cookie('uid', data.uid, { expires: 1, path: '/'});
                            $('form').hide();
                            if (_.isUndefined(hash.get('destination')) == false) {
                              window.location = hash.get('destination');
                            } else {
                              window.location = "/trade/account.html";
                            }
                          })
                          .fail(function(data) {
                            if (data.status) {
                              $('main.container div.trade-login').append(template.render({message:'Login failed'}));
                            }
                          });
  });
});