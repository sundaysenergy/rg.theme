/* JS for the landing page */

$(document).ready(function() {
  // Retrieve the template for the carousel and compile
  var item_template;
  $.ajax({
    url: rg_options.api + "/templates/mini/landing.html",
    context: document.body,
    async: false,
    error:  function (jqXHR, textStatus, errorThrown) {
              console.log(errorThrown);
            }
  }).done(function(data) {
    item_template = Hogan.compile(data);
  });

  var item_template_mobile;
  $.ajax({
    url: rg_options.api + "/templates/mini/landing_mobile.html",
    context: document.body,
    async: false,
    error:  function (jqXHR, textStatus, errorThrown) {
              console.log(errorThrown);
            }
  }).done(function(data) {
    item_template_mobile = Hogan.compile(data);
  });

  function loadBeautyMobile(item_template) {
    // Retrieve the JSON that we will use to generate the slideshow
    $.getJSON(rg_options.api + '/beautyshots/index.json', function(data) {
      _.forEach(data, function(item) {
        item.pos = function() {
          return _.findIndex(data, {img:item.img});  
        }
      });
      // Set the active attribute true for a random item
      data[_.random(0,data.length-1)].active = true;
      // Add the html to the document
      $.when($('.carousel').html(item_template_mobile.render({slides:data}))).then(function() {
        // Start the carousel
        $('.carousel').carousel();
      });
    });
    return true;
  }

  // Function for loading the template into the document
  function loadBeauty(item_template) {
    // Retrieve the JSON that we will use to generate the slideshow
    $.getJSON(rg_options.api + '/beautyshots/index.json', function(data) {
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
          item.items[i-1].bottomc = $(window).height();
          item.items[i-1].margin = (((section-150) / 2) > 0) ? ((section-150) / 2):0;
        }
      });
      // Set the active attribute true for a random item
      data[_.random(0,data.length-1)].active = true;
      // Add the html to the document
      $.when($('.carousel').html(item_template.render({slides:data}))).then(function() {

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

        $('.landing-popover').each(function(i, item) {
          $(this).off('click touch').on('click touch', function(e) {
            var item = $(this).attr('class').split(' ')[1];
            window.location.href = '/collection.html#detailedview='+item.replace('popover-','');
          });
        });
      });
    });
    return true;
  }
  // When we resize, regenerate everything since the coordinates will be different
  $(window).on('resize', function() {
    // Initial load
    if ($(window).width() > 767) {
      loadBeauty(item_template);
    } else {
      loadBeautyMobile(item_template_mobile);
    }  
  });
  // Initial load
  if ($(window).width() > 767) {
    loadBeauty(item_template);
  } else {
    loadBeautyMobile(item_template_mobile);
  }
});

$(document).ready(function() {
  if ($('header').width() >= 768 ){
    $('.navwrap').removeClass( "collapse navbar-collapse" )
  }
});

$(window).resize(function(){     
  if ($('header').width() >= 768 ){
    $('.navwrap').removeClass( "collapse navbar-collapse" )
  }
});
