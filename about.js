
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

var $li = $('.slider li').not('.-before, .-after');
var n = $li.length;
var o = ($li.filter('.active').index())-n;  

$('.controls').on('click','a.carousel-control',function() {
  $('.carousel-indicators li').removeClass('active').eq(o).addClass('active');
});

console.log(n);
console.log(o);

$('.carousel-indicators li').removeClass('active').eq(o).addClass('active');
