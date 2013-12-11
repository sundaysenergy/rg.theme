$(document).ready(function() {
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
  
  // Retrieve a list of items from cape
  $.getJSON('http://rg.cape.io/items/items-color.json', function(combined) {
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
      var i = item.id.split("-");
      i.pop();
      item.itemcolors = _.bind(findColors, colors, i.join("-"));
      item.linkitem = function () {
                        var attributes = hash.get('attributes');
                        var collection = hash.get('collection');
                        var returnhash = '';
                        if (_.isUndefined(attributes) == false) {
                          returnhash = returnhash + 'attributes=' + attributes + '&';
                        }
                        if (_.isUndefined(collection) == false) {
                          returnhash = returnhash + 'collection=' + collection + '&';
                        }
                        return returnhash;
                      };
    });

    // Create a new list
    var productlist = new List('products', options, data);

    // Process filters on hashchange
    $(window).on('hashchange', function(e) {
      e.preventDefault();
      f = hash.get('attributes');
      var collection = hash.get('collection');
      var attributes = [];
      if (typeof(f) != 'undefined') { attributes = f.split(','); }
      // Clear any existing filter
      productlist.filter();
      // If either attributes or collection are undefined, we have filter elements to process
      if ((typeof(f) != 'undefined') || (typeof(collection) != 'undefined')) {
        productlist.filter(function(item) {
          var match = false;
          // If we have a collection, see if the item matches the selected collection
          if (typeof(collection) != 'undefined') {
            if (item.values().collection.toLowerCase().indexOf(collection.toLowerCase()) >= 0) {
              match = true;
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
                  match = false;
                  break;
                }
              }
            }
          }
          return match;
        });
      }

      // Testing. Code should be combined with li click handler
      if (_.isUndefined(hash.get('detailedview')) == false) {
        $('html,body').css('overflow','hidden').height($(window).height());
        var id = hash.get('detailedview');
        var item = { item : productlist.get('id', id)[0].values() };
        item.item.img_large = item.item.img.replace('640','1536');
        $('.itemoverlay').show().html(item_template.render(item));
        var options = {
          valueNames: [ 'related-item' ],
          page: 3
        };
        var relatedlist = new List('related-products', options);
        relatedlist.on('updated', function() {
          $('.rel-previous, .rel-next').removeClass('disabled');
          $('.rel-next').off('click touch').on('click touch', function(e) {
            relatedlist.show(parseInt(relatedlist.i)+1, parseInt(relatedlist.page));
          });
          $('.rel-previous').off('click touch').on('click touch', function(e) {
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
        $('button.close').off('click touch').on('click touch', function(e) {
          $('.itemoverlay').hide();
          hash.remove('detailedview');
          $('body').css('overflow','auto');
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
        .html(productlist.i+1)
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
        productlist.show(parseInt(productlist.i)+n, parseInt(productlist.page));
      });
      $('.previous').off('click touch').on('click touch', function(e) {
        var n = parseInt(productlist.page);
        // If we're viewing three at a time, only increment by one item
        if (n == 3) { n = 1; }
        productlist.show(parseInt(productlist.i)-n, parseInt(productlist.page));
      });
      // If our position is less than the number of entries per page, assume we are on page #1
      // Unless we're viewing three at a time -- go to zero then
      if (((parseInt(productlist.i) < parseInt(productlist.page)) &&
          (productlist.page != 3)) || (productlist.i<1)) {
        $('.previous').addClass('disabled').off('click touch');
      }
      // If our position plus the size of the page is greater than length, we're showing the last entries
      if ((parseInt(productlist.i) + parseInt(productlist.page)) > productlist.matchingItems.length) {
        if (productlist.page != 3) {
          $('.next').addClass('disabled').off('click touch');
        } else if (productlist.i == (productlist.matchingItems.length-1)) {
          $('.next').addClass('disabled').off('click touch');
        }
      }
      // Add or remove dummy element for first item in slide view.
      if (productlist.i <= 0) {
        $('.slider').prepend('<li class="firstitem"></li>');
      } else {
        $('.slider li.firstitem').remove();
      }
      // For each visible li in the list, create a click handler that toggles visibility
      // and compiles the mustache for the current item.
      $('.list li').off('click touch').on('click touch', function(e) {
        $('html,body').css('overflow','hidden').height($(window).height());
        var id = $(this).find('.id').html();
        var item = { item : productlist.get('id', id)[0].values() };
        item.item.img_large = item.item.img.replace('640','1536');
        $('.itemoverlay').show().html(item_template.render(item));

        // Turn the related items block into a paginated list
        var options = {
          valueNames: [ 'related-item' ],
          page: 3
        };
        var relatedlist = new List('related-products', options);
        relatedlist.on('updated', function() {
          $('.rel-previous, .rel-next').removeClass('disabled');
          $('.rel-next').off('click touch').on('click touch', function(e) {
            relatedlist.show(parseInt(relatedlist.i)+1, parseInt(relatedlist.page));
          });
          $('.rel-previous').off('click touch').on('click touch', function(e) {
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

        $('button.close').off('click touch').on('click touch', function(e) {
          $('.itemoverlay').hide();
          hash.remove('detailedview');
          $('body').css('overflow','auto');
        });
      });
    }); // end productlist.on('updated')


    // Manually trigger an update
    productlist.update();

    // Process the hash if we're just loading the page and have values
    if (window.location.hash.length > 0) {
      var g = hash.get('attributes');
      if (typeof(g) != 'undefined') {
        var f = g.split(',');
        // Toggle checkboxes for any attributes that are found.
        for (var i=0; i<f.length; i++) {
          $('#attributes').find(":checkbox[value=" + f[i] +"]").attr('checked',true);
        }
      }
      // Trigger a hashchange event to actually process the filter
      $(window).trigger('hashchange');
    }

    // When we check or uncheck a box, recalculate search terms
    $('input[type=checkbox]').on('click touch', function(e) {
      productlist.filter();
      var f = [];
      $('#attributes :checkbox:checked').each(function(i) {
        f.push($(this).val());
      });
      // If we have terms filter, otherwise the filter reset will start us fresh
      if (f.length > 0) {
        hash.add({attributes : f.join(',') });
      } else {
        hash.remove('attributes');
      }
      if (productlist.page == 3) { productlist.i = productlist.i-1; }
      productlist.update();
    });


    // Toggle to slide view mode
    $('#slide').on('click touch', function(e) {
      e.preventDefault();
      productlist.page = 3;
      productlist.i = productlist.i-1; // We want to "center" the active item.
      productlist.update();
      // If it's the first item, simulate centering
      $('.list').addClass('slider');
      /* If we are showing the first item, adding a dummy to push it one to the right
         Otherwise, make sure we remove all dummies */
      if (productlist.i == 0) {
        $('.slider').prepend('<li class="firstitem"></li>');
      } else {
        $('.slider li.firstitem').remove();
      }
      // Only allow one button to be enabled at a time
      $('#slide').addClass('disabled');
      $('#thumbs').removeClass('disabled');
    });

    // Toggle to thumb view mode
    $('#thumbs').on('click touch', function(e) {
      e.preventDefault();
      productlist.page = 40;
      productlist.update();
      // If we have fewer visible items than page size and matching != visible (one page with only a few items)
      if ((productlist.visibleItems.length < productlist.page) && 
          (productlist.visibleItems.length != productlist.matchingItems.length)) {
        var remainder = productlist.matchingItems.length;
        var pagesize = productlist.page;
        // Calculate the remainder -- switch to math based method below sometime.
        while (remainder > pagesize) { remainder = remainder - pagesize; }
        productlist.show(productlist.matchingItems.length-remainder+1, pagesize);
      }  else {
        // Calculate the nearest multiple of 40 by casting as an integer without going over. Like The Price is Right.
        var startpos = parseInt(productlist.i / 40) * 40;
        productlist.show(startpos+1, productlist.page);
      }
      productlist.update();
      $('.slider li.firstitem').remove();
      $('.list').removeClass('slider');
      $('#slide').removeClass('disabled');
      $('#thumbs').addClass('disabled');
    });


    // Add collection value to hash
    $('ul.collection-filter li a').on('click touch', function(e) {
      e.preventDefault();
      var m = $(this).attr('href').split('=')[1];
      hash.add({ collection: m });
      return false;
    });
  });
});