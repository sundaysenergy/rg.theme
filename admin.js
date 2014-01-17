/*** JS for admin upload page ***/

$(document).ready(function() {
  /* Initialize the dropzones */
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
  $.ajax({ url: 'http://rg.cape.io/items/client_data.json' })
  .done(function(data) {
    var items = _.forEach(data.items, function(item) {
      item.value = item.id + ' ' + item.content;
      item.tokens = _.values(item);
      return item;
    });
    console.log(data.items);
    console.log(items);
    var ta = $('.typeahead').typeahead({
      name: 'rg2',
      local: items,
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
      $('form').each(function(i) {
        $(this).find('input[name=id]').remove();
        $('<input>').attr({
           type: 'hidden',
           name: 'id',
           value: data.value
        }).prependTo($(this));
      });
      $.ajaxSetup({ cache:false });
      $.getJSON('http://rg.cape.io/items/' + data.value + '/info.json', function(result) {
        $('.fileinfo').empty().html(result.descript_1 + ' ' + result.country);
        var url = result.img.normal["320"],
            url_far = result.img.far["320"];
        if ($('fileinfo .img-regular').length == 0) {
          $("<img />").attr({ 'src' : url, "class" : "img-responsive img-regular" }).appendTo('.fileinfo');
        }
        if ($('fileinfo .img-far').length == 0) {
          $("<img />").attr({ 'src' : url_far, "class" : "img-responsive img-far" }).appendTo('.fileinfo');
        }
      });
      $.ajaxSetup({ cache:true });
    })
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
        $.ajaxSetup({ cache:false });
        $.getJSON('http://rg.cape.io/items/' + itemid + '/info.json', function(result) {
          $('.fileinfo').empty().html(result.descript_1 + ' ' + result.country);
          var url = result.img.normal["320"],
              url_far = result.img.far["320"];
          if ($('.fileinfo img.img-regular').length == 0) {
            $("<img />").attr({ 'src' : url, "class" : "img-responsive img-regular" }).appendTo('.fileinfo');
          }
          if ($('.fileinfo img.img-far').length == 0) {
            $("<img />").attr({ 'src' : url_far, "class" : "img-responsive img-far" }).appendTo('.fileinfo');
          }
        });
        $.ajaxSetup({ cache:true });
      }
    });
    if (window.location.hash) {
      $('.typeahead').typeahead('setQuery', window.location.hash.replace('#',''));
      $('.typeahead').focus();
    }
  });
});
