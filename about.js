
// commenting to see if this works
var ww = $(window).width();
$('#photostream').width(ww).css('margin-left', (ww/2)*-1);

// lemmon
// came from http://jquery.lemmonjuice.com/plugins/slider-variable-widths.php and then customized from there
$( '#slider1' ).lemmonSlider({
  'infinite' : true
});

$(window).resize(function() {
  var ww = $(window).width();
  $('#photostream').width(ww).css('margin-left', (ww/2)*-1);
});

$('.carousel-indicators').on('click','li',function() {
  $(this).toggleClass('active');
  $(this).siblings().removeClass('active');
});

var index,
total=$('.slider li').not('.-before, .-after').length;
$('<p class="pagination"></p>').appendTo('#photostream');

var fun = function (e){
  $('.pagination').text('');
  
  var $li = $('.slider li').not('.-before, .-after');
  index = $li.filter('.active').index()-15;
  console.log(index);
  index = (index == -16)?1:index;
  
  $('.pagination').append(index +'/'+ total);
  
}

$('.next-slide, .next-page, .prev-page, .prev-slide').click(fun);
