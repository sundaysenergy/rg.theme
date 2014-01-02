$(document).ready(function() {
  if (_.isUndefined($.cookie('token'))) window.location = '/trade/login.html#destination=' + encodeURIComponent(window.location.pathname);
  $.getJSON('http://rg.cape.io/_api/items/_index/user_list/' + $.cookie('uid') + '/index.json', {}, function(data) {
    _.forEach(_.keys(data), function(list) {
      $('ul.existing-projects').append('<li>' + list + '</li>');
      console.log(list);
      //console.log(item);
    });
  });
  $('#project-new').on('click touch', function(e) {
    $('.new-project').show();
    $('#new-project-name').closest('form').on('submit', function(e) {
      e.preventDefault();
      var projectname = $('#new-project-name').val();
      var token = 'bearer ' + $.cookie('token');
      var $div = $(this).closest('div');
      if ((_.isUndefined(token) == false) && (projectname.length > 0)) {
        $.ajax({
          url: 'http://rg.cape.io/_api/items/_index/list',
          type: 'post',
          data: { info: { name:projectname } },
          headers: { Authorization: token },
          dataType: 'json',
          success: function (data) {
            if (_.isUndefined(data._id) == false) {
              $div.find('form').remove();
              $div.append('List created with id of ' + data._id);
            }
            console.log(data);
          }
        });
      }
    });
  });
});