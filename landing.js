$(document).ready(function() {
  var item_template;
  $.ajax({
    url: "http://rg.cape.io/templates/landing.html",
    context: document.body,
    async: false,
    error:  function (jqXHR, textStatus, errorThrown) {
              console.log(errorThrown);
            }
  }).done(function(data) {
    item_template = Hogan.compile(data);
  });
  $.getJSON('http://rg.cape.io/beautyshots/index.json', function(data) {
    _.forEach(data, function(item) {
      item.pos = function() {
        return _.findIndex(data, {img:item.img});  
      }
    });
    $.when($('.carousel').append(item_template.render({slides:data}))).then(function() {
      $('.carousel-inner').css('height', '500px');
      $('.carousel-inner .item:nth-of-type(1)').addClass('active');
      $('.carousel-indicators li:nth-of-type(1)').addClass('active');
      $('.carousel').carousel();
    });
  });
});