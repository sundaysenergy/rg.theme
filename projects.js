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
            var token = 'bearer ' + $.cookie('token');
            var projectname = $(this).find('input[type=text]').val();
            $.ajax({
              url: 'http://rg.cape.io/_api/items/_index/list/'+list._id,
              type: 'PUT',
              data: { info: { name:projectname } },
              headers: { Authorization: token },
              success: function(result) {
                location.reload();
                console.log(result);
              },
              fail: function(result) {
                console.log(result);
              }
            });
          });
          $(this).siblings('.list-name').hide();
          $(this).hide();
        });
        // Remove a list
        $('#'+list._id+' button.delete-list').on('click touch', function(e) {
          e.preventDefault();
          console.log("Delete "+list._id);
          var token = 'bearer ' + $.cookie('token');
          $.ajax({
            url: 'http://rg.cape.io/_api/items/_index/list/'+list._id,
            type: 'DELETE',
            headers: { Authorization: token },
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
      var sortable = new Sortable($('.existing-projects')[0], {
        onUpdate: function (evt) {
          var obj = { entity: [] };
          $('ul.existing-projects li').each(function(i) {
            var id = $(this).attr('id');
            var position = i+1;
            obj.entity[id] = position;
          });
          var token = 'bearer ' + $.cookie('token');
          $.ajax({
            //  /_api/items/_index/752a94d7-3394-460d-9709-0afa4848e973/list
            url: 'http://rg.cape.io/_api/items/_index/' + $.cookie('uid') + '/list',
            type: 'PUT',
            data: JSON.stringify(obj),
            headers: { Authorization: token },
            contentType: 'application/json',
            success: function(result) {
              //location.reload();
              console.log(result);
            },
            fail: function(result) {
              console.log(result);
            }
          });
          console.log(obj);
        }
      });
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
              if (_.isUndefined(data._id) == false) location.reload();
            }
          });
        }
      });
    });
  });
});