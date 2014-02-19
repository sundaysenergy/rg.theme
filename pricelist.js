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
      var doc = new jsPDF();
      var pos = 50;
      var items = textiles.matchingItems;
      var logo = 'data:image/jpeg;base64,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';
      doc.setFontSize(10);
      doc.setFont("times");
      doc.setFontType("bold");
      doc.addImage(logo,'JPEG',70,20,68,10);
      doc.line(20, 43, 200, 43);
      doc.text(20, 40, "ID");
      doc.text(45, 40, "Name");
      doc.text(110, 40, "Color");
      doc.text(145, 40, "Price");
      doc.setFontType("normal");
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
