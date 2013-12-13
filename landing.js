$(document).ready(function() {
  $.getJSON('http://rg.cape.io/beautyshots/index.json', function(data) {
    $.when(_.forEach(data, function(slide) {
      $('.carousel-inner').append('<div class="item"><img style="width:100%" src="' + slide.img + '"></div>');
    })).then(function() {
      $('.carousel-inner').css('height', '500px');
      $('.carousel-inner .item:nth-of-type(1)').addClass('active');
      $('.carousel').carousel();
    });
  });
});