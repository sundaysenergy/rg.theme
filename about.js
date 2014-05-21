
// commenting to see if this works
var ww = $(window).width();
$('#photostream').width(ww*2).css('margin-left', (ww/2)*-1);
$('#slider1').width(ww*2);

// lemmon
// came from http://jquery.lemmonjuice.com/plugins/slider-variable-widths.php and then customized from there
$( '#slider1' ).lemmonSlider({
  'infinite' : true
});
