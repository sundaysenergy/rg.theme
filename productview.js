$(document).ready(function() {

  // A little bit of stuff for the ruler controls
  // this works okay, maybe there is something better?
  $(".rulers .ruler-cm").hide();

  $("a.ruler-inches").click(function() {
    event.preventDefault();
    $(".rulers img.ruler-inches").show();
    $(".rulers img.ruler-cm").hide();
    $(this).parent().addClass("active");
    $(this).parent().next("li").removeClass("active");
  });

  $("a.ruler-cm").click(function() {
    event.preventDefault();
    $(".rulers img.ruler-cm").show();
    $(".rulers img.ruler-inches").hide();
    $(this).parent().addClass("active");
    $(this).parent().prev("li").removeClass("active");
  });

  // End ruler controls for now
  
  // Download and compile the template for item view.
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
  var favorites_template = Hogan.compile('<div class="alert-favorite alert alert-dismissable" style="width:50%; margin-left: 25%; background: #fff"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>{{message}}<br><br><a href="/collection.html#faves=">View and share</a></div>');

  // Retrieve a list of items from cape
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

    // Process filters on hashchange
    $(window).on('hashchange', function(e) {
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
      }
      // If either attributes or collection are undefined, we have filter elements to process
      if ((typeof(f) != 'undefined') || (typeof(collection) != 'undefined' || _.isUndefined(srch) == false) || _.isUndefined(faves) == false) {
        productlist.filter(function(item) {
          // Set our default to false, and explicit define matches
          var match = false;
          // Favorite list gets processed first
          if (_.isUndefined(faves) == false) {
            if (_.indexOf(favorites, item.values().id) >= 0) {
              console.log(item.values().id);
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
      }
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

      // Handle detailed view
      if (_.isUndefined(hash.get('detailedview')) == false) {
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
        if (_.isUndefined(n)) {
          n = 1;
        }
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
            hash.add({dpos:parseInt(relatedlist.i)+1});
            relatedlist.show(parseInt(relatedlist.i)+1, parseInt(relatedlist.page));
          });
          $('.rel-previous').off('click touch').on('click touch', function(e) {
            hash.add({dpos:parseInt(relatedlist.i)-1});
            relatedlist.show(parseInt(relatedlist.i)-1, parseInt(relatedlist.page));
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
          $('.itemoverlay').hide();
          hash.remove('detailedview');
          hash.remove('dpos');
          $('html,body').css('overflow','hidden').height($(window).height());
        });
      }
      return false;
    });

    // When the list is updated, we need to rework the pager buttons
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
        var n = parseInt(productlist.page);
        // If we're viewing three at a time, only increment by one item.
        // Otherwise, increment by one page.
        if (n == 3) { n = 1; }
        var p = parseInt(productlist.i)+parseInt(n);
        if (p == productlist.matchingItems.length) p = 0;
        hash.add({pos:p});
      });
      $('.previous').off('click touch').on('click touch', function(e) {
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
      } else if (productlist.i == productlist.matchingItems.length-1) {
        $('.slider').append(dummy_template.render(productlist.matchingItems[0].values()));
      } else {
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
        // Render the template with the correct data
        $('ul.list li:nth-child(2)').append(spotlight_template.render(productlist.visibleItems[parseInt(n)].values()));
        // Create click handlers for the icon and the close button
        $('.item-spotlight .item-icons button.item-details, .item-spotlight .item-information button.item-toggle').off().on('click touch', function(e) {
          e.preventDefault();
          $('.item-spotlight .item-information').slideToggle();
        });
        // Create click handler for favorite
        $('.item-spotlight .item-icons button.item-favorite').on('click touch', function(e) {
          e.preventDefault();
          var id = $('.list li:nth-child(2)').find('.id').html();
          if (_.isUndefined(localStorage.faves)) localStorage.faves = '[]';
          var current = JSON.parse(localStorage.faves);
          current.push(id);
          localStorage.faves = JSON.stringify(current);
          $('.item-spotlight').append(favorites_template.render({message:'Item added to your favorites!'}));
          $('.alert-favorite').find('a').attr('href', $('.alert-favorite').find('a').attr('href') + JSON.parse(localStorage.faves).join(','));
        });
        // Click on the left image should decrement by one, while the right image should increment
        $('ul.list li:nth-child(1) .img').off('click touch').on('click touch', function(e) {
          var p = parseInt(productlist.i)-1;
          if (p == -1) p = productlist.matchingItems.length-1;
          hash.add({pos:p});
        });
        $('ul.list li:nth-child(3) .img').off('click touch').on('click touch', function(e) {
          var p = parseInt(productlist.i)+1;
          if (p == productlist.matchingItems.length) p = 0;
          hash.add({pos:p});
        });
      } else {
        // If we're not in 3-up mode, make sure we don't have any stray item details
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
      /* If we are showing the first item, adding a dummy to push it one to the right
         Otherwise, make sure we remove all dummies */
      if (pos == 0) {
        $('.slider').prepend('<li class="firstitem"></li>');
      } else {
        $('.slider li.firstitem').remove();
      }
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
      $('.slider li.firstitem').remove();
      $('.list').removeClass('slider');
      $('#slide').toggle();
      $('#thumbs').toggle();
      $('ul.list li .item-spotlight').remove();
      hash.add({pos:pos});
    });


    // Add collection value to hash -- doing this instead of href in case filters are set
    $('ul.collection-filter li a').on('click touch', function(e) {
      e.preventDefault();
      var m = $(this).attr('href').split('=')[1];
      hash.remove('pos');
      hash.add({ collection: m });
      return false;
    });

    // Keep the dropdown menu from closing after an option is selected
    $('.dropdown-menu input, .dropdown-menu label').click(function(e) {
      e.stopPropagation();
    });
  });
});