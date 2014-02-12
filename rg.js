$(document).ready(function() {
  // Expose a search box when hovering over the icon
  $('.fa-search').hover(function() {
    $('#search-items').slideToggle();
    // Capture the form submission and redirect with a default collection
    $('#search-items').on('submit', function(e) {
      e.preventDefault();
      var collection = hash.get('collection');
      if (_.isUndefined(collection)) collection = 'textile';
      window.location = '/collection.html#collection='+collection+'&search=' + encodeURIComponent($('#search-items').find('input').val());
    });
    $('.fa-search').off('mouseenter');
  }, function() {

  });
  // If there's a token, enable the sub navigation menu
  var token = $.cookie('token');
  if (_.isUndefined(token) == false) {
    $('ul.trade-login').removeClass('disabled');
    $('a[href="/trade/login.html"]').attr('href', '/trade/account.html');
  }
  // Add active class to the parent of the current href
  $('.masthead nav ul li a[href="'+window.location.pathname+'"]').parent().addClass('active');

  // Add the active class to the ul for trade login if /trade is in the path
  if (window.location.pathname.indexOf('/trade') >= 0) {
    $('.masthead nav ul li > ul').addClass('active');
  } else {
    $('.masthead nav ul li > ul').removeClass('active');
  }
});

// slideup/slidedown of landing page menu

$(document).ready(function() {
  
  $('.landing .navwrap').hide();
  
  $('.landing header').mouseover( function(){
      $('.landing nav .navwrap').slideDown();
  })
  $('.landing header').mouseleave( function(){
      $('.landing nav .navwrap').slideUp();
  });

});

// contact page basics

$(document).ready(function() {
   $("section.toggle .slider").hide();
 
  $("section.toggle h2").click(function () {
    $(this).parent().children(".slider").slideToggle();
  });    

 });
