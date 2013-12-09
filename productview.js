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
  $.getJSON('http://rg.cape.io/items/items.json', function(data) {
    var options = {
      valueNames: [ 'image', 'content', 'id' ],
      item: '<li><span style="display:none" class="id"></span><img class="img"><br><span class="content"></span></li>',
      page: 40
    };


    // Create a new list
    var productlist = new List('products', options, data);
    // Hacky thing to set the height -- Remove this later.
    productlist.on('updated', function() {
      (function() {
        var max_height = 0;
        $('#products .list li').each(function() {
          var cur_height = $(this).height();
          if (cur_height > max_height) { max_height = cur_height; }
        });
        $('#products .list li').css('height', max_height);
        $('#products .list li').css('max-height', max_height);
      })();
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
      if (productlist.i <= 0) {
        $('.slider').prepend('<li class="firstitem"></li>');
      } else {
        $('.slider li.firstitem').remove();
      }
      $('.list li').off('click touch').on('click touch', function(e) {
        $('html,body').css('overflow','hidden').height($(window).height());
        // Grab and compile template -- move this to global once we get it working.
        var id = $(this).find('.id').html();
        var item = { item : productlist.get('id', id)[0].values() };
        item.item.img_large = item.item.img.replace('640','1536');
        $('.itemoverlay').slideToggle().html(item_template.render(item));
        $('button.close').off('click touch').on('click touch', function(e) {
          $('.itemoverlay').slideToggle();
          $('body').css('overflow','auto');
        });
      });
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
      // If we have terms filter, otherwise the filter reset will start us fresh
      if (f.length > 0) {
        productlist.filter(function(item) {
          var match = false;
          // Reduce function that could be made search any by removing the else statement
          for (var i = 0; i<f.length; i++) {
            if (item.values().content.toLowerCase().indexOf(f[i].toLowerCase()) >= 0) {
              match = true;
            } else {
              match = false;
              break;
            }
          }
          return match;
        });
        // If we're in slide mode, shift one to the right
        if (productlist.page == 3) { productlist.i = productlist.i-1; }
        productlist.update();
      } else {
        // If we're in slide mode, shift one to the right
        if (productlist.page == 3) { productlist.i = productlist.i-1; }
        productlist.update();
      }
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
  });
});