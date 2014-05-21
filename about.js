// commenting to see if this works
var ww = $(window).width();
$('#photostream').width(ww).css('margin-left', (ww/2)*-1);

$.fn.cycle.transitions.carousel.transition = function( opts, curr, next, fwd, callback ) {
  var moveBy, props = {};
  var hops = opts.nextSlide - opts.currSlide;
  var vert = opts.carouselVertical;
  var speed = opts.speed;

  // handle all the edge cases for wrapping & non-wrapping
  if ( opts.allowWrap === false ) {
    fwd = hops > 0;
    var currSlide = opts._currSlide;
    var maxCurr = opts.slideCount - opts.carouselVisible;
    if ( hops > 0 && opts.nextSlide > maxCurr && currSlide == maxCurr ) {
      hops = 0;
    }
    else if ( hops > 0 && opts.nextSlide > maxCurr ) {
      hops = opts.nextSlide - currSlide - (opts.nextSlide - maxCurr);
    }
    else if ( hops < 0 && opts.currSlide > maxCurr && opts.nextSlide > maxCurr ) {
      hops = 0;
    }
    else if ( hops < 0 && opts.currSlide > maxCurr ) {
      hops += opts.currSlide - maxCurr;
    }
    else 
      currSlide = opts.currSlide;

    moveBy = this.getScroll( opts, vert, currSlide, hops );
    opts.API.opts()._currSlide = opts.nextSlide > maxCurr ? maxCurr : opts.nextSlide;
  }
  else {
    if ( fwd && opts.nextSlide === 0 ) {
      // moving from last slide to first
      moveBy = this.getDim( opts, opts.currSlide, vert );
      callback = this.genCallback( opts, fwd, vert, callback );
    }
    else if ( !fwd && opts.nextSlide == opts.slideCount - 1 ) {
      // moving from first slide to last
      moveBy = this.getDim( opts, fwd ? opts.currSlide: opts.nextSlide, vert );
      callback = this.genCallback( opts, fwd, vert, callback );
    }
    else {
      moveBy = this.getDim( opts, fwd ? opts.currSlide: opts.nextSlide, vert );
        
    }
  }

  props[ vert ? 'top' : 'left' ] = fwd ? ( "-=" + moveBy ) : ( "+=" + moveBy );

  // throttleSpeed means to scroll slides at a constant rate, rather than
  // a constant speed
  if ( opts.throttleSpeed )
    speed = (moveBy / $(opts.slides[0])[vert ? 'height' : 'width']() ) * opts.speed;

  opts._carouselWrap.animate( props, speed, opts.easing, callback );
};