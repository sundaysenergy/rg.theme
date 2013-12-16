/* some stuff here */
$('.fa-search').hover(function() {
  $('#search-items').slideToggle();
  $('#search-items').on('submit', function(e) {
    e.preventDefault();
    window.location = '/collection.html#collection=textile&search=' + encodeURIComponent($('#search-items').find('input').val());
  });
  $('.fa-search').off('mouseenter');
}, function() {

});
