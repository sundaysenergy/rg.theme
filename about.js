// http://stackoverflow.com/questions/22364458/margin-around-elements-in-jquery-cycle2-carousel
// http://jsfiddle.net/bbernar1/3weH2/9/

// commenting to see if this works
var ww = $(window).width();
$('#photostream').width(ww).css('margin-left', (ww/2)*-1);
$('#slider1').width(ww).css('margin-left', (ww/2)*-1);

// lemmon

$( '#slider1' ).lemmonSlider({
  'infinite' : true
});
