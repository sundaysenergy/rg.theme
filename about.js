
// commenting to see if this works
var ww = $(window).width();
$('#photostream').width(ww).css('margin-left', (ww/2)*-1);

// lemmon
// came from http://jquery.lemmonjuice.com/plugins/slider-variable-widths.php and then customized from there
$( '#slider1' ).lemmonSlider({
  'infinite' : true
});

$('.carousel-indicators').on('click','li',function() {
  $(this).addClass('active');
  $(this).siblings().removeClass('active');
});

$(window).resize(function() {
  var ww = $(window).width();
  $('#photostream').width(ww).css('margin-left', (ww/2)*-1);
});

var index;
var total = $('.slider li').not('.-before, .-after').length;
var tbefore = $('.slider li').filter('.-before').length;
var tafter = $('.slider li').filter('.-after').length;

console.log(total);
console.log(tbefore);
console.log(tafter);

var $li = $('.slider li').not('.-before, .-after');
index = $li.filter('.active').index();
console.log(index-tbefore);

