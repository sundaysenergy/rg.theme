$(document).ready(function() {
  // If we don't have an authentication token, redirect to the login pag 
  if (_.isUndefined($.cookie('token'))) window.location = '/trade/login.html#destination=' + encodeURIComponent(window.location.pathname);
  // Get a list of lists and populate the existing-projects
  $.getJSON('http://rg.cape.io/_api/items/_index/user_list/' + $.cookie('uid') + '/?data_only=true', {}, function(data) {
    _.forEach(data, function(list) {
      $('ul.existing-projects').append('<li id="' + list._id + '">' + list.info.name + '<button class="delete-list" style="position: absolute; right: 0">&times;</button></li>');
      $('#'+list._id+' button.delete-list').on('click touch', function(e) {
        e.preventDefault();
        console.log("Delete "+list._id);
        $.ajax({
          url: 'http://rg.cape.io/_api/items/_index/list/'+list._id,
          type: 'DELETE',
          success: function(result) {
            console.log(result);
              // Do something with the result
          },
          fail: function(result) {
            console.log(result);
          }
        });
      });
    });
    var sortable = new Sortable($('.existing-projects')[0]);
  });
  // Things to do to create a new project
  $('#project-new').on('click touch', function(e) {
    $('.new-project').show();
    $('#new-project-name').closest('form').on('submit', function(e) {
      e.preventDefault();
      var projectname = $('#new-project-name').val();
      var token = 'bearer ' + $.cookie('token');
      var $div = $(this).closest('div');
      // If we have a token and a project name, submit the project
      if ((_.isUndefined(token) == false) && (projectname.length > 0)) {
        $.ajax({
          url: 'http://rg.cape.io/_api/items/_index/list',
          type: 'post',
          data: { info: { name:projectname } },
          headers: { Authorization: token },
          dataType: 'json',
          success: function (data) {
            // If the list was created, remove the form and show confirmation
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