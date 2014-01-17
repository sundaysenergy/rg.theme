/*** JS for pricelist functionality ***/

// Retrieve the pricelist json file and get started
$.getJSON('http://rg.cape.io/items/client_data.json', function(data) {
  
  var template = Hogan.compile('{{#items}}<tr><td>{{color}}</td><td>{{content}}</td><td>{{id}}</td><td>{{name}}</td><td>{{tradeprice}}</td><td>{{repeat}}</td><td>{{width}}</td></tr>{{/items}}'); 
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