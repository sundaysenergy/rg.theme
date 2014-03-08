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

  // Navigation menu sliding for landing page
  $.when($('.landing .navwrap').hide()).then(function () {
    $('.landing header').hover(
      function() {
        if ($('.landing nav .navwrap').is(':visible') == false) {
          $('.landing nav .navwrap').slideDown();
        }
      }, function() {
        if ($('.landing nav .navwrap').is(':visible') == true) {
          $('.landing nav .navwrap').slideUp();
        }
      }
    );
  });

  // Contact page basics 
  $("section.toggle .slider").hide();
 
  $("section.general-inquiries h2").click(function () {
    $(this).parent().children(".slider").slideToggle();
    $('section.showrooms').children(".slider").slideUp();
  });

  $('section.showrooms h2').click(function () {
    $(this).parent().children('.slider').slideToggle();
    $('section.general-inquiries').children('.slider').slideUp();

    $('.top li.showroom:nth-child(1)').addClass('col-md-offset-2');
    $('.aust-europe li.showroom:nth-child(1)').addClass('col-md-offset-2');
    
    var srw = $('section.showrooms').width();

    if (srw == 720) {
      $('.north-america li.showroom:nth-child(2n)').after('<div class="clearfix visible-sm"></div>');
    }
    if (srw >= 940) {
      $('.north-america li.showroom:nth-child(3n)').after('<div class="clearfix visible-md visible-lg"></div>');
    }
    
  });

});

$(window).resize(function() {
  var srw = $('section.showrooms').width();

  if (srw == 720) {
    $('.north-america li.showroom:nth-child(2n)').after('<div class="clearfix visible-sm"></div>');
  }
  if (srw >= 940) {
    $('.north-america li.showroom:nth-child(3n)').after('<div class="clearfix visible-md visible-lg"></div>');
  }
});
