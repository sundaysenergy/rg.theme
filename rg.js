/* some stuff here */
$(document).ready(function() {
  $('.fa-search').hover(function() {
    $('#search-items').slideToggle();
    $('#search-items').on('submit', function(e) {
      e.preventDefault();
      var collection = hash.get('collection');
      if (_.isUndefined(collection)) collection = 'textile';
      window.location = '/collection.html#collection='+collection+'&search=' + encodeURIComponent($('#search-items').find('input').val());
    });
    $('.fa-search').off('mouseenter');
  }, function() {

  });
  var token = $.cookie('token');
  if (_.isUndefined(token) == false) $('ul.trade-login').removeClass('disabled');
});