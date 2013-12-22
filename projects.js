$(document).ready(function() {
  var template = Hogan.compile('<div class="new-project alert alert-dismissable" style="background: #fff; position:fixed; top:40%;left:35%; width: 30%;"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><form class="form-inline" role="form"><div class="form-group"><label class="sr-only" for="new-project-name">Email address</label><input type="text" class="form-control" id="new-project-name" placeholder="Project name"></div><button type="submit" class="btn btn-default">Create</button></form></div>')
  $('#project-new').on('click touch', function(e) {
    if ($('.new-project').length == 0) {
      $('body').append(template.render({}));
    }
  });
});