$(document).ready(function() {
  var template = Hogan.compile('<div class="new-project alert alert-dismissable" style="background: #fff; position:fixed; top:40%;left:35%; width: 30%;"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><form class="form-inline" role="form"><div class="form-group"><label class="sr-only" for="new-project-name">Email address</label><input type="text" class="form-control" id="new-project-name" placeholder="Project name"></div><button type="submit" class="btn btn-default">Create</button></form></div>')
  $('#project-new').on('click touch', function(e) {
    if ($('.new-project').length == 0) {
      $('body').append(template.render({}));
      $('#new-project-name').closest('form').on('submit', function(e) {
        e.preventDefault();
        var projectname = $('#new-project-name').val();
        var token = 'token ' + $.cookie('token');
        var $div = $(this).closest('div');
        if (_.isUndefined(token) == false) {
          $.post('http://rg.cape.io/_api/items/_list', { info: { Authorization:token, name: projectname } }, function(data) {
            if (_.isUndefined(data._id) == false) {
              $div.find('form').remove();
              $div.append('List created with id of ' + data._id);
            }
            console.log(data);
          });
        }
      });
    }
  });
});