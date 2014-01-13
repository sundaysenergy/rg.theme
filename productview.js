$(document).ready(function() {
  /**** DEFAULT OPTIONS ****/
  var rg_options = {
                      vertical_page: 42,
                      horizontal_page: 3
                   }

  /**** DISPLAY & DATA RESETS ****/
  if (_.isUndefined(hash.get('faves')) == false) { localStorage.faves = hash.get('faves'); }
  // Delete session variables since the page has reloaded
  delete(sessionStorage.detailedview);


  /**** GET THE ITEMS INFORMATION FROM CAPE AND PROCESS IT ****/
  $.getJSON('http://rg.cape.io/items/client_data.json', function(combined) {

    // Compile clientside templates
    var templates = combined.templates;  
    var item_template                = Hogan.compile(templates.item),
        spotlight_template           = Hogan.compile(templates.spotlight),
        dummy_template               = Hogan.compile(templates.bookends),
        favorites_template           = Hogan.compile(templates.favorites),
        detailed_favorites_template  = Hogan.compile(templates.detailed_faves_alert),
        itemdel_template             = Hogan.compile(templates.itemdel),
        related_template             = Hogan.compile(templates.related_item),
        project_list_select_template = Hogan.compile(templates.project_list_select);

    // Options for our list
    var options = {
      valueNames: [ 'image', 'content', 'id' ],
      item: '<li><span style="display:none" class="id"></span><img class="img"></li>',
      page: rg_options.horizontal_page,
      i: 0
    };

    var data = combined.items;
    var colors = combined.colors;

    // Function for calculating related products in different colors
    var findColors = function(itemno) { 
      var variations = this[itemno];
      return _.map(variations, function(v) { return itemno + '-' + v; });
    }
    _.forEach(data, function(item) {
      // Remove the last part of the product number, which designates variation of a themed item
      var i = item.id.split("-");
      i.pop();
      // Generate an associated list of color options that include the original item number
      item.itemcolors = _.bind(findColors, colors, i.join("-"));
      // We need to generate links for our thumbnails that do not include detailedview twice
      item.linkitem = function () {
                        var returnhash = '';
                        _.forEach(_.keys(hash.get()), function(k) {
                          if (k != 'detailedview') returnhash = returnhash + k + '=' + hash.get(k) + '&';
                        });
                        return returnhash;
                      };
    });

    // Create a new list
    var productlist = new List('products', options, data);
    $('#products > ul.list').addClass('slider');
    if (_.isUndefined(hash.get('pos'))) hash.add({pos:0});

    /**** THINGS TO DO WHEN THE HASH CHANGES ****/
    $(window).on('hashchange', function(e) {
      var collection = hash.get('collection');
      // Add active class for current sub collection, and remove active class for non-active sub.
      $('ul.collection-filter li a').removeClass('active');
      // Reset our filters checkboxes if necessary
      if (_.isUndefined(hash.get('attributes'))) {
        $('.filter-attributes').find(':checkbox').attr('checked',false);
      }
      if (_.isUndefined(hash.get('color'))) {
        $('.filter-color').find(':checkbox').attr('checked',false);
      }
      // Move things around in the collection view
      if (_.isUndefined(collection) == false) {
        if (collection == 'textile') {
          // Hide active headers for other collections
          $('#collection-menu-passementerie,#collection-menu-leather').hide();
          // Show the products list and the header for textiles
          $('#products,#collection-menu-main').show();
          // Show inactive headers for other collections
          $('#collection-menu-leather-inactive,#collection-menu-passementerie-inactive').show();
          // Move the inactive headers to a different container if they're not there already
          if ($('#collection-headers-after').find('#collection-menu-passementerie-inactive').length == 0) {
            $('#collection-menu-passementerie-inactive').appendTo('#collection-headers-after');
            $('#collection-menu-leather-inactive').insertAfter($('#collection-menu-passementerie-inactive'));
          }
          // Hide inactive header for textile collection
          $('#collection-menu-main-inactive').hide();
          // Move the #products div after the textile header bar
          $('#products').insertAfter('#collection-menu-main');
        }
        if (collection == 'passementerie') {
          // Hide the active headers for other collections
          $('#collection-menu-main,#collection-menu-leather').hide();
          // Show the products list and the header for textiles
          $('#products,#collection-menu-passementerie').show();
          // Show inactive headers for other collections
          $('#collection-menu-leather-inactive,#collection-menu-main-inactive').show();
          // Move the inactive headers to a different container if they're not there already
          if ($('#collection-headers-after').find('#collection-menu-leather-inactive').length == 0) {
            $('#collection-menu-leather-inactive').appendTo('#collection-headers-after');
          }
          // Hide the inactive header for this collection
          $('#collection-menu-passementerie-inactive').hide();
          // Move the #products div after the passementerie header bar
          $('#products').insertAfter('#collection-menu-passementerie');
        } 
        if (collection == 'leather') {
          // Hide the active headers for other collections
          $('#collection-menu-passementerie,#collection-menu-main').hide();
          // Show the products list and the header for textiles
          $('#products,#collection-menu-leather').show();
          // Show inactive headers for other collections
          $('#collection-menu-main-inactive,#collection-menu-passementerie-inactive').show();
          // Move the inactive headers to a different container if they're not there already
          $('#collection-menu-leather-inactive').hide();
          // Move inactive headers back to original container if necessary
          if ($('#collection-headers-after').find('#collection-menu-passementerie-inactive').length == 1) {
            $('#collection-menu-passementerie-inactive').prependTo('div#collection-row-passementerie');
          }
          if ($('#collection-headers-after').find('#collection-menu-leather-inactive').length == 1) {
            $('#collection-menu-leather-inactive').prependTo('div#collection-row-leather');
          }
          // Move products after the leather header
          $('#products').insertAfter('#collection-menu-leather');
        }
        $('ul.collection-filter li').find('a[href="/collection.html#collection=' + collection + '"]').addClass('active');
      }
      // Move the product list inside or outside of the main container depending on viewing mode
      if (productlist.page == rg_options.horizontal_page) {
        if ($('div.threeup div#products').length == 0) $('div#products').appendTo('div.threeup');
      } else {
        if ($('div.threeup div#products').length > 0) $('div#products').appendTo('main.container div#collection-row-textile');
      }
      // Copy faves from the hash to localStorage for sharing and updates via the url
      if (_.isUndefined(hash.get('faves')) == false) {
        localStorage.faves = hash.get('faves');
      } else {
        $('#products > ul.list').removeClass('anon-favorites');
      }
      // Sometimes after removing all items from anon favorites, null was leftover. Remove it.
      if (_.isNull(localStorage.faves)) delete(localStorage.faves);
      // If we're viewing 3 items at a time, and there are faves or search present, force vertical view and set position
      if (productlist.page == rg_options.horizontal_page && (_.isUndefined(hash.get('faves')) == false || _.isUndefined(hash.get('search')) == false)) {
        productlist.page = rg_options.vertical_page;
        var pos = 1;
        $('#products > ul.list').removeClass('slider');
        productlist.update();
      }
      // If no detailed view is present, make sure we hide the element
      // Creates back button functionality that matches what a user would expect
      if (_.isUndefined(hash.get('detailedview'))) {
        $('.itemoverlay').hide();
        $('html,body').css('overflow','auto').css('height', '');
      }
      e.preventDefault();
      // Get values from the hash
      f = hash.get('attributes');
      var collection = hash.get('collection');
      var attributes = [];
      // Add active class for current sub collection, and remove active class for non-active sub.
      $('ul.collection-filter li a').removeClass('active');
      if (_.isUndefined(collection) == false) {
        $('ul.collection-filter li').find('a[href="/collection.html#collection=' + collection + '"]').addClass('active');
      }
      if (typeof(f) != 'undefined') { attributes = f.split(','); }
      // Clear any existing filter
      productlist.filter();
      // Unhide all of the filter selections
      $('.filter-attributes label, .filter-color label').each(function(i) {
        $(this).removeClass('disabled');
      });
      // Get any search term(s)
      var srch = hash.get('search');
      var faves = hash.get('faves');
      var color = hash.get('color');
      // If we have search terms
      if (_.isUndefined(srch) == false) {
        // Show the search header bar and hide the others
        $('#products,#collection-menu-search').show();
        $('#collection-menu-main,#collection-menu-leather,#collection-menu-passementerie,#collection-menu-faves,#collection-menu-leather-inactive,#collection-menu-passementerie-inactive,#collection-menu-main-inactive').hide();
        // Click handlers for different view quantities
        $('#search-view-number a,.search-view-number a').each(function(i) {
          $(this).on('click touch', function(e) {
            e.preventDefault();
            var items = $(this).data('show-items');
            var i = productlist.i;
            productlist.page = items;
            // Set position to the same page that would contain item with new quantity/page
            var newpos = parseInt(productlist.i / items) * items + 1;
            // Set the display value to the current number of items
            $('button .show-items').html(items);
            // Add our position to the hash and update the list
            hash.add({pos:newpos});
            productlist.update();
          });
        });
      // Show&hide header bars for search and default
      } else if (_.isUndefined(faves) == false) {
        $('#products,#collection-menu-faves').show();
        $('#collection-menu-main,#collection-menu-leather,#collection-menu-passementerie,#collection-menu-search,#collection-menu-leather-inactive,#collection-menu-passementerie-inactive,#collection-menu-main-inactive').hide();
      } else {
        //$('#collection-menu-main-inactive').show();
        $('#collection-menu-search,#collection-menu-faves').hide();  
      }
      // Process anonymous favorites
      if (_.isUndefined(faves) == false) {
        favorites = hash.get('faves').split(',');
        var longurl = 'http://rg.cape.io/collection.html#faves=' + faves;
        // Get the bit.ly url
        $.getJSON(
          "http://api.bitly.com/v3/shorten?callback=?",
          { 
            "format": "json",
            "apiKey": "R_b83cfe54d0ecae82a9086a21fe834814",
            "login": "sundaysenergy",
            "longUrl": longurl
          },
          function(response) {
            // We're just throwing this information in one of the headers for now
            $('.pager li:nth-child(4)')
            .find('input')
            .val(response.data.url)
            .on('click', function(e) { $(this).select(); });
          }
        );
      }
      

      /**** PROCESS FILTERS FROM HASH ****/
      if ((typeof(f) != 'undefined') || (typeof(collection) != 'undefined' || _.isUndefined(srch) == false) || _.isUndefined(faves) == false || _.isUndefined(color) == false) {
        productlist.filter(function(item) {
          // Set our default to false, and explicit define matches
          var match = false;
          // Favorite list gets processed first
          if (_.isUndefined(faves) == false) {
            if (_.indexOf(favorites, item.values().id) >= 0) {
              return true;
            } else {
              return false;
            }
          }
          // If we have a search term, process it
          if (_.isUndefined(srch) == false) {
            var content_field = item.values().content;
            if (_.isUndefined(content_field)) {
              content_field = "";
            }
            if (content_field.toLowerCase().indexOf(srch) == -1) {
              // If we failed the search term, and the search term exists, quit here and return false.
              return false;
            } else {
              // Set true if we have a search term and it connected
              match = true;
            }
          }
          // If we have a collection, see if the item matches the selected collection
          if (typeof(collection) != 'undefined') {
            if (item.values().collection.toLowerCase().indexOf(collection.toLowerCase()) >= 0) {
              match = true;
            } else {
              match = false; // Probably should just return false here?
            }
          }
          // If we've either matched the collection, or there is no collection specified, proceed.
          // Assumption is that anything else means the collection is specified, but failed to match.
          if (match || (typeof(collection) == 'undefined')) {
            if (attributes.length > 0) {
              // For each attribute, see if we have a match. If not, set false and break.
              for (var i = 0; i<attributes.length; i++) {
                var content_field = (collection != 'leather' || _.isUndefined(collection)) ? item.values().content:item.values().name;
                if (_.isUndefined(content_field)) content_field = "";
                if (content_field.toLowerCase().indexOf(attributes[i].toLowerCase()) >= 0) {
                  match = true;
                } else {
                  // If we fail, break the loop since we want all attributes to match.
                  return false;
                }
              }
            }
            if (_.isUndefined(color) == false) {
              var color_terms = color.split(',');
              for (var i = 0; i<color_terms.length; i++) {
                var color_field = item.values().color;
                if (_.isUndefined(color_field)) {
                  color_field = "";
                }
                if (color_field.toLowerCase().indexOf(color_terms[i].toLowerCase()) >= 0) {
                  match = true;
                } else {
                  // If we fail, break the loop since we want all attributes to match.
                  match = false;
                  break;
                }
              }
            }
          }
          return match;
        });

        $(document).trigger('filterFilters');
      } // END PROCESS FILTERS FROM HASH



      var pos = hash.get('pos');
      // If position is undefined, start at either 0 or 1, depending on view mode
      if (_.isUndefined(pos)) {
        pos = (productlist.page == rg_options.horizontal_page) ? 0:1;
      } else {
        // If position is less than zero, set it to zero
        // Toggling between view modes can create this effect as we're offsetting each time we switch to the horizontal to center the active item
        if (pos < 0) hash.add({pos:0});
      }
      productlist.show(pos, parseInt(productlist.page));


      /**** THINGS TO DO IF WE'RE IN DETAILED VIEW ****/
      if (_.isUndefined(hash.get('detailedview')) == false) {
        // Regenerate the links in the related color slider since we're
        // only reloading the view when we change the item
        $('#related-products ul.list li a').each(function(i) {
          var old_href = $(this).attr('href');
          var new_href = '';
          var n = hash.get('dpos');
          if (_.isUndefined(n)) n = 1;
          // If dpos is present in url, replace it
          if (old_href.match(/dpos=/)) {
            new_href = old_href.replace(/dpos=[0-9]+/, 'dpos='+n);
            $(this).attr('href', new_href);
          // If it's not present, add it
          } else {
            $(this).attr('href', old_href+"&dpos="+n);
          }
        });

        // If the detailedview hash item is not the same as the session item
        if (hash.get('detailedview') != sessionStorage.detailedview && _.isUndefined(hash.get('detailedview')) == false) {
          // Reset the body height and overflow
          $('html,body').css('overflow','hidden').height($(window).height());
          var id = hash.get('detailedview');
          // Get the first item that matches the id...we're assuming there would only
          // ever be one item with a given id
          var item = { item : productlist.get('id', id)[0].values() };
          // Create the image url for the large image
          item.item.img_large = item.item.img.replace('640','1536');
          item.pager = item.item.itemcolors().length > 5;
          // Show the detailed view mode and render the html from our mustache template
          $('.itemoverlay').show().html(item_template.render(item));
          $('#related-products button.close').off('click touch').on('click touch', function(e) {
            $('.itemoverlay #related-products').hide();
          });
          $('.toggle-colors button').on('click touch', function(e) {
            e.preventDefault();
            $('.itemoverlay #related-products').toggle();
          });
          // Get the position in the mini slider
          var n = hash.get('dpos');
          if (_.isUndefined(n)) n = 1;
          // Create a list for alternate color options
          var options = {
            valueNames: [ 'related-item' ],
            page: 5,
            i: n
          };
          var relatedlist = new List('related-products', options);
          // Actions to perform when the list is updated -- mostly pagination
          relatedlist.on('updated', function() {
            var current_page = parseInt(relatedlist.i / 5 + 1);
            var total_pages = parseInt(relatedlist.matchingItems.length / 5);
            if (relatedlist.matchingItems.length % 5 > 0) total_pages = parseInt(total_pages) + 1;
            $('#related-products .related-page-count').html(current_page + " / " + total_pages);
            $('.rel-previous, .rel-next').removeClass('disabled');
            $('.rel-next').off('click touch').on('click touch', function(e) {
              // Add to the hash so that if we refresh the page it still has the correct starting position
              hash.add({dpos:parseInt(relatedlist.i)+5});
              // Manually update the list with a new start position since we'll ignore
              // this code if session storage matches the view
              relatedlist.i = parseInt(relatedlist.i)+5;
              relatedlist.update();
            });
            $('.rel-previous').off('click touch').on('click touch', function(e) {
              // Works the same way as the lines above. See comments there.
              hash.add({dpos:parseInt(relatedlist.i)-5});
              relatedlist.i = parseInt(relatedlist.i)-5;
              relatedlist.update();
            });
            if (parseInt(relatedlist.i)-1 == 0) {
              $('.rel-previous').addClass('disabled').off('click touch');
            }
            if ((parseInt(relatedlist.i) + parseInt(relatedlist.page)) > relatedlist.matchingItems.length) {
              $('.rel-next').addClass('disabled').off('click touch');
            }
          });
          relatedlist.update();
          // Things to do on closing the detailed view mode
          $('table button.close').off('click touch').on('click touch', function(e) {
            $('.itemoverlay').hide(); // Hide the item
            hash.remove('detailedview'); // Remove from the hash
            hash.remove('dpos'); // Remove the position from the hash
            $('html,body').css('overflow','hidden').height($(window).height()); // Reset the body and overflow
            delete(sessionStorage.detailedview); // Remove the session value
          });

          // Add to favorites from detailed view
          $('.fa-plus-square-o').parent().off().on('click touch', function(e) {
            var uid = $.cookie('uid');
            var token = $.cookie('token');
            // If we are not logged in, add the item to anonymous favorites
            if (_.isUndefined(uid) || _.isUndefined(token)) {
              // Disable the button so that we can only add an item once
              $(this).off('click touch');
              e.preventDefault();
              // Catch undefined value
              if (_.isUndefined(localStorage.faves)) localStorage.faves = '';
              // Parse the existing list and push the new item
              var current = localStorage.faves.split(',');
              current.push(id);
              // Create a string with only unique items
              localStorage.faves = _.compact(_.uniq(current)).join(',');
              // Add a notification and dynamically change the share link
              $('.itemoverlay').append(detailed_favorites_template.render({message:'Item added to your favorites!'}));
              $('.alert-favorite').find('a').attr('href', $('.alert-favorite').find('a').attr('href') + localStorage.faves);
            } else {
              $(this).off('click touch');
              e.preventDefault();
              // Retrieve a list of available lists for the user
              $.getJSON('http://rg.cape.io/_api/items/_index/' + uid + '/list', { data_only: true }, function(data) {
                // Render the list against our template
                $('.itemoverlay').append(project_list_select_template.render({lists:data}));
                // Catch form submissions
                $('#project-trade-list').closest('form').on('submit', function(e) {
                  e.preventDefault();
                  // Grab the list id of the currently selected item
                  var listid = $('#project-trade-list').val();
                  $.ajax({
                    url: 'http://rg.cape.io/_api/items/_index/list/'+listid+'/'+id,
                    type: 'PUT',
                    headers: { Authorization: 'bearer '+token },
                    contentType: 'application/json',
                    success: function(result) {
                      console.log(result);
                      // Close the dialog box for adding an item
                      $('#project-trade-list').closest('.alert').find('button.close').trigger('click');
                      // Display a success message
                      $('.itemoverlay').append(detailed_favorites_template.render({message:'Item added to your list!'}));
                      // Update the link to point to the projects page
                      $('.alert-favorite').find('a').attr('href', '/trade/projects.html'); 
                    },
                    fail: function(result) {
                      window.location = '/trade/login.html#destination=' + encodeURIComponent(window.location.pathname);
                    }
                  });
                });
              });           
            }
          });

          // Update our rulers
          $("a.ruler-inches").off().on('click touch', function(e) {
            e.preventDefault();
            $(".rulers img.ruler-inches").show();
            $(".rulers img.ruler-cm").hide();
            $(this).parent().addClass("active");
            $(this).parent().next("li").removeClass("active");
            return false;
          });

          $("a.ruler-cm").off().on('click touch', function(e) {
            e.preventDefault();
            $(".rulers img.ruler-cm").show();
            $(".rulers img.ruler-inches").hide();
            $(this).parent().addClass("active");
            $(this).parent().prev("li").removeClass("active");
            return false;
          });
        }
        sessionStorage.detailedview = hash.get('detailedview');
      }
      return false;
    });

    

    /**** THINGS TO DO WHEN THE LIST UPDATES (i.e. position, items, or filters change) ****/
    productlist.on('updated', function() {
      // Update i if we have fewer items than the starting position
      if (productlist.i > productlist.matchingItems.length) {
        productlist.i = productlist.matchingItems.length;
      }
      // Page counter for slide view
      if (productlist.page == rg_options.horizontal_page) {
        $('.pagecount')
        .html(parseInt(productlist.i)+1)
        .append(' / ')
        .append(productlist.matchingItems.length);
        if ($('div.threeup div#products').length == 0) {
          $('div#products').appendTo('div.threeup');
        }
      // Page counter for thumbnail view
      } else {
        $('.pagecount, #search-page-counter')
        .html((parseInt(productlist.i / productlist.page) + 1))
        .append(' / ')
        .append(parseInt(productlist.matchingItems.length / productlist.page) + 1);
        if ($('div.threeup div#products').length > 0) {
          $('div#products').appendTo('main.container div#collection-row-textile');
        }
      }
      // Reset our paginator
      $('.previous, .next').removeClass('disabled');
      $('.next').off('click touch').on('click touch', function(e) {
        hash.remove('cpos');
        var n = parseInt(productlist.page);
        // If we're viewing three at a time, only increment by one item.
        // Otherwise, increment by one page.
        if (n == rg_options.horizontal_page) { n = 1; }
        var p = parseInt(productlist.i)+parseInt(n);
        if (p == productlist.matchingItems.length && n == 1) p = 0;
        hash.add({pos:p});
      });
      $('.previous').off('click touch').on('click touch', function(e) {
        hash.remove('cpos');
        var n = parseInt(productlist.page);
        // If we're viewing three at a time, only increment by one item
        if (n == rg_options.horizontal_page) { n = 1; }
        var p = parseInt(productlist.i)-n;
        if (p == -1) p = productlist.matchingItems.length-1;
        hash.add({pos:p});
      });
      // If our position is less than the number of entries per page, assume we are on page #1
      // Unless we're viewing three at a time -- go to zero then
      if (((parseInt(productlist.i) < parseInt(productlist.page)) &&
          (productlist.page != rg_options.horizontal_page))) {
        $('.previous').addClass('disabled').off('click touch');
      }
      // If our position plus the size of the page is greater than length, we're showing the last entries
      if ((parseInt(productlist.i) + parseInt(productlist.page)) > productlist.matchingItems.length) {
        if (productlist.page != rg_options.horizontal_page) {
          $('.next').addClass('disabled').off('click touch');
        }
      }
      // Add or remove dummy element for first item in slide view.
      var pos = hash.get('pos');
      if (_.isUndefined(pos)) pos = 0;
      if (pos <= 0) {
        if (productlist.matchingItems.length > 0) {
          var last_item = productlist.matchingItems.length-1;
          if (last_item < 0) last_item = 0;
          var dummy_item = dummy_template.render(productlist.matchingItems[last_item].values());
          $('#products > ul.slider').prepend(dummy_item);
        }
      } 
      if (productlist.i == productlist.matchingItems.length-1) {
        $('#products > ul.slider').append(dummy_template.render(productlist.matchingItems[0].values()));
      } 
      if ((!((productlist.i == productlist.matchingItems.length-1) || (productlist.i <= 0)) && (productlist.matchingItems.length != 1)) ||
          (productlist.page == rg_options.vertical_page)) {
        $('#products > ul.slider li.item-bookends').remove();
      }

      // For each visible li in the list, create a click handler that toggles visibility
      // and compiles the mustache for the current item.
      $('.list li .img').off('click touch').on('click touch', function(e) {
        var id = $(this).parent().find('.id').html();
        hash.add({detailedview:id});
      });

      // Add product details div 
      if (productlist.page == rg_options.horizontal_page) {
        // Remove existing item details
        $('ul.list li .item-spotlight').remove();
        // Add the item detail information to the center slide
        var n = 1;
        // If we are on the first slide, our information is in the 0th item
        if (productlist.i == 0) n = 0;
        if (productlist.matchingItems.length == 1) n = 0;
        // Render the template with the correct data
        if (productlist.matchingItems.length > 0) {
          $('#products > ul.slider li:nth-child(2)').append(spotlight_template.render(productlist.visibleItems[parseInt(n)].values()));
        }
        // Create click handlers for the icon and the close button
        $('.item-spotlight .item-icons button.item-details, .item-spotlight .item-information button.item-toggle').off().on('click touch', function(e) {
          e.preventDefault();
          $('.item-spotlight .item-information').slideToggle();
        });
        // Create click handler for favorite
        $('.item-spotlight .item-icons button.item-favorite').on('click touch', function(e) {
          $(this).off('click touch');
          e.preventDefault();
          var id = $('.list li:nth-child(2)').find('.id').html();
          var uid = $.cookie('uid');
          var token = $.cookie('token');
          // Add anonymous favorite
          if (_.isUndefined(uid) || _.isUndefined(token)) {
            $(this).off('click touch');
            e.preventDefault();
            // Check for undefined, parse the existing favorites, and store the updated string
            if (_.isUndefined(localStorage.faves)) localStorage.faves = '';
            var current = localStorage.faves.split(',');
            current.push(id);
            localStorage.faves = _.compact(_.uniq(current)).join(',');
            // Success message and update the share link
            $('.item-spotlight').append(favorites_template.render({message:'Item added to your favorites!'}));
            $('.alert-favorite').find('a').attr('href', $('.alert-favorite').find('a').attr('href') + localStorage.faves);
          // Add item to trade list
          } else {
            $(this).off('click touch');
            e.preventDefault();
            $.getJSON('http://rg.cape.io/_api/items/_index/' + uid + '/list', { data_only: true }, function(data) {
              $('body').append(project_list_select_template.render({lists:data}));
              $('#project-trade-list').closest('form').on('submit', function(e) {
                e.preventDefault();
                var listid = $('#project-trade-list').val();
                $.ajax({
                  url: 'http://rg.cape.io/_api/items/_index/list/'+listid+'/'+id,
                  type: 'PUT',
                  headers: { Authorization: 'bearer '+token },
                  contentType: 'application/json',
                  success: function(result) {
                    $('#project-trade-list').closest('.alert').find('button.close').trigger('click')
                    $('.item-spotlight').append(favorites_template.render({message:'Item added to your favorites!'}));
                    $('.alert-favorite').find('a').attr('href','/trade/projects.html');
                    console.log(result);
                  },
                  fail: function(result) {
                    window.location = '/trade/login.html#destination=' + encodeURIComponent(window.location.pathname);
                  }
                });
              });
            });
          }
        });
        // Handle related colors list
        var id = $('.list li:nth-child(2)').find('.id').html();
        var sitem = productlist.get("id", id);
        var $relatedcolors = $('#item-colors ul.list');
        $relatedcolors.empty();
        _.forEach(sitem[0].values().itemcolors(), function(item) {
          $relatedcolors.append($(related_template.render(productlist.get("id", item)[0].values())));
        });
        var n = hash.get('cpos');
        if (_.isUndefined(n)) {
          n = 1;
        } else {
          $('#item-colors').show();
        }
        var options = {
          valueNames: [ 'related-item' ],
          page: 2,
          i: n
        };
        var colorslist = new List('item-colors', options);
        // Click handler for colors
        $('button.item-colors').off().on('click touch', function(e) {
          $('#item-colors').toggle();
        });
        // Actions to perform when the list is updated -- mostly pagination
        colorslist.on('updated', function() {
          $('#item-colors .rel-previous, #item-colors .rel-next').removeClass('disabled');
          $('#item-colors .rel-next').off('click touch').on('click touch', function(e) {
            hash.add({cpos:parseInt(colorslist.i)+1});
          });
          $('#item-colors .rel-previous').off('click touch').on('click touch', function(e) {
            hash.add({cpos:parseInt(colorslist.i)-1});
          });
          if (parseInt(colorslist.i) <= 1) {
            $('#item-colors .rel-previous').addClass('disabled').off('click touch');
          }
          if (parseInt(colorslist.i)+1 > colorslist.matchingItems.length) {
            $('#item-colors .rel-next').addClass('disabled').off('click touch');
          }
        });
        colorslist.update();

        // Click on the left image should decrement by one, while the right image should increment
        $('ul.list li:nth-child(1) .img').off('click touch').on('click touch', function(e) {
          hash.remove('cpos');
          var p = parseInt(productlist.i)-1;
          if (p == -1) p = productlist.matchingItems.length-1;
          hash.add({pos:p});
        });
        $('ul.list li:nth-child(3) .img').off('click touch').on('click touch', function(e) {
          hash.remove('cpos');
          var p = parseInt(productlist.i)+1;
          if (p == productlist.matchingItems.length) p = 0;
          hash.add({pos:p});
        });
      } else {
        // If we're not in 3-up mode, make sure we don't have any stray item details
        if (_.isUndefined(hash.get('faves')) == false) {
          // Hide details for center slide in "horizontal" view
          productlist.page = rg_options.vertical_page;
          $('#products > ul.list').removeClass('slider');
          $('#products > ul.list').addClass('anon-favorites');
          $('ul.list li .item-spotlight').remove();

          $('ul.anon-favorites li').each(function(i) {
            $(this).find('.item-favorite-remove').remove();
            $(this).append(itemdel_template.render({}));
            var id = $(this).find('.id').html();
            $(this).find('.item-favorite-remove button').off().on('click touch', function(e) {
              e.preventDefault();
              var f = localStorage.faves.split(',');
              _.remove(f, function(item) {
                if (item == id) return true;
              });
              localStorage.faves = _.compact(_.uniq(f)).join(',');
              if (f.length == 0) {
                window.location = '/collection.html';
              } else {
                hash.add({faves:_.compact(_.uniq(f)).join(',')})
              }
              alert("Item " + id + " removed from favorites!");
            });
          });
        }
        $('ul.list li .item-spotlight').remove();
      }
    }); // end productlist.on('updated')


    // Manually trigger an update
    productlist.update();


    // When we check or uncheck a box, recalculate search terms
    $('.filter-attributes input[type=checkbox]').on('click touch', function(e) {
      if ($(this).parent().hasClass('disabled')) {
        e.preventDefault();
        return false;
      }
      productlist.filter();
      var f = [];
      $('.filter-attributes :checkbox:checked').each(function(i) {
        f.push($(this).val());
      });
      hash.remove('pos');
      // If we have terms filter, otherwise the filter reset will start us fresh
      if (f.length > 0) {
        hash.add({attributes : f.join(',') });
      } else {
        hash.add({scroll:'n'});
        hash.remove('attributes');
      }
      if (productlist.page == rg_options.horizontal_page) { productlist.i = productlist.i-1; }
      productlist.update();
    });

    // When we check a color filter, do the same
    $('.filter-color input[type=checkbox]').on('click touch', function(e) {
      if ($(this).parent().hasClass('disabled')) {
        e.preventDefault();
        return false;
      }
      productlist.filter();
      var f = [];
      $('.filter-color :checkbox:checked').each(function(i) {
        f.push($(this).val());
      });
      hash.remove('pos');
      // If we have terms filter, otherwise the filter reset will start us fresh
      if (f.length > 0) {
        hash.add({color : f.join(',') });
      } else {
        hash.add({scroll:'n'});
        hash.remove('color');
      }
      if (productlist.page == rg_options.horizontal_page) { productlist.i = productlist.i-1; }
      productlist.update();
    });

    // Event for filtering the various lists of filters
    $(document).on('filterFilters', function() {
      // Check unchecked filter buttons for matches. Hide if no matches
      $('.filter-attributes :checkbox:not(:checked)').each(function(i) {
        var a = $(this)[0].value;
        // Determine if any potential matches exist from currently matched items. Breaks on first true
        var m = _.some(productlist.matchingItems, function(item) {
          var contentname = (hash.get('collection') != 'leather' || _.isUndefined(hash.get('collection'))) ? item.values().content:item.values().name;
          if (_.isUndefined(contentname)) contentname = '';
          if (contentname.toLowerCase().indexOf(a.toLowerCase()) >= 0) return true;
        });
        // Hide the parents of any item that does not have a match.
        if (m == false) $(this).parent().addClass('disabled');
      });
      // Do the same thing for color filters
      $('.filter-color :checkbox:not(:checked)').each(function(i) {
        var a = $(this)[0].value;
        // Determine if any potential matches exist from currently matched items. Breaks on first true
        var m = _.some(productlist.matchingItems, function(item) {
          var colorname = item.values().color;
          if (_.isUndefined(colorname)) {
            colorname = '';
          }
          if (colorname.toLowerCase().indexOf(a.toLowerCase()) >= 0) return true;
        });
        // Hide the parents of any item that does not have a match.
        if (m == false) $(this).parent().addClass('disabled');
      });
    });

    // Process the hash if we're just loading the page and have values
    if (window.location.hash.length > 0) {
      var g = hash.get('attributes');
      if (typeof(g) != 'undefined') {
        var f = g.split(',');
        // Toggle checkboxes for any attributes that are found.
        for (var i=0; i<f.length; i++) {
          $('.filter-attributes').find(':checkbox[value="' + f[i] +'"]').attr('checked',true);
        }
      }
      var h = hash.get('color');
      if (typeof(h) != 'undefined') {
        var f = h.split(',');
        // Toggle checkboxes for any attributes that are found.
        for (var i=0; i<f.length; i++) {
          $('.filter-color').find(':checkbox[value="' + f[i] +'"]').attr('checked',true);
        }
      }      
      // Trigger a hashchange event to actually process the filter
      $(window).trigger('hashchange');
    }


    // Toggle to slide view mode
    $('button.slide').on('click touch', function(e) {
      e.preventDefault();
      productlist.page = rg_options.horizontal_page;
      var pos = parseInt(productlist.i)-1;
      // If it's the first item, simulate centering
      $('#products > ul.list').addClass('slider');
      // Only allow one button to be enabled at a time
      $('.slide').toggle();
      $('.thumbs').toggle();
      $('.collection-view-items').hide();
      hash.add({pos:pos});
    });

    // Toggle to thumb view mode
    $('button.thumbs').on('click touch', function(e) {
      e.preventDefault();
      // Hide details for center slide in "horizontal" view
      productlist.page = rg_options.vertical_page;
      productlist.update();
      var pos = 0;
      // If we have fewer visible items than page size and matching != visible (one page with only a few items)
      if ((productlist.visibleItems.length < productlist.page) && 
          (productlist.visibleItems.length != productlist.matchingItems.length)) {
        var remainder = productlist.matchingItems.length;
        var pagesize = productlist.page;
        // Calculate the remainder -- switch to math based method below sometime.
        while (remainder > pagesize) { remainder = remainder - pagesize; }
        pos = parseInt(productlist.matchingItems.length-remainder+1);
      }  else {
        // Calculate the nearest multiple of per page by casting as an integer without going over. Like The Price is Right.
        pos = parseInt(productlist.i / rg_options.vertical_page) * rg_options.vertical_page + 1;
      }
      $('#products > ul.list').removeClass('slider');
      $('.slide').toggle();
      $('.thumbs').toggle();
      $('.collection-view-items').show();
      $('.collection-view-items a').each(function(i) {
        $(this).on('click touch', function(e) {
          e.preventDefault();
          var items = $(this).data('show-items');
          var i = productlist.i;
          productlist.page = items;
          rg_options.vertical_page = items;
          // Set position to the same page that would contain item with new quantity/page
          var newpos = parseInt(productlist.i / items) * items + 1;
          // Set the display value to the current number of items
          $('button .show-items').html(items);
          // Add our position to the hash and update the list
          hash.add({pos:newpos});
          productlist.update();
        });
      });
      $('ul.list li .item-spotlight').remove();
      hash.add({pos:pos});
    });

    // Keep the dropdown menu from closing after an option is selected
    $('#collection-menu-main .dropdown-menu input, #collection-menu-main .dropdown-menu label, #collection-menu-leather .dropdown-menu input, #collection-menu-leather .dropdown-menu label').click(function(e) {
      e.stopPropagation();
    });

    $('ul.nav-tabs li a').on('click touch', function(e) {
      e.preventDefault();
      $(this).tab('show');
      return false;
    });
  });
  
  // This should probably be in the css, no?
  $(".rulers .ruler-cm").hide();
});