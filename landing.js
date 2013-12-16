/* JS for the landing page */

$(document).ready(function() {
  // Retrieve the template for the carousel and compile
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
  // Function for loading the template into the document
  function loadBeauty(item_template) {
    // Retrieve the JSON that we will use to generate the slideshow
    $.getJSON('http://rg.cape.io/beautyshots/index.json', function(data) {
      // Split the screen into 5 sections to create our area map
      var section = parseInt($(window).width()/5);
      // Index our slides
      _.forEach(data, function(item) {
        item.pos = function() {
          return _.findIndex(data, {img:item.img});  
        }
        // Add coordinate information to each item
        for (var i=1;i<=5;i++) {
          item.items[i-1].leftc = section * (parseInt(i)-1);
          item.items[i-1].rightc = (section * (parseInt(i)))-1;
        }
      });
      // Set the active attribute true for a random item
      data[_.random(0,data.length-1)].active = true;
      // Add the html to the document
      $.when($('.carousel').html(item_template.render({slides:data}))).then(function() {
        // Set the height of the carousel with JS. Should be made more pro by KB
        $('.carousel-inner').css('height', '500px');
        // Start the carousel
        $('.carousel').carousel();
        // Workaround for the indicators being buggy out of the box
        $('.carousel').on('slid.bs.carousel', function() {
          var to_slide = $('.carousel-inner .item.active').attr('id');
          $('.carousel-indicators').children().removeClass('active');
          $('.carousel-indicators [data-slide-to=' + to_slide.replace('item-','') + ']').addClass('active');
        });
        // When you hover over an area, show information about the item
        $("area").hover(function() {
          var itemid = $(this).data("id");
          $('.popover-'+itemid).show();
        // Hide on mouseout
        }, function() {
          var itemid = $(this).data("id");
          $('.popover-'+itemid).hide();
        });
      });
    });
    return true;
  }
  // When we resize, regenerate everything since the coordinates will be different
  $(window).on('resize', function() {
    loadBeauty(item_template);
  });
  // Initial load
  loadBeauty(item_template);
});