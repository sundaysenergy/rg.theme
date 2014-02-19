/*** JS for pricelist functionality ***/

$(document).ready(function() {
  var item_prices = [];
  var token = $.cookie('token');
  
  // If there is a token, try to get the item prices
  if (_.isUndefined(token) == false) {
    $.ajax({
      url: rg_options.api + '/items/price.json',
      type: 'GET',
      async: false,
      headers: { Authorization: 'bearer '+token },
      contentType: 'application/json',
      success: function(result) {
        item_prices = result;
      }
    });
  }

  var itemPrice = function(itemno) {
    var price = (_.isUndefined(item_prices[itemno])) ? 'Not available':'$'+parseInt(item_prices[itemno]).toFixed(2);
    return price;
  }

  // Retrieve the pricelist json file and get started
  $.getJSON(rg_options.api + '/items/client_data.json', function(data) {
    
    _.forEach(data.items, function(item) {
      item.tradeprice = _.bind(itemPrice, item_prices, item.id);
    });

    var template = Hogan.compile('{{#items}}<tr><td class="name">{{name}}</td><td class="color">{{color}}</td><td class="id">{{id}}</td><td class="content">{{content}}</td><td class="repeat">{{repeat}}</td><td class="width">{{width}}</td><td class="tradeprice">{{tradeprice}}</td></tr>{{/items}}'); 
    $('tbody.list').hide();
    $('tbody.list').html(template.render(data));

    // Define value names and other options
    var options = {
      valueNames: [ 'name', 'color', 'id', 'content', 'repeat', 'width', 'price' ],
      page: 50,
      plugins: [
                  ListFuzzySearch()
               ]
    };
    // Init list
    var textiles = new List('textiles', options, data);
    $('tbody.list').show();
    
    // When the list is updated, we need to rework the pager buttons
    textiles.on('updated', function() {
      $('.previous, .next').removeClass('disabled');
      $('.next').off('click touch').on('click touch', function(e) {
        textiles.show(parseInt(textiles.i)+parseInt(textiles.page), parseInt(textiles.page));
      });
      $('.previous').off('click touch').on('click touch', function(e) {
        textiles.show(parseInt(textiles.i)-parseInt(textiles.page), parseInt(textiles.page));
      });
      // If our position is less than the number of entries per page, assume we are on page #1
      if (parseInt(textiles.i) < parseInt(textiles.page)) {
        $('.previous').addClass('disabled').off('click touch');
      }
      // If our position plus the size of the page is greater than length, we're showing the last entries
      if ((parseInt(textiles.i) + parseInt(textiles.page)) > textiles.matchingItems.length) {
        $('.next').addClass('disabled').off('click touch');
      }
      $('li.pagecount').html((parseInt(textiles.i / textiles.page) + 1))
      .append(' / ')
      .append(parseInt(textiles.matchingItems.length / textiles.page) + 1);
    });

    // Manually update the list to trigger the button mods
    textiles.update();

    // Manually sort the list with our default order -- change this if list.js has this functionality
    textiles.sort('name', { order: "asc" });
    
    // Add font awesome icons for ascending and descending sorts
    $('th').on('click', function() {
      
      // First remove any existing sort indicators
      $('.fa-caret-down, .fa-caret-up').each(function(i) {
        $(this).remove();
      });

      // Then add an icon based on presence of ascending or descending class
      if ($(this).hasClass('desc')) {
        $(this).append(' <i class="fa fa-caret-down"></i>');
      } else {
        $(this).append(' <i class="fa fa-caret-up"></i>');
      }
    });
    $('#pricelist-view-number a').each(function(i) {
      $(this).on('click touch', function(e) {
        e.preventDefault();
        var items = $(this).data('show-items');
        var i = textiles.i;
        textiles.page = items;
        if (textiles.i % items > 0) {
          textiles.i = textiles.i - (textiles.i % items);
        }
        // Set position to the same page that would contain item with new quantity/page
        var newpos = parseInt(textiles.i / items) * items + 1;
        // Set the display value to the current number of items
        $('button .show-items').html(items);
        // Add our position to the hash and update the list
        textiles.update();
      });
    });
    $('button.download-pdf').off('click touch').on('click touch', function(e) {
      e.preventDefault();
      var doc = new jsPDF('landscape');
      var pos = 62;
      var items = textiles.matchingItems;
      var logo = 'data:image/jpeg;base64,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';
      doc.setFontSize(12);
      doc.setFont("times");
      doc.setFontType("bold");
      doc.addImage(logo,'JPEG',70,20,64,15);
      doc.text(95,42,"Pricelist");
      doc.setFontSize(10);
      doc.line(20, 53, 200, 53);
      doc.text(20, 50, "ID");
      doc.text(45, 50, "Name");
      doc.text(110, 50, "Color");
      doc.text(145, 50, "Price");
      doc.setFontType("normal");
      _.forEach(items, function(item) {
        var values = item.values();
        var id    = (_.isUndefined(values['id'])) ? '':values['id'],
            name  = (_.isUndefined(values['name'])) ? '':values['name'].charAt(0) + values['name'].slice(1).toLowerCase(),
            color = (_.isUndefined(values['color'])) ? '':values['color'].charAt(0) + values['color'].slice(1).toLowerCase(),
            price = (_.isUndefined(item_prices[id])) ? 'Not available':'$'+parseInt(item_prices[id]).toFixed(2);
        doc.text(20, pos, id);
        doc.text(45, pos, name);
        doc.text(110, pos, color);
        doc.text(145, pos, price);
        pos = pos + 6;
        if (pos == 290) {
          pos = 20;
          doc.addPage();
        }
      });
      doc.save('RG-pricelist.pdf');
    });
    $('button.download-pdf-flash').off('click touch').on('click touch', function(e) {
      $(this).hide();
      var items = textiles.matchingItems;
      Downloadify.create('downloadify',{
        filename: 'RG-pricelist.pdf',
        data: function(){ 
          var doc = new jsPDF();
          var pos = 26;
          doc.setFontSize(10);
          doc.setFont("times");
          doc.setFontType("bold");
          doc.text(20, 20, "ID");
          doc.text(45, 20, "Name");
          doc.text(110, 20, "Color");
          doc.text(145, 20, "Price");
          doc.setFontType("normal");
          doc.line(20, 23, 200, 43);
          _.forEach(items, function(item) {
            var values = item.values();
            var id    = (_.isUndefined(values['id'])) ? '':values['id'],
                name  = (_.isUndefined(values['name'])) ? '':values['name'],
                color = (_.isUndefined(values['color'])) ? '':values['color'],
                price = (_.isUndefined(item_prices[id])) ? 'Not available':'$'+parseInt(item_prices[id]).toFixed(2);
            doc.text(20, pos, id);
            doc.text(45, pos, name);
            doc.text(110, pos, color);
            doc.text(145, pos, price);
            pos = pos + 6;
            if (pos == 290) {
              pos = 20;
              doc.addPage();
            }
          });
          return doc.output();
        },
        onComplete: function(){ alert('Your File Has Been Saved!'); },
        onCancel: function(){ alert('You have cancelled the saving of this file.'); },
        onError: function(){ alert('You must put something in the File Contents or there will be nothing to save!'); },
        swf: 'http://theme.rg.cape.io/76fc06157d3d760e578939a670254f26e3329e86/img/downloadify.swf',
        downloadImage: 'http://theme.rg.cape.io/76fc06157d3d760e578939a670254f26e3329e86/img/download.png',
        width: 100,
        height: 30,
        transparent: true,
        append: false
      });
    });
  });
});
