/*** Files for pricelist functionality ***/

$.getJSON('http://rg.cape.io/trade/pricelist.json', function(data) {
  console.log(data);
  // Define value names
  var options = {
    valueNames: [ 'color', 'content', 'id', 'name', 'price', 'repeat', 'width' ],
    page: 50,
    plugins: [
                ListFuzzySearch()
             ]
  };
  // Init list
  var textiles = new List('textiles', options, data);
  textiles.on('updated', function() {
    $('.previous, .next').removeClass('disabled');
    $('.next').off('click touch').on('click touch', function(e) {
      textiles.show(parseInt(textiles.i)+parseInt(textiles.page), parseInt(textiles.page));
    });
    $('.previous').off('click touch').on('click touch', function(e) {
      textiles.show(parseInt(textiles.i)-parseInt(textiles.page), parseInt(textiles.page));
    });
    if (parseInt(textiles.i) < parseInt(textiles.page)) {
      $('.previous').addClass('disabled').off('click touch');
    }
    if ((parseInt(textiles.i) + parseInt(textiles.page)) > textiles.matchingItems.length) {
      $('.next').addClass('disabled').off('click touch');
    }
  });
  textiles.update();
  textiles.sort('name', { asc: true });
  $('th').on('click', function() {
    $('.fa-caret-down, .fa-caret-up').each(function(i) {
      $(this).remove();
    });
    if ($(this).hasClass('desc')) {
      $(this).append(' <i class="fa fa-caret-down"></i>');
    } else {
      $(this).append(' <i class="fa fa-caret-up"></i>');
    }
  });
});