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
      var pos = 26;
      var items = textiles.matchingItems;
      var logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAVQAAAA5CAMAAABeUSO3AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADBQTFRFIx8g9PPwWVZWxsTCkpCP7u3qTEhJ09LPMS0uPjs74d/dgoB/r62rdXJxZ2Rk/Pv4CyjIUwAAABB0Uk5T////////////////////AOAjXRkAAASkSURBVHja7JiLjtwqDEC95v2c///bmgQMIZnu7FWvVKn2SttCFmwfGwzAl8gfF3iJ/HERqAJVoApUEYEqUAWqiEAVqAJVRKAKVIEqIlAFqkAVEagCVaCKCNS/E6pR8d7lXq+696b3czhlXmXvpL4nidSf1T76LulD9U7t35T6KSnHE0T9Q6gZvbUYfHUTnw5FF18Wr4xGRA849GCAqgsA9I5qbUAEq3mM9vQ14GYndd4NjKXS2GDV0mOTxpCZnaWpEw22i/pECs6gGbT0w2mgCiINCAvRarUOyAqsPcxw5BTm+WcaCcVESfPbZtmwOR1OhnXE20xFIGUEaFA11rf/OrBMyJwT6UkkQ+MV8zBBtbazMChqCpLTfoNqfVbW3cLacEQL7LPy2FQX4EQ30Oz+ynVVt6hfLHulIxuUn57mYyJjgXGQu4e27Dc6Kx50J5yY9NAKhy5rPoNKvzW3czeUkdj+TbPpqn8sl7Zio86vboN66tAhXrLX9FiO3uh7V5gU+sTljfoFqu46jZ9M7Ui9OOc7Mkfhe6hKDzhj+Z+hpYjUD6GyWQo8p78bVg0AN6hbm43qWLa1Xo7MSrDub8hgFKdRGajCYwrd1U+oXz5f4rrGps7Upw2g5dvvoL4MwxmxOO2ZYL6Dyp4mttcPS5FVq80rBnG2DY8NQd9Lgw7QlpQKi02RcTiz61UztU5vOai7+gk1c8TGv44ZLEFC448Nq/4G6oTDn7FHSX8PNVOCzwBzcvOO0OdyblZvBVZlXf0C1byURcNeNqnmmk6AOpkE65kgdyV03IhueKYYh2JvldIpTKhNffF3qD05DBnq4rITnrrYe2yTp9tS+gwqfgLVUn0zs1luUM8NIVOmlQWqooo6oQYPaw1qtRqui/QIsAvXHUmfBwhDZ4lR7Rll3KBqXKGu6vVeEZxG6NX+DdTWyv8j1BxgHurKffnz+pkqHpa/Xrea3JKFgnC1mCISvLaX2j+W5Nwm4e3yV98v/2VD1nu+r8v/SGpw/wmq/QSqUjMlZjhnsbQjuW5QzbrHIkxcp3YTdosVFd1L+jroZWRCrZOL3bw1b9Sve2q3enZxclTOHQOnO/4ZanwHNfRDQPykUCXwZi+Wmk3Iw/Eb1NeaOsbPCPalfOFXaRaVts7mWbxCVUdKH5aoH1d/MuI8Rk7zR4LGrukYf8Ycnqt/fYbaj1Qa0kdHKrPsdM7fDv/l3HSzTfFy+DcZVy/z3ACo3GVHpeV6n7JflATpmh3RQ6s3Jtl51ISj4Ol5TDUfQ21GtBNvxLoc9Y/URy7GNN6cFj1BjRqfoZ67c4by/TWVjEjtAslLIRaf6FK4+t4unbhcQmsAf1zgcFxTqa0afDuOVDAvsUwVaWLc76mGRtFk6zLLNlBVssxAUyldb4eH+rmBR2oHvqY6sivYEi9nOaSqNm/itNnbenp/CQ2NbLdxjhjd4cGWixXJ1k+uqePRwF0eJNzticI9DdsI5dy511d8esKIz7Oo2+uJUfcnnY/F3FVH9fyU86wkydOfvKcKVBGBKlAFqohAFagCVUSgClSBKiJQBapAFRGoAlWgClQRgSpQ/z35JcAATi4lQrPB5LcAAAAASUVORK5CYII=';
      doc.setFontSize(10);
      doc.addImage(logo,'PNG',20,20,340,57);
      doc.text(20, 20, "ID");
      doc.text(45, 20, "Name");
      doc.text(110, 20, "Color");
      doc.text(145, 20, "Price");
      _.forEach(items, function(item) {
        var values = item.values();
        var id    = (_.isUndefined(values['id'])) ? '':values['id'],
            name  = (_.isUndefined(values['name'])) ? '':values['name'],
            color = (_.isUndefined(values['color'])) ? '':values['color'],
            price = (_.isUndefined(item_prices[id])) ? 'Not available':parseInt(item_prices[id]).toFixed(2);
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
          doc.text(20, 20, "ID");
          doc.text(45, 20, "Name");
          doc.text(110, 20, "Color");
          doc.text(145, 20, "Price");
          _.forEach(items, function(item) {
            var values = item.values();
            var id    = (_.isUndefined(values['id'])) ? '':values['id'],
                name  = (_.isUndefined(values['name'])) ? '':values['name'],
                color = (_.isUndefined(values['color'])) ? '':values['color'],
                price = (_.isUndefined(item_prices[id])) ? 'Not available':parseInt(item_prices[id]).toFixed(2);
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
