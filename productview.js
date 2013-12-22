$(document).ready(function() {
  $("a[href*='collection.html']").click(function(e){
    if (_.isNull($(this).attr('href').match('#'))) {
      return true;
    } else {
      e.preventDefault();
      window.location.href = $(this).attr('href');
      location.reload();
      return false;
    }
  });
  // Delete session variables since the page has reloaded
  delete(sessionStorage.detailedview);


  /**** COMPILE TEMPLATES ****/
  var item_template;
  $.ajax({
    url: "http://rg.cape.io/templates/item.html",
    context: document.body,
    async: false,
    error:  function (jqXHR, textStatus, errorThrown) {
              console.log(errorThrown);
            }
  }).done(function(data) {
    item_template = Hogan.compile(data);
  });
  // Get the template for detailed item information.
  var spotlight_template;
  $.ajax({
    url: "http://rg.cape.io/templates/spotlight.html",
    context: document.body,
    async: false,
    error:  function (jqXHR, textStatus, errorThrown) {
              console.log(errorThrown);
            }
  }).done(function(data) {
    spotlight_template = Hogan.compile(data);
  });
  // Compile the template for the "bookended" items that create the seamless scrolling in 3-up mode
  var dummy_template = Hogan.compile('<li class="item-bookends"><span style="display:none" class="id">{{id}}</span><img class="img" src="{{img}}"><br><span class="content">{{content}}</span></li>');
  // Compile the template for alerts
  var favorites_template = Hogan.compile('<div class="alert-favorite alert alert-dismissable" style="width:50%; margin-left: 25%; background: #fff"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>{{message}}<br><br><a href="/collection.html#pos=1&faves=">View and share</a></div>');
  var detailed_favorites_template = Hogan.compile('<div class="alert-favorite alert alert-dismissable" style="position:absolute; left:37%; width:26%; z-index:11111; top: 45%; background: #fff"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>{{message}}<br><br><a href="/collection.html#pos=1&faves=">View and share</a></div>');
  var itemdel_template = Hogan.compile('<div class="item-favorite-remove" style="position: absolute; right: 5px; top: 5px;"><button><i class="fa fa-minus-square-o"></i></button></div>');
  var related_template = Hogan.compile('<li class="related-item"><a href="/collection.html#{{linkitem}}detailedview={{id}}"><img src="{{{img}}}"></a></li>');



  /**** GET THE ITEMS INFORMATION FROM CAPE AND PROCESS IT ****/
  $.getJSON('http://rg.cape.io/items/items-color.json', function(combined) {
    // Options for our list
    var options = {
      valueNames: [ 'image', 'content', 'id' ],
      item: '<li><span style="display:none" class="id"></span><img class="img"><br><span class="content"></span></li>',
      page: 40
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



    /**** THINGS TO DO WHEN THE HASH CHANGES ****/
    $(window).on('hashchange', function(e) {
      if (_.isNull(localStorage.faves)) delete(localStorage.faves);
      // If we're viewing 3 items at a time, and there are faves present, force vertical view
      if (productlist.page == 3 && _.isUndefined(hash.get('faves')) == false) {
        productlist.page = 40;
        var pos = 1;
        $('.list').removeClass('slider');
        productlist.update();
      }
      // If no detailed view is present, make sure we hide the element
      // Creates back button functionality that matches what a user would expect
      if (_.isUndefined(hash.get('detailedview'))) {
        $('.itemoverlay').hide();
        $('html,body').css('overflow','auto').height($(window).height());
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
      $('.checkbox-inline:hidden').each(function(i) {
        $(this).show();
      });
      // Get any search term(s)
      var srch = hash.get('search');
      var faves = hash.get('faves');
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
            .html('Share URL: <input type="text" value="' + response.data.url + '">')
            .find('input')
            .on('click', function(e) { $(this).select(); });
          }
        );
      }
      

      /**** PROCESS FILTERS FROM HASH ****/
      if ((typeof(f) != 'undefined') || (typeof(collection) != 'undefined' || _.isUndefined(srch) == false) || _.isUndefined(faves) == false) {
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
            if (item.values().content.toLowerCase().indexOf(srch) == -1) {
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
                if (item.values().content.toLowerCase().indexOf(attributes[i].toLowerCase()) >= 0) {
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

        // Check unchecked filter buttons for matches. Hide if no matches
        $('#attributes :checkbox:not(:checked)').each(function(i) {
          var a = $(this)[0].value;
          // Determine if any potential matches exist from currently matched items. Breaks on first true
          var m = _.some(productlist.matchingItems, function(item) {
            if (item.values().content.toLowerCase().indexOf(a.toLowerCase()) >= 0) return true;
          });
          // Hide the parents of any item that does not have a match.
          if (m == false) $(this).parent().hide();
        });
      } // END PROCESS FILTERS FROM HASH



      var pos = hash.get('pos');
      // If position is undefined, start at either 0 or 1, depending on view mode
      if (_.isUndefined(pos)) {
        pos = (productlist.page == 3) ? 0:1;
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

        // If the detailedview hashh item is not the same as the session item
        if (hash.get('detailedview') != sessionStorage.detailedview) {
          // Reset the body height and overflow
          $('html,body').css('overflow','hidden').height($(window).height());
          var id = hash.get('detailedview');
          // Get the first item that matches the id...we're assuming there would only
          // ever be one item with a given id
          var item = { item : productlist.get('id', id)[0].values() };
          // Create the image url for the large image
          item.item.img_large = item.item.img.replace('640','1536');
          // Show the detailed view mode and render the html from our mustache template
          $('.itemoverlay').show().html(item_template.render(item));
          // Get the position in the mini slider
          var n = hash.get('dpos');
          if (_.isUndefined(n)) n = 1;
          // Create a list for alternate color options
          var options = {
            valueNames: [ 'related-item' ],
            page: 3,
            i: n
          };
          var relatedlist = new List('related-products', options);
          // Actions to perform when the list is updated -- mostly pagination
          relatedlist.on('updated', function() {
            $('.rel-previous, .rel-next').removeClass('disabled');
            $('.rel-next').off('click touch').on('click touch', function(e) {
              // Add to the hash so that if we refresh the page it still has the correct starting position
              hash.add({dpos:parseInt(relatedlist.i)+1});
              // Manually update the list with a new start position since we'll ignore
              // this code if session storage matches the view
              relatedlist.i = parseInt(relatedlist.i)+1;
              relatedlist.update();
            });
            $('.rel-previous').off('click touch').on('click touch', function(e) {
              // Works the same way as the lines above. See comments there.
              hash.add({dpos:parseInt(relatedlist.i)-1});
              relatedlist.i = parseInt(relatedlist.i)-1;
              relatedlist.update();
            });
            if (parseInt(relatedlist.i)+1 < parseInt(relatedlist.page)) {
              $('.rel-previous').addClass('disabled').off('click touch');
            }
            if ((parseInt(relatedlist.i) + parseInt(relatedlist.page)) > relatedlist.matchingItems.length) {
              $('.rel-next').addClass('disabled').off('click touch');
            }
          });
          relatedlist.update();
          // Things to do on closing the detailed view mode
          $('button.close').off('click touch').on('click touch', function(e) {
            $('.itemoverlay').hide(); // Hide the item
            hash.remove('detailedview'); // Remove from the hash
            hash.remove('dpos'); // Remove the position from the hash
            $('html,body').css('overflow','hidden').height($(window).height()); // Reset the body and overflow
            $('.item-favorite-remove').remove(); // Why are we doing this?
            delete(sessionStorage.detailedview); // Remove the session value
          });

          // Add to favorites from detailed view
          $('.fa-plus-square-o').parent().off().on('click touch', function(e) {
            $(this).off('click touch');
            e.preventDefault();
            if (_.isUndefined(localStorage.faves)) localStorage.faves = '';
            var current = localStorage.faves.split(',');
            current.push(id);
            localStorage.faves = _.compact(_.uniq(current)).join(',');
            $('.itemoverlay').append(detailed_favorites_template.render({message:'Item added to your favorites!'}));
            $('.alert-favorite').find('a').attr('href', $('.alert-favorite').find('a').attr('href') + localStorage.faves);
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
      if (productlist.page == 3) {
        $('#pagecount')
        .html(parseInt(productlist.i)+1)
        .append(' / ')
        .append(productlist.matchingItems.length);
      // Page counter for thumbnail view
      } else {
        $('#pagecount')
        .html((parseInt(productlist.i / productlist.page) + 1))
        .append(' / ')
        .append(parseInt(productlist.matchingItems.length / productlist.page) + 1);
      }
      // Reset our paginator
      $('.previous, .next').removeClass('disabled');
      $('.next').off('click touch').on('click touch', function(e) {
        hash.remove('cpos');
        var n = parseInt(productlist.page);
        // If we're viewing three at a time, only increment by one item.
        // Otherwise, increment by one page.
        if (n == 3) { n = 1; }
        var p = parseInt(productlist.i)+parseInt(n);
        if (p == productlist.matchingItems.length) p = 0;
        hash.add({pos:p});
      });
      $('.previous').off('click touch').on('click touch', function(e) {
        hash.remove('cpos');
        var n = parseInt(productlist.page);
        // If we're viewing three at a time, only increment by one item
        if (n == 3) { n = 1; }
        var p = parseInt(productlist.i)-n;
        if (p == -1) p = productlist.matchingItems.length-1;
        hash.add({pos:p});
      });
      // If our position is less than the number of entries per page, assume we are on page #1
      // Unless we're viewing three at a time -- go to zero then
      if (((parseInt(productlist.i) < parseInt(productlist.page)) &&
          (productlist.page != 3))) {
        $('.previous').addClass('disabled').off('click touch');
      }
      // If our position plus the size of the page is greater than length, we're showing the last entries
      if ((parseInt(productlist.i) + parseInt(productlist.page)) > productlist.matchingItems.length) {
        if (productlist.page != 3) {
          $('.next').addClass('disabled').off('click touch');
        }
      }
      // Add or remove dummy element for first item in slide view.
      if (productlist.i <= 0) {
        $('.slider').prepend(dummy_template.render(productlist.matchingItems[productlist.matchingItems.length-1].values()));
      } 
      if (productlist.i == productlist.matchingItems.length-1) {
        $('.slider').append(dummy_template.render(productlist.matchingItems[0].values()));
      } 
      if (!((productlist.i == productlist.matchingItems.length-1) || (productlist.i <= 0))) {
        $('.slider li.item-bookends').remove();
      }

      // For each visible li in the list, create a click handler that toggles visibility
      // and compiles the mustache for the current item.
      $('.list li .img').off('click touch').on('click touch', function(e) {
        var id = $(this).parent().find('.id').html();
        hash.add({detailedview:id});
      });

      // Add product details div 
      if (productlist.page == 3) {
        // Remove existing item details
        $('ul.list li .item-spotlight').remove();
        // Add the item detail information to the center slide
        var n = 1;
        // If we are on the first slide, our information is in the 0th item
        if (productlist.i == 0) n = 0;
        if (productlist.matchingItems.length == 1) n = 0;
        // Render the template with the correct data
        $('ul.slider li:nth-child(2)').append(spotlight_template.render(productlist.visibleItems[parseInt(n)].values()));
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
          if (_.isUndefined(localStorage.faves)) localStorage.faves = '';
          var current = localStorage.faves.split(',');
          current.push(id);
          localStorage.faves = _.compact(_.uniq(current)).join(',');
          $('.item-spotlight').append(favorites_template.render({message:'Item added to your favorites!'}));
          $('.alert-favorite').find('a').attr('href', $('.alert-favorite').find('a').attr('href') + localStorage.faves);
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
          productlist.page = 40;
          $('.list').removeClass('slider');
          $('ul.list li .item-spotlight').remove();

          $('ul.list li').each(function(i) {
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
    $('input[type=checkbox]').on('click touch', function(e) {
      productlist.filter();
      var f = [];
      $('#attributes :checkbox:checked').each(function(i) {
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
      if (productlist.page == 3) { productlist.i = productlist.i-1; }
      productlist.update();
    });


    // Process the hash if we're just loading the page and have values
    if (window.location.hash.length > 0) {
      var g = hash.get('attributes');
      if (typeof(g) != 'undefined') {
        var f = g.split(',');
        // Toggle checkboxes for any attributes that are found.
        for (var i=0; i<f.length; i++) {
          $('#attributes').find(':checkbox[value="' + f[i] +'"]').attr('checked',true);
        }
      }
      // Trigger a hashchange event to actually process the filter
      $(window).trigger('hashchange');
    }


    // Toggle to slide view mode
    $('#slide').on('click touch', function(e) {
      e.preventDefault();
      productlist.page = 3;
      var pos = parseInt(productlist.i)-1;
      // If it's the first item, simulate centering
      $('.list').addClass('slider');
      // Only allow one button to be enabled at a time
      $('#slide').toggle();
      $('#thumbs').toggle();
      hash.add({pos:pos});
    });

    // Toggle to thumb view mode
    $('#thumbs').on('click touch', function(e) {
      e.preventDefault();
      // Hide details for center slide in "horizontal" view
      productlist.page = 40;
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
        // Calculate the nearest multiple of 40 by casting as an integer without going over. Like The Price is Right.
        pos = parseInt(productlist.i / 40) * 40 + 1;
      }
      $('.list').removeClass('slider');
      $('#slide').toggle();
      $('#thumbs').toggle();
      $('ul.list li .item-spotlight').remove();
      hash.add({pos:pos});
    });

    // Keep the dropdown menu from closing after an option is selected
    $('.dropdown-menu input, .dropdown-menu label').click(function(e) {
      e.stopPropagation();
    });
  });
  
  // This should probably be in the css, no?
  $(".rulers .ruler-cm").hide();
});