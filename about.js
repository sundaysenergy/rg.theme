
// commenting to see if this works
var ww = $(window).width();
$('#photostream').width(ww).css('margin-left', (ww/2)*-1);

// lemmon
// came from http://jquery.lemmonjuice.com/plugins/slider-variable-widths.php and then customized from there
$( '#slider1' ).lemmonSlider({
  'infinite' : true
});
