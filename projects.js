$(document).ready(function() {
  // If we don't have an authentication token, redirect to the login page
  if (_.isUndefined($.cookie('token'))) window.location = '/trade/login.html#destination=' + encodeURIComponent(window.location.pathname);

  // Fetch our project list item template
  $.ajax({ url: rg_options.api + "/templates/mini/project_list.html" })
  .done(function(project_list) {
    // Compile template and retrieve the list of lists
    var template = Hogan.compile(project_list);
    $.getJSON(rg_options.api + '/_api/items/_index/' + $.cookie('uid') + '/list', { data_only: true }, function(data) {
      
      /**** PROCESS EACH OF THE LISTS ****/
      _.forEach(data, function(list) {
        var longurl = rg_options.api+'/collection.html#lid='+list._id+'&name='+encodeURIComponent(list.info.name);

        list.sharelink = longurl;
        $('ul.existing-projects').append(template.render(list));

        // Automatically select share links when you click on the input
        $('input.project-share').on('click touch', function(e) {
          $(this).select();
        });

        // Change the name of a list
        $('#'+list._id+' button.edit-list').on('click touch', function(e) {
          e.preventDefault();
          // Handle form submission
          $(this).siblings('form').show().on('submit', function(ev) {
            ev.preventDefault();
            var token = 'bearer ' + $.cookie('token');
            var projectname = $(this).find('input[type=text]').val();
            $.ajax({
              url: rg_options.api + '/_api/items/_index/list/'+list._id,
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
          // Hide the display name and the edit button since we're showing the form
          $(this).siblings('.list-name').hide();
          $(this).hide();
        });

        // Expand the list
        $('#'+list._id+' .list-name').on('click touch', function(e) {
          $('input.project-share').hide();
          var longurl = $(this).parent().data('longurl');
          var $list = $(this).parent();
          var new_list = $(this).parent().find('ul.trade-items').length == 0;
          if (new_list) {
            $.getJSON(
              "http://api.bitly.com/v3/shorten?callback=?",
              { 
                "format": "json",
                "apiKey": "R_b83cfe54d0ecae82a9086a21fe834814",
                "login": "sundaysenergy",
                "longUrl": longurl
              }
            )
            .done(function(response) {
              $list.find('input.project-share').val(response.data.url).show();
            });
          }
          // Remove existing lists, including self
          $('ul.trade-items').remove();
          $('div.trade-items-noresults').remove();
          // If the there weren't any trade-items lists inside of element's parents, make one
          if (new_list) {
            $.ajax({ url: rg_options.api + "/templates/mini/project_list_items.html" })
            .done(function (project_items) {
              // Compile the template for the list
              var template = Hogan.compile(project_items);
              $.getJSON(rg_options.api + '/_api/items/_index/list/'+list._id+'/index.json',{}, function(data) {
                // Render the template with the objects from the list
                $('#'+list._id+'_items').html(template.render({ items: _.keys(data) }));
                // Handle removing items from the list
                $('button.remove-trade-item').on('click touch', function(e) {
                  e.preventDefault();
                  var id = $(this).siblings('img').data('id');
                  var $div = $(this).parent();
                  var token = 'bearer ' + $.cookie('token');
                  $.ajax({
                    url: rg_options.api + '/_api/items/_index/list/' + list._id + '/' + id,
                    type: 'DELETE',
                    headers: { Authorization: token },
                    success: function(result,i,o) {
                      $div.remove();
                      console.log(result,i,o);
                    },
                    fail: function(result,i,o) {
                      console.log(result,i,o);
                    }
                  });
                });
                // Handle sorting items in the list
                var item_sortable = new Sortable($('.trade-items')[0], {
                  onUpdate: function (evt) {
                    var obj = { entity: {} };
                    // Collect the order of the items and build an object 
                    $('ul.trade-items > li').each(function(i) {
                      console.log($(this));
                      var id = $(this).find('img').data('id');
                      var position = i+1;
                      obj.entity[id] = position;
                    });
                    // Send a request to cape with the updated order
                    var token = 'bearer ' + $.cookie('token');
                    $.ajax({
                      url: rg_options.api + '/_api/items/_index/list/'+list._id,
                      type: 'PUT',
                      data: JSON.stringify(obj),
                      headers: { Authorization: token },
                      contentType: 'application/json',
                      success: function(result) {
                        console.log(result);
                      },
                      fail: function(result) {
                        console.log(result);
                      }
                    });
                  }
                });
              })
              .fail(function() {
                $('#'+list._id+'_items').html(template.render({ nomatch: true }));
              });
            });
          }
        });
        // Remove a list
        $('#'+list._id+' button.delete-list').on('click touch', function(e) {
          e.preventDefault();
          var token = 'bearer ' + $.cookie('token');
          $.ajax({
            url: rg_options.api + '/_api/items/_index/list/'+list._id,
            type: 'DELETE',
            headers: { Authorization: token },
            success: function(result) {
              // Remove the item from the DOM
              $('#'+list._id).remove();
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
          var obj = { entity: {} };
          $('ul.existing-projects > li').each(function(i) {
            var id = $(this).attr('id');
            var position = i+1;
            obj.entity[id] = position;
          });
          var token = 'bearer ' + $.cookie('token');
          $.ajax({
            url: rg_options.api + '/_api/items/_index/' + $.cookie('uid') + '/list',
            type: 'PUT',
            data: JSON.stringify(obj),
            headers: { Authorization: token },
            contentType: 'application/json',
            success: function(result) {
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
            url: rg_options.api + '/_api/items/_index/list',
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