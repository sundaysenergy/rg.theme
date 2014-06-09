$(document).ready(function() {
  
  $('#search-items').off('submit').on('submit', function(e) {
    e.preventDefault();
    var collection = hash.get('collection');
    if (_.isUndefined(collection)) collection = 'textile';
    window.location = '/collection.html#collection='+collection+'&search=' + encodeURIComponent($('#search-items').find('input').val());
  });
  
  // Expose a search box when hovering over the icon
  $('.fa-search').parent().hover(function() {
    if ($('#search-items').is(':visible') == false) {
      $('#search-items').slideDown();
    }
  }, function() {
    if ($('#search-items').is(':visible') == true) {
      $('#search-items').slideUp();
    }
  });

  // Expose a search box when clicking on the icon
  $('.fa-search').click(function() {
    if ($('#search-items').is(':visible') == false) {
      $('#search-items').slideDown();
    }
  }, function() {
    if ($('#search-items').is(':visible') == true) {
      $('#search-items').slideUp();
    }
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
  var ww = $(window).width();
  if (ww >= 769) {
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
  }

  $('.navbar-toggle .icon-bar').on('click touch', function() {

    var ncollapse = $('nav .navwrap').hasClass('collapse');
    var ncollapsing = $('nav .navwrap').hasClass('collapsing');
    var nin = $('nav .navwrap').hasClass('in');

    if (ncollapse === true) {
      $('.navbar-header').css('visibility','hidden');
    } else if (ncollapsing === true) {
      $('.navbar-header').css('visibility','hidden');
    } else if (nin === true) {
      $('.navbar-header').css('visibility','visible');
    } else {
      $('.navbar-header').css('visibility','visible');
    }
    
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
  });

  var ww = $(window).width();
  var wh = $(window).height();

  if (ww >= wh) {
    $('body').addClass('wider');
    $('body').removeClass('taller');
  }

  if (wh > ww) {
    $('body').addClass('taller');
    $('body').removeClass('wider');
  }

});

$(window).resize(function() {
  var ww = $(window).width();
  var wh = $(window).height();

  if (ww >= wh) {
    $('body').addClass('wider');
    $('body').removeClass('taller');
  }

  if (wh > ww) {
    $('body').addClass('taller');
    $('body').removeClass('wider');
  }

});

