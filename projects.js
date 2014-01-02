$(document).ready(function() {
  // If we don't have an authentication token, redirect to the login pag 
  if (_.isUndefined($.cookie('token'))) window.location = '/trade/login.html#destination=' + encodeURIComponent(window.location.pathname);
  // Fetch our project list item template
  $.ajax({ url: "http://rg.cape.io/templates/mini/project_list.html" })
  .done(function(project_list) {
    // Compile template
    var template = Hogan.compile(project_list);
    // Retrieve the list of lists
    $.getJSON('http://rg.cape.io/_api/items/_index/' + $.cookie('uid') + '/list', { data_only: true }, function(data) {
      // Process each of the lists
      _.forEach(data, function(list) {
        $('ul.existing-projects').append(template.render(list));
        // Change the name of a list
        $('#'+list._id+' button.edit-list').on('click touch', function(e) {
          e.preventDefault();
          $(this).siblings('form').show().on('submit', function(ev) {
            ev.preventDefault();
            console.log("Change name " + $(this).find('input[type=text]').val());
          });
          $(this).siblings('.list-name').hide();
          $(this).hide();
        });
        // Remove a list
        $('#'+list._id+' button.delete-list').on('click touch', function(e) {
          e.preventDefault();
          console.log("Delete "+list._id);
          $('#'+list._id).remove();
          $.ajax({
            url: 'http://rg.cape.io/_api/items/_index/list/'+list._id,
            type: 'DELETE',
            success: function(result) {
              $('#'+list._id).remove();
              console.log(result);
            },
            fail: function(result) {
              console.log(result);
            }
          });
        });
      });
      // Once we have all of the items, make them sortable
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
                location.reload();
              }
              console.log(data);
            }
          });
        }
      });
    });
  });
}); 