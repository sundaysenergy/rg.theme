/*** JS for admin upload page ***/

$(document).ready(function() {
  /* Initialize the dropzones */
  var image_host = 'http://02d1247353ac267cd867-724dd3ec3ecad6ced51d604f25311902.r22.cf2.rackcdn.com.img.labori.us/300x300/';
  var dz_closeup = $('.closeup form').dropzone({ 
                                url: "http://h2.cape.io/upload", 
                                maxFiles: 1, 
                                acceptedFiles: 'image/jpeg'
                              });
  var dz_faraway = $('.faraway form').dropzone({ 
                                url: "http://h2.cape.io/upload", 
                                maxFiles: 1, 
                                acceptedFiles: 'image/jpeg' 
                              });   
  /* Typeahead.js for autocompleting products */
  var ta = $('.typeahead').typeahead({
    name: 'rg2',
    prefetch: 'http://rg.cape.io/items/index.json',
    template: [
      '<h3>{{value}}</h3>',
      '<p>{{tokens}}</p>'
    ].join(''),
    engine: Hogan
  })
  /* Add event handler for autocompletion and explicit selection */
  .on('typeahead:selected typeahead:autocompleted', function(e, data) {
    /* Show file inputs and retrieve json for specific item */
    $('.closeup, .faraway').show();


    /***** Failed attempt to post directly to cloudfiles *****/
    // $.getJSON('http://cf.webscript.io/token', function(data) {
      // $('form').each(function(i) {
      //   $(this).attr('action', data.url);
      // });
      // for(var k in data) {
      //   $('<input>').attr({
      //       type: 'hidden',
      //       name: k,
      //       value: data[k]
      //   }).prependTo('.closeup form');
      // }
      // for(var k in data) {
      //   $('<input>').attr({
      //       type: 'hidden',
      //       name: k,
      //       value: data[k]
      //   }).prependTo('.faraway form');
      // }
    // });
    /***** End failed attempt *****/


    $('form').each(function(i) {
      $(this).find('input[name=id]').remove();
      $('<input>').attr({
         type: 'hidden',
         name: 'id',
         value: data.value
      }).prependTo($(this));
    });
    $.getJSON('http://rg.cape.io/items/' + data.value + '/info.json', function(result) {
      $('.fileinfo').empty().html(result.descript_1 + ' ' + result.country);
      var url = result.img.normal.320,
          url_far = result.img.far.320;
      $("<img />").attr({ 'src' : url, "class" : "img-responsive" }).appendTo('.fileinfo');
      $("<img />").attr({ 'src' : url_far, "class" : "img-responsive" }).appendTo('.fileinfo');
    });
  });
  /* Capture enter since typeahead doesn't natively do anything with it.
     We are grabbing the first item in the list and setting the query. */
  .on('keyup', function(e) {
    if(e.which == 13) {
      var itemid = $('.tt-suggestion h3').html();
      /* Set the query and blur() to hide the suggestion box */
      $('.typeahead').typeahead('setQuery', itemid);
      $('.typeahead').blur();
      /* Show file inputs and retrieve json for specific item */
      $('.closeup, .faraway').show();
      $('form').each(function(i) {
        $(this).find('input[name=id]').remove();
        $('<input>').attr({
           type: 'hidden',
           name: 'id',
           value: itemid
        }).prependTo($(this));
      });
      $.getJSON('http://rg.cape.io/items/' + itemid + '.json', function(result) {
        $('.fileinfo').empty().html(result.descript_1 + ' ' + result.country);
        var url = image_host + itemid + ".jpg",
            url_far = image_host + itemid + "_far.jpg";
        console.log(url, url_far);
        $.getJSON('http://rg.webscript.io/exists', { 'itemid': itemid }, function(data) {
          if (data.near == 200) { $("<img />").attr({ 'src' : url, "class" : "img-responsive" }).appendTo('.fileinfo'); }
          if (data.far == 200) { $("<img />").attr({ 'src' : url_far, "class" : "img-responsive" }).appendTo('.fileinfo'); }
        });
      });
    }
  });
  if (window.location.hash) {
    $('.typeahead').typeahead('setQuery', window.location.hash.replace('#',''));
    $('.typeahead').focus();
  }
});