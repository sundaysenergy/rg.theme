$(document).ready(function() {

  $('#search-items').off('submit').on('submit', function(e) {
    e.preventDefault();
    var collection = hash.get('collection');
    if (_.isUndefined(collection)) collection = 'textile';
    window.location = '/app.html#collection/textile/12/' + encodeURIComponent($('#search-items').find('input').val())+'/p1';
    // #collection/textile/12/sam/p1
  });

  // Expose a search box when clicking on the icon
  $('.fa-search').on('click touch', function() {
    $('#search-items').slideToggle();
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

  // Navigation menu sliding for landing page
/*
  if (ww >= 769) {
    $.when($('.landing .navwrap').hide()).then(function () {
      $('.landing .masthead').hover(
        function() {
          if ($('.landing nav .navwrap').is(':visible') == false) {
            $('.landing nav .navwrap').slideDown();
            console.log('sliding down');
          }
        }, function() {
          if ($('.landing nav .navwrap').is(':visible') == true) {
            $('.landing nav .navwrap').slideUp();
            console.log('sliding up');
          }
        }
      );
    });
  }

*/
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

/*
  if (ww >= 769) {
    $.when($('.landing .navwrap').hide()).then(function () {
      $('.landing .masthead').hover(
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

*/
});
