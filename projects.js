$(document).ready(function() {
  // If we don't have an authentication token, redirect to the login page
  if (_.isUndefined($.cookie('token'))) window.location = '/trade/login.html#destination=' + encodeURIComponent(window.location.pathname);

  var token = 'bearer ' + $.cookie('token');

  // Fetch our project list item template

  // Compile template and retrieve the list of lists
  var template = Hogan.compile($('#template-list').html());
  var template_project_items = Hogan.compile($('#template-list-items').html());
  $.ajaxSetup({
    cache: false,
    dataType: 'json',
    headers: { Authorization: token }
  });
  $.getJSON(rg_options.api + '/_api/list/_me', {}, function(data) {
    /**** PROCESS EACH OF THE LISTS ****/
    _.forEach(data, function(list) {
      list.name = list.name || '';
      list.sharelink = rg_options.cdn+'/collection.html#lid='+list.id+'&name='+encodeURIComponent(list.name);
      var insert_html = template.render(list);
      //console.log(template);
      $('ul.existing-projects').append(insert_html);

      // Automatically select share links when you click on the input
      $('input.project-share').on('click touch', function(e) {
        $(this).select();
      });

      // Change the name of a list
      $('#'+list.id+' button.edit-list').on('click touch', function(e) {
        e.preventDefault();
        // Handle form submission
        $(this).siblings('form').show().on('submit', function(ev) {
          ev.preventDefault();
          var projectname = $(this).find('input[type=text]').val();
          $.ajax({
            url: rg_options.api + '/_api/list/' + list.id,
            type: 'PUT',
            data: { name:projectname },
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
      $('#'+list.id+' .list-name').on('click touch', function(e) {
        $('input.project-share').parent().hide();
/*           $('input.project-share').siblings('label').hide(); */
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
            $list.find('input.project-share')
            .val(response.data.url.replace('bit.ly', 'fav.rogersandgoffigon.com')).parent().show();

/*
            var w = $('input.project-share:visible').siblings('label').show().width();
            $list.find('input.project-share').css('left', w+6);
*/
          });
        }
        // Remove existing lists, including self
        $('ul.trade-items').remove();
        $('div.trade-items-noresults').remove();
        // If the there weren't any trade-items lists inside of element's parents, make one
        if (new_list) {
            // Compile the template for the list
            $.getJSON(rg_options.api + '/_api/list/_me/' + list.id, {}, function(data) {
              // Render the template with the objects from the list
              $('#'+list.id+'_items').html(template_project_items.render({ items: data.entities }));
              // Handle removing items from the list
              $('button.remove-trade-item').on('click touch', function(e) {
                e.preventDefault();
                var id = $(this).siblings('img').data('id');
                var $div = $(this).parent();
                $.ajax({
                  url: rg_options.api + '/_index/list/' + list.id + '/' + id,
                  type: 'DELETE',
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
                  var obj = { entities: [] };
                  // Collect the order of the items and build an object
                  $('ul.trade-items > li').each(function(i) {
                    console.log($(this));
                    var id = $(this).find('img').data('id');
                    obj.entities.push({id: id, order: i});
                  });
                  // Send a request to cape with the updated order
                  $.ajax({
                    url: rg_options.api + '/_api/list/' + list.id,
                    type: 'PUT',
                    data: JSON.stringify(obj),
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
              $('#'+list.id+'_items').html(template_project_items.render({ entities: [] }));
            });

        }
      });
      // Remove a list
      $('#'+list.id+' button.delete-list').on('click touch', function(e) {
        e.preventDefault();
        $.ajax({
          url: rg_options.api + '/_api/list/' + list.id,
          type: 'DELETE',
          success: function(result) {
            // Remove the item from the DOM
            $('#'+list.id).remove();
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
        $.ajax({
          url: rg_options.api + '/_api/items/_index/' + $.cookie('uid') + '/list',
          type: 'PUT',
          data: JSON.stringify(obj),
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
      var $div = $(this).closest('div');
      // If we have a token and a project name, submit the project
      if (token && (projectname.length > 0)) {
        $.ajax({
          url: rg_options.api + '/_api/list/_me',
          type: 'post',
          contentType: 'application/json',
          data: JSON.stringify({
            name: projectname,
            api_id: 'items',
            entities: []
          }),
          success: function (data) {
            // If the list was created, remove the form and show confirmation
            if (_.isUndefined(data.id) == false) location.reload();
          }
        });
      }
    });
  });
});