// new totally custom stuff below here...

var aboutss = function() {

  var ww = $(window).width();
  $('#photostream').width(ww).css('margin-left', (ww/2)*-1);

  var orig_li = $('#photostream ul li.orig');
  var accum_width = 0;

  // individual image sizes
  // any way to do this dynamically so if the number of slides changes this doesn't have to be rewritten?
  var slot1  = orig_li.eq(0).width() + 5;
  var slot2  = orig_li.eq(1).width() + 5;
  var slot3  = orig_li.eq(2).width() + 5;
  var slot4  = orig_li.eq(3).width() + 5;
  var slot5  = orig_li.eq(4).width() + 5;
  var slot6  = orig_li.eq(5).width() + 5;
  var slot7  = orig_li.eq(6).width() + 5;
  var slot8  = orig_li.eq(7).width() + 5;
  var slot9  = orig_li.eq(8).width() + 5;
  var slot10 = orig_li.eq(9).width() + 5;
  var slot11 = orig_li.eq(10).width() + 5;

  orig_li.find('img').each(function() {
     accum_width += $(this).width() + 5;
  });

  $('#photostream ul').width(accum_width * 3).css('margin-left', ((accum_width * 3)/2)*-1);

  orig_li.clone().addClass('-after').removeClass('orig').insertAfter( orig_li.filter( ':last' ) );
  orig_li.filter( ':first' ).before( orig_li.clone().addClass( '-before' ).removeClass('orig') );
  
  orig_li.eq(0).addClass('active');

  // reposition
  // any way to do this dynamically so if the number of slides changes this doesn't have to be rewritten?
  var center1  = accum_width + (slot1/2);
  var center2  = accum_width + slot1 + (slot2/2);
  var center3  = accum_width + slot1 + slot2 + (slot3/2);
  var center4  = accum_width + slot1 + slot2 + slot3 + (slot4/2);
  var center5  = accum_width + slot1 + slot2 + slot3 + slot4 + (slot5/2);
  var center6  = accum_width + slot1 + slot2 + slot3 + slot4 + slot5 + (slot6/2);
  var center7  = accum_width + slot1 + slot2 + slot3 + slot4 + slot5 + slot6 + (slot7/2);
  var center8  = accum_width + slot1 + slot2 + slot3 + slot4 + slot5 + slot6 + slot7 + (slot8/2);
  var center9  = accum_width + slot1 + slot2 + slot3 + slot4 + slot5 + slot6 + slot7 + slot8 + (slot9/2);
  var center10 = accum_width + slot1 + slot2 + slot3 + slot4 + slot5 + slot6 + slot7 + slot8 + slot9 + (slot10/2);
  var center11 = accum_width + slot1 + slot2 + slot3 + slot4 + slot5 + slot6 + slot7 + slot8 + slot9 + slot10 + (slot11/2);

  // center on actual active one...
  // any way to do this dynamically so if the number of slides changes this doesn't have to be rewritten?
  var center_on_active = function() {
    var index;
    var total   = orig_li.length;
    var tbefore = $('.slider li').filter('.-before').length;
    var tafter  = $('.slider li').filter('.-after').length;

        index   = orig_li.filter('.active').index();

    var active_one = index-tbefore;

    if (active_one === 0 ) {
      $('#photostream ul').css('margin-left', (center1*-1));
      $('.carousel-indicators li').eq(active_one).addClass('active').siblings().removeClass('active');
    }
    if (active_one === 1 ) {
      $('#photostream ul').css('margin-left', (center2*-1));
      $('.carousel-indicators li').eq(active_one).addClass('active').siblings().removeClass('active');
    }
    if (active_one === 2 ) {
      $('#photostream ul').css('margin-left', (center3*-1));
      $('.carousel-indicators li').eq(active_one).addClass('active').siblings().removeClass('active');
    }
    if (active_one === 3 ) {
      $('#photostream ul').css('margin-left', (center4*-1));
      $('.carousel-indicators li').eq(active_one).addClass('active').siblings().removeClass('active');
    }
    if (active_one === 4 ) {
      $('#photostream ul').css('margin-left', (center5*-1));
      $('.carousel-indicators li').eq(active_one).addClass('active').siblings().removeClass('active');
    }
    if (active_one === 5 ) {
      $('#photostream ul').css('margin-left', (center6*-1));
      $('.carousel-indicators li').eq(active_one).addClass('active').siblings().removeClass('active');
    }
    if (active_one === 6 ) {
      $('#photostream ul').css('margin-left', (center7*-1));
      $('.carousel-indicators li').eq(active_one).addClass('active').siblings().removeClass('active');
    }
    if (active_one === 7 ) {
      $('#photostream ul').css('margin-left', (center8*-1));
      $('.carousel-indicators li').eq(active_one).addClass('active').siblings().removeClass('active');
    }
    if (active_one === 8 ) {
      $('#photostream ul').css('margin-left', (center9*-1));
      $('.carousel-indicators li').eq(active_one).addClass('active').siblings().removeClass('active');
    }
    if (active_one === 9 ) {
      $('#photostream ul').css('margin-left', (center10*-1));
      $('.carousel-indicators li').eq(active_one).addClass('active').siblings().removeClass('active');
    }
    if (active_one === 10 ) {
      $('#photostream ul').css('margin-left', (center11*-1));
      $('.carousel-indicators li').eq(active_one).addClass('active').siblings().removeClass('active');
    }
    else {}
  };

  center_on_active();

  // oh crap — what to do when the last or first is reached?
  // any way to do this dynamically so if the number of slides changes this doesn't have to be rewritten?
  var before_after_fix = function() {
    var active_slide     = $('#photostream ul li.active');
    var active_indicator = $('.carousel-indicators li.active');

    if ( active_slide.hasClass('-before')) {
      active_slide.removeClass('active');
      orig_li.eq(10).addClass('active') // make this dynamically find the last one, not just eq(10)
    } else if ( active_slide.hasClass('-after')) {
      active_slide.removeClass('active');
      orig_li.eq(0).addClass('active') // make this dynamically find the first one, not just eq(0)
    } else {}
  };

  //okay prev/next actions...
  var next_slide = $('.controls .next-slide');
  var prev_slide = $('.controls .prev-slide');

  var slide_next = function() {
    var active_slide     = $('#photostream ul li.active');
    var active_indicator = $('.carousel-indicators li.active');
    active_slide.removeClass('active').next('li').addClass('active');
    before_after_fix();
    center_on_active();
  };

  var slide_prev = function() {
    var active_slide     = $('#photostream ul li.active');
    var active_indicator = $('.carousel-indicators li.active');
    active_slide.removeClass('active').prev('li').addClass('active');
    before_after_fix();
    center_on_active();
  };

  next_slide.click(function(e) {
    e.preventDefault();
    slide_next();
  });

  prev_slide.click(function(e) {
    e.preventDefault();
    slide_prev();
  });

  //Enable swiping...
  $("#photostream").swipe( {
    //Generic swipe handler for all directions
    swipe:function(event, direction, distance, duration, fingerCount) {
      if (direction=="left") {
        slide_next();
      } else if (direction=="right") {
        slide_prev();
      }
    },
    //Default is 75px, set to 0 for demo so any distance triggers swipe
     threshold:0
  });

  // okay... now to figure out the indicators.
  // any way to do this dynamically so if the number of slides changes this doesn't have to be rewritten?
  $('.carousel-indicators').on('click','li',function() {
    var indicator_count  = $(this).index();
    var tbefore = $('.slider li').filter('.-before').length;
    var active_indicator = indicator_count-tbefore;
    $(this).addClass('active');
    $(this).siblings().removeClass('active');
    var active_slide = $('#photostream ul li.active');
    active_slide.removeClass('active');
    orig_li.eq(active_indicator).addClass('active');
    center_on_active();
  });
  // end slideshow nonsense
};

aboutss();

// fix things up on resize...
$(window).resize(function() {
  aboutss();
});
