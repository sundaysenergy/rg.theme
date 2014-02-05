/*** JS for pricelist functionality ***/

  var item_prices = [];
  var token = $.cookie('token');
  
  if (_.isUndefined(token) == false) {
    $.ajax({
      url: rg_options.api + '/items/price.json',
      type: 'GET',
      async: false,
      headers: { Authorization: 'bearer '+token },
      contentType: 'application/json',
      success: function(result) {
        item_prices = result;
      }
    });
  }

var itemPrice = function(itemno) {
  var price = (_.isUndefined(item_prices[itemno])) ? 'Not available':parseInt(item_prices[itemno]).toFixed(2);
  return price;
}

// Retrieve the pricelist json file and get started
$.getJSON(rg_options.api + '/items/client_data.json', function(data) {
  
  _.forEach(data.items, function(item) {
    item.tradeprice = _.bind(itemPrice, item_prices, item.id);
  });

  var template = Hogan.compile('{{#items}}<tr><td class="color">{{color}}</td><td class="content">{{content}}</td><td class="id">{{id}}</td><td class="name">{{name}}</td><td class="tradeprice">{{tradeprice}}</td><td class="repeat">{{repeat}}</td><td class="width">{{width}}</td></tr>{{/items}}'); 
  $('tbody.list').hide();
  $('tbody.list').html(template.render(data));

  // Define value names and other options
  var options = {
    valueNames: [ 'color', 'content', 'id', 'name', 'price', 'repeat', 'width' ],
    page: 50,
    plugins: [
                ListFuzzySearch()
             ]
  };
  // Init list
  var textiles = new List('textiles', options, data);
  $('tbody.list').show();
  
  // When the list is updated, we need to rework the pager buttons
  textiles.on('updated', function() {
    $('.previous, .next').removeClass('disabled');
    $('.next').off('click touch').on('click touch', function(e) {
      textiles.show(parseInt(textiles.i)+parseInt(textiles.page), parseInt(textiles.page));
    });
    $('.previous').off('click touch').on('click touch', function(e) {
      textiles.show(parseInt(textiles.i)-parseInt(textiles.page), parseInt(textiles.page));
    });
    // If our position is less than the number of entries per page, assume we are on page #1
    if (parseInt(textiles.i) < parseInt(textiles.page)) {
      $('.previous').addClass('disabled').off('click touch');
    }
    // If our position plus the size of the page is greater than length, we're showing the last entries
    if ((parseInt(textiles.i) + parseInt(textiles.page)) > textiles.matchingItems.length) {
      $('.next').addClass('disabled').off('click touch');
    }
  });

  // Manually update the list to trigger the button mods
  textiles.update();

  // Manually sort the list with our default order -- change this if list.js has this functionality
  textiles.sort('name', { asc: true });
  
  // Add font awesome icons for ascending and descending sorts
  $('th').on('click', function() {
    
    // First remove any existing sort indicators
    $('.fa-caret-down, .fa-caret-up').each(function(i) {
      $(this).remove();
    });

    // Then add an icon based on presence of ascending or descending class
    if ($(this).hasClass('desc')) {
      $(this).append(' <i class="fa fa-caret-down"></i>');
    } else {
      $(this).append(' <i class="fa fa-caret-up"></i>');
    }
  });
});