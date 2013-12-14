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
  $(window).on('resize', function() {
    $.getJSON('http://rg.cape.io/beautyshots/index.json', function(data) {
      var section = parseInt($(window).width()/5);
      _.forEach(data, function(item) {
        item.pos = function() {
          return _.findIndex(data, {img:item.img});  
        }
        for (var i=1;i<=5;i++) {
          item.items[i-1].leftc = section * (parseInt(i)-1);
          item.items[i-1].rightc = (section * (parseInt(i)))-1;
        }
      });
      $.when($('.carousel').html(item_template.render({slides:data}))).then(function() {
        $('.carousel-inner').css('height', '500px');
        $('.carousel-inner .item:nth-of-type(1)').addClass('active');
        $('.carousel-indicators li:nth-of-type(1)').addClass('active');
        $('.carousel').carousel();
        $("area").hover(function() {
            // var altText = $(this).data("id");
            // $('.item-hover').html("Hovering " + altText);
        }, function() {
            // $('.item-hover').html();
        });
        // .click(function() {
        //   var itemid = $(this).data("id");
        //   window.location = '/collection.html#detailedview=' + itemid;
        // });
      });
    });
  });
  $(window).trigger('resize');
});