
// new totally custom stuff below here...

var aboutss = function() {
  var ww = $(window).width();
  $('#photostream').width(ww).css('margin-left', (ww/2)*-1);
  
  var orig_li = $('#photostream ul li.orig');
  var accum_width = 0;
  
  // individual image sizes
  // how do I make this dynamic?
  var slot1 = orig_li.eq(0).width() + 5;
  var slot2 = orig_li.eq(1).width() + 5;
  var slot3 = orig_li.eq(2).width() + 5;
  var slot4 = orig_li.eq(3).width() + 5;
  var slot5 = orig_li.eq(4).width() + 5;
  
  orig_li.find('img').each(function() {
     accum_width += $(this).width() + 5;
  });
  
  $('#photostream ul').width(accum_width * 3).css('margin-left', ((accum_width * 3)/2)*-1);
  
  orig_li.clone().addClass('-after').removeClass('orig').insertAfter( orig_li.filter( ':last' ) );
  orig_li.filter( ':first' ).before( orig_li.clone().addClass( '-before' ).removeClass('orig') );
  orig_li.eq(0).addClass('active');
  
  // reposition
  var center1 = accum_width + (slot1/2);
  var center2 = accum_width + slot1 + (slot2/2);
  var center3 = accum_width + slot1 + slot2 + (slot3/2);
  var center4 = accum_width + slot1 + slot2 + slot3 + (slot4/2);
  var center5 = accum_width + slot1 + slot2 + slot3 + slot4 + (slot5/2);
  
  // center on actual active one...
  var center_on_active = function() {
    var index;
    var total = orig_li.length;
    var tbefore = $('.slider li').filter('.-before').length;
    var tafter = $('.slider li').filter('.-after').length;
    
        index = orig_li.filter('.active').index();
    
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
    else {}
  };
  
  center_on_active();
  
  //okay prev/next actions...
  var next_slide       = $('.controls .next-slide');
  var prev_slide       = $('.controls .prev-slide');
  
  next_slide.click(function(e) {
    e.preventDefault();
    var active_slide     = $('#photostream ul li.active');
    var active_indicator = $('.carousel-indicators li.active');
    active_slide.removeClass('active').next('li').addClass('active');
    // how to say that if "next slide has class of "-after" then figure out something else...?
    center_on_active();
  });
  
  prev_slide.click(function(e) {
    e.preventDefault();
    var active_slide     = $('#photostream ul li.active');
    var active_indicator = $('.carousel-indicators li.active');
    active_slide.removeClass('active').prev('li').addClass('active');
    // how to say that if "next slide has class of "-before" then figure out something else...?
    center_on_active();
  });
  
  // oh crap — what to do when the last or first is reached?
  
  // okay... now to figure out the indicators.
  // how do I make all the indicators print out automatically based on images that are hard coded?
  $('.carousel-indicators').on('click','li',function() {
  
    var indicator_count  = $(this).index();
    var tbefore = $('.slider li').filter('.-before').length;
    var active_indicator = indicator_count-tbefore;
    
    $(this).addClass('active');
    $(this).siblings().removeClass('active');
    
    var active_slide     = $('#photostream ul li.active');
    
    active_slide.removeClass('active');
    
    orig_li.eq(active_indicator).addClass('active');
    
    center_on_active();
  });
  
  // need to make indicators trigger sliding to its image as well...
  
  // end slideshow nonsense
};

aboutss();

// fix things up on resize...
$(window).resize(function() {
  aboutss();
});
