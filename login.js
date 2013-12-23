$(document).ready(function() {
  $('form').on('submit', function(e) {
    e.preventDefault();
    console.log("help");
    var posting = $.post('http://rg.cape.io/login', 
                          {
                            username: $('input[type=email]').val(),
                            password: $('input[type=password]').val()
                          }, 
                          function(data) {
                            console.log("help");
                            console.log("fdjkl");
                            console.log(data);
                            baseDomain = '.localhost',
                            expireAfter = new Date();
                            expireAfter.setDate(expireAfter.getDate() + 7);
                            document.cookie="id={'id':'" + '' + "'}; domain=" + baseDomain + "; expires=" + expireAfter + "; path=/";
                            console.log(data);
                          });
  });
});