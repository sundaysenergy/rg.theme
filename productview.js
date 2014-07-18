$.support.cors = true;

// var spinwidth = $('.fa-cog').width();
// $('.fa-cog').css('position','fixed').css('left',($(window).width()-spinwidth)/2).css('top',($(window).height()-spinwidth)/2);

$(document).ready(function() {

  /**** DISPLAY & DATA RESETS on page load ****/
  if (_.isUndefined(hash.get('faves')) == false) { localStorage.faves = hash.get('faves'); }
  // Delete session variables since the page has reloaded
  if (_.isUndefined(sessionStorage.detailedview) == false) {
    delete(sessionStorage.detailedview);
  }
  if (_.isUndefined(sessionStorage.currentpage) == false) {
    delete(sessionStorage.currentpage);
  }
  var item_prices = [];
  var token = $.cookie('token');
  var uid = $.cookie('uid');

  $.ajaxSetup({
    dataType: 'json',
    async: false,
    headers: { Authorization: 'bearer '+token },
    contentType: 'application/json'
  });

  // If we have a token, get the pricelist to merge with the item list.
  if (_.isUndefined(token) == false) {
    $.ajax({
      url: rg_options.api + '/_/items/price.json',
      type: 'GET',
      success: function(result) {
        item_prices = result;
      }
    });
  }

  /**** GET THE ITEMS INFORMATION FROM CAPE AND PROCESS IT ****/
  $.getJSON('/items/client_data.json', function(combined) {

    // Compile clientside templates
    var templates = combined.templates;
    var item_template                = Hogan.compile(templates.item),
        item_passementerie           = Hogan.compile(templates.item_passementerie),
        item_mobile_template         = Hogan.compile(templates.item_mobile),
        spotlight_template           = Hogan.compile(templates.spotlight),
        spotlight_pass_template      = Hogan.compile(templates.spotlight_passementerie), //is this in use anymore?
        dummy_template               = Hogan.compile(templates.bookends),
        dummy_template_pass          = Hogan.compile(templates.bookends_passementerie),
        favorites_template           = Hogan.compile(templates.favorites),
        detailed_favorites_template  = Hogan.compile(templates.detailed_faves_alert),
        itemdel_template             = Hogan.compile(templates.itemdel),
        related_template             = Hogan.compile(templates.related_item),
        project_list_select_template = Hogan.compile(templates.project_list_select);

    // Set our options for the main product list
    var options = {
      valueNames: [ 'image', 'content', 'id' ],
      item: '<li><span style="display:none" class="id"></span><img class="img"><div class="add-fave"><button><i class="fa fa-plus-square-o"></i></button></div></li>',
      page: rg_options.horizontal_page,
      i: 0
    };

    if (_.isUndefined(hash.get('collection') == false) && hash.get('collection') == 'passementerie') {
      options.page = rg_options.vertical_page;
    }

    var data = combined.items;
    var colors = combined.colors;

    // Function for calculating related products in different colors
    var findColors = function(itemno) {
      var variations = this[itemno];
      return _.map(variations, function(v) { return itemno + '-' + v; });
    }

    // Function for showing or not showing the pricelist
    var itemPrice = function(itemno) {
      var price = (_.isUndefined(item_prices[itemno])) ? false:'$'+parseInt(item_prices[itemno]).toFixed(2);
      return price;
    }

    // Function for adding favorites
    function addFaves($selector, itemno) {
      // Remove existing list selection
      $('#project-list-select').remove();

      /*** ANONYMOUS FAVORITES ***/
      if (_.isUndefined(uid) || _.isUndefined(token)) {
        // Disable the selector since we only want anon favorites added once
        $selector.off('click touch');
        // Check for undefined, parse the existing favorites, and store the updated string
        if (_.isUndefined(localStorage.faves)) localStorage.faves = '';
        // Create an array with the current selection of favorites
        var current = localStorage.faves.split(',');
        current.push(itemno);
        // Store unique values in localStorage as a comma separated list
        localStorage.faves = _.compact(_.uniq(current)).join(',');
        // Success message and update the share link
        if ($('#anonymous-faves-alert').length == 0 && _.isUndefined(hash.get('detailedview')) && $('#products ul.slider').length > 0) {
          $('ul.slider li:visible:nth-of-type(2)').append(detailed_favorites_template.render({message:'Item added to your favorites!'}));
        } else {
          $('body').append(detailed_favorites_template.render({message:'Item added to your favorites!'}));
        }
        // This should be refined to use a specific class or id
        $('.alert-favorite').find('a').attr('href', $('.alert-favorite').find('a').attr('href') + localStorage.faves);

      /*** PROJECT LISTS ***/
      } else {
        // Get a list of available projects
        $.getJSON(rg_options.api + '/_api/list/_me', {}, function(data) {
          // Add the compiled template to the body
          if ($('#project-list-select').length == 0 && _.isUndefined(hash.get('detailedview')) && $('#products ul.slider').length > 0) {
            $('ul.slider li:visible:nth-of-type(2)').append(project_list_select_template.render({lists:data}));
          } else {
            $('body').append(project_list_select_template.render({lists:data}));
          }
          // Activate editable -- this is used for creating a new list on the fly
          $('#project-list-select .editable').editable({
              type: 'select',
              pk: 1,
              value: '', // Set default to an empty string
              autotext: 'never', // Don't pre-populate the input field
              display: false, // Don't change the displayed value to the form submission
              url: function(params) {
                // Create the new list
                $.ajax({
                  url: rg_options.api + '/_api/list/_me',
                  type: 'POST',
                  data: JSON.stringify({
                    name:params.value,
                    api_id: 'items',
                    entities: []
                  }),
                  success: function (data) {
                    // Add the new list to the select
                    $('<option/>', { value : data._id }).text(params.value).appendTo('#project-trade-list');
                    // Select the recently created list
                    $('#project-trade-list option[value=' + data._id + ']').attr('selected','selected');
                  }
                });
                return;
              }
          });
          // Capture form submission
          $('#project-list-select form').on('submit', function(e) {
            e.preventDefault();
            // Get the list id from the select
            var listid = $('#project-trade-list').val();
            // Update the contents of the list
            $.ajax({
              url: rg_options.api + '/_index/list/' + listid + '/' + itemno,
              type: 'PUT',
              data: JSON.stringify({
                order: 101
              }),
              success: function(result) {
                $('#project-list-select').remove();
                if ($('#anonymous-faves-alert').length == 0 && _.isUndefined(hash.get('detailedview')) && $('#products ul.slider').length > 0) {
                  $('ul.slider li:visible:nth-of-type(2)').append(detailed_favorites_template.render({message:'Item added to your favorites!'}));
                } else {
                  $('body').append(detailed_favorites_template.render({message:'Item added to your favorites!'}));
                }
                $('.alert-favorite').find('a').attr('href','/trade/projects.html');
              },
              fail: function(result) {
                console.log('fail');
                console.log(result);
                //window.location = '/trade/login.html#destination=' + encodeURIComponent(window.location.href);
              },
              error: function(result) {
                console.log('error');
                console.log(result);
                //window.location = '/trade/login.html#destination=' + encodeURIComponent(window.location.href);
              }
            });
          });
        });
      }
    } // end addFaves()


    /*** Loop through items in list and bind additional functions needed for mustache templates ***/
    _.forEach(data, function(item) {
      // Remove the last part of the product number, which designates variation of a themed item
      var i = item.id.split("-");
      i.pop();
      // Generate an associated list of color options that include the original item number
      item.itemcolors = _.bind(findColors, colors, i.join("-"));
      // Get the price of an item if logged in
      item.tradeprice = _.bind(itemPrice, item_prices, item.id);
      // We need to generate links for our thumbnails that do not include detailedview twice
      item.linkitem = function () {
                        var returnhash = '';
                        _.forEach(_.keys(hash.get()), function(k) {
                          if (k != 'detailedview') returnhash = returnhash + k + '=' + hash.get(k) + '&';
                        });
                        return returnhash;
                      };
      item.content = (item.content) ? (item.content.charAt(0) + item.content.slice(1).toLowerCase()):'';
      item.contents = (item.contents) ? (item.contents.charAt(0) + item.contents.slice(1).toLowerCase()):'';
      item.name = (item.name) ? (item.name.charAt(0) + item.name.slice(1).toLowerCase()):'';
      item.color = (item.color) ? (item.color.charAt(0) + item.color.slice(1).toLowerCase()):'';
      // these last 4 item things are what need my roman numeral js magic added to them,
      // capitalize only the roman numerals, and leave everything else the way it is working
      // i am ignorant as to how however... http://www.ookb.co/rg-romannums.html
    }); // end forEach()

    /*** CREATE A NEW PRODUCT LIST ***/
    var productlist = new List('products', options, data);

    // Set defaults for horizontal mode including position and slider class
    $('#products > ul.list').addClass('slider');
    if (_.isUndefined(hash.get('pos'))) hash.add({pos:0});

    /**** VISUAL RESETS AND RE-ARRANGE ****/
    $(window).on('visRearrange', function() {
      var collection = hash.get('collection');
      var srch       = hash.get('search');

      $('[id^=collection-menu]').hide();
      $('#collection-row-loading').hide();
      $('#products ul.list').removeClass('passementerie search-layout clearfix');
      $('ul.list li:visible .img,ul.list li:visible').attr('style','');
      $('li.collection-category a').on('click', function() {
        $('ul.list li:visible .img,ul.list li:visible').attr('style','');
      });

      $('a.collapse-collection').on('click touch', function(e) {
        e.preventDefault();
        $('[id^=collection-menu],#products,#collection-pager-bottom').hide();
        $('#collection-headers-after').css('border','0');
        $('div.threeup').css('padding-bottom','0');
        $('#collection-menu-main-inactive,#collection-menu-leather-inactive,#collection-menu-passementerie-inactive').show();
        return false;
      });
      $('#collection-headers-after').removeClass('border-top');

      // Things to do if there is a collection present -- mostly moving things around visually
      if (_.isUndefined(collection) == false && _.isUndefined(srch)) {
        /*** TEXTILE COLLECTION ***/
        if (collection == 'textile') {
          $('#collection-headers-after').css('border-bottom','0').css('border','0');
          $('#collection-headers-after').removeClass('border-top');
          $('#products,#collection-menu-main,#collection-menu-leather-inactive,#collection-menu-passementerie-inactive').show();
          if (productlist.page == rg_options.horizontal_page) {
            $('.collection-view-items').hide();
            $('#collection-pager-bottom').hide();
          } else {
            $('#collection-pager-bottom').insertAfter('#collection-row-textile').show();
          }
          // Move the inactive headers to a different container if they're not there already
          if ($('#collection-headers-after').find('#collection-menu-passementerie-inactive').length == 0) {
            $('#collection-menu-passementerie-inactive').appendTo('#collection-headers-after > div.inactive-headers');
            $('#collection-menu-leather-inactive').insertAfter($('#collection-menu-passementerie-inactive'));
          }
          // Move the #products div after the textile header bar
          $('#products').insertAfter('#collection-menu-main');
        }
        /*** PASSEMENTERIE COLLECTION ***/
        if (collection == 'passementerie') {
          $('#collection-headers-after').css('border-bottom','0').css('border','0');
          $('#collection-headers-after').removeClass('border-top');
          $('.collection-view-items').show();
          $('.collection-view-items a').each(function(i) {
            $(this).on('click touch', function(e) {
              e.preventDefault();
              var items = $(this).data('show-items');
              var i = productlist.i;
              productlist.page = items;
              rg_options.vertical_page = items;
              // Set position to the same page that would contain item with new quantity/page
              var newpos = parseInt(productlist.i / items) * items + 1;
              // Set the display value to the current number of items
              $('button .show-items').html(items);
              // Add our position to the hash and update the list
              hash.add({pos:newpos});
              productlist.update();
            });
          });
          if (productlist.visibleItems.length == rg_options.horizontal_page) {
            productlist.page = rg_options.vertical_page;
            $('#products > ul.list').removeClass('slider');
          }
          $('#products,#collection-menu-passementerie,#collection-menu-leather-inactive,#collection-menu-main-inactive').show();
          $('#collection-pager-bottom').insertAfter('#collection-row-passementerie').show();
          // Move the inactive headers to a different container if they're not there already
          if ($('#collection-headers-after').find('#collection-menu-leather-inactive').length == 0) {
            $('#collection-menu-leather-inactive').appendTo('#collection-headers-after > div.inactive-headers');
          }
          // Move the #products div after the passementerie header bar
          $('#products ul.list').addClass('passementerie');
          // $('#products ul.passementerie li').each(function() {
          //   var $image = $(this).find('.img');
          //   if (_.isUndefined($image.attr('src')) == false) {
          //     $image.attr('src', $image.attr('src').replace('640.jpg','1170.jpg'));
          //   }
          // });
          $('#products').insertAfter('#collection-menu-passementerie');
          $(window).trigger('resizeSlides');
        }
        /*** LEATHER COLLECTION ***/
        if (collection == 'leather') {
          $('#collection-headers-after').css('border-top','0').css('border-bottom','1px solid #262019');
          if (productlist.page == rg_options.horizontal_page) {
            $('.collection-view-items').hide();
            $('#collection-pager-bottom').hide();
          } else {
            $('#collection-pager-bottom').insertAfter('#collection-row-leather').show();
          }
          $('#collection-headers-after').addClass('border-top');
          $('#products,#collection-menu-leather,#collection-menu-main-inactive,#collection-menu-passementerie-inactive').show();
          // Move inactive headers back to original container if necessary
          if ($('#collection-headers-after').find('#collection-menu-passementerie-inactive').length == 1) {
            $('#collection-menu-passementerie-inactive').prependTo('div#collection-row-passementerie');
          }
          if ($('#collection-headers-after').find('#collection-menu-leather-inactive').length == 1) {
            $('#collection-menu-leather-inactive').prependTo('div#collection-row-leather');
          }
          // Move products after the leather header
          $('#products').insertAfter('#collection-menu-leather');
        }
        // If the page size and buttons don't match up, simulate click -- workaround for back button issue with search
        if ($('button.thumbs').is(":visible") && productlist.page == rg_options.vertical_page) {
          $('button.thumbs').trigger('click');
        }
      }

      // Move the product list inside or outside of the main container depending on viewing mode
      if (productlist.page == rg_options.horizontal_page) {
        if ($('div.threeup div#products').length == 0) $('div#products').appendTo('div.threeup');
      } else {
        if ($('div.threeup div#products').length > 0) $('div#products').appendTo('main.container div#collection-row-textile');
      }
    });

    /**** THINGS TO DO WHEN THE HASH CHANGES ****/
    $(window).on('hashchange', function(e) {

      // Create a string that contains parts of the hash that indicates need to refilter
      var current_page = _.map(_.pull(_.keys(hash.get()), 'pos', 'detailedview', 'cpos', 'dpos'), function(key) { return key + '=' + hash.get(key) }).join('&');

      // If there isn't an existing value, create one for string comparison
      if (_.isUndefined(sessionStorage.currentpage)) {
        sessionStorage.currentpage = '';
      }

      /*** GET VALUES FROM HASH ***/
      var collection = hash.get('collection');
      var attributes = (_.isUndefined(hash.get('attributes'))) ? []:hash.get('attributes').split(',');
      var lid        = hash.get('lid');
      var userid     = hash.get('uid');
      var srch       = hash.get('search');
      var faves      = hash.get('faves');
      var color      = hash.get('color');
      var desc       = hash.get('desc');
      var use        = hash.get('use');

      // Reset our filters checkboxes if necessary
      if (_.isUndefined(hash.get('attributes'))) $('.filter-attributes').find(':checkbox').attr('checked',false);
      if (_.isUndefined(hash.get('color'))) $('.filter-color').find(':checkbox').attr('checked',false);
      if (_.isUndefined(hash.get('desc'))) $('.filter-description').find(':checkbox').attr('checked',false);
      if (_.isUndefined(hash.get('use'))) $('.filter-use').find(':checkbox').attr('checked',false);

      // Other resets
      $('#anonymous-faves-alert').find('button.close').trigger('click');
      $('#project-list-select').find('button.close').trigger('click');
      $(window).trigger('visRearrange');

      // Copy faves from the hash to localStorage for sharing and updates via the url
      if (_.isUndefined(hash.get('faves')) == false) {
        localStorage.faves = hash.get('faves');
      } else {
        $('#products > ul.list').removeClass('anon-favorites');
      }

      // Remove stray null value if present in local storage
      if (_.isNull(localStorage.faves)) delete(localStorage.faves);

      // Force vertical view for favorites and search
      if (productlist.page == rg_options.horizontal_page && (_.isUndefined(hash.get('faves')) == false || _.isUndefined(hash.get('search')) == false || _.isUndefined(lid) == false)) {
        productlist.page = rg_options.vertical_page;
        var pos = 1;
        $('#products > ul.list').removeClass('slider');
        productlist.update();
      }
      // If no detailed view is present, make sure we hide the element
      // Creates back button functionality that matches what a user would expect
      if (_.isUndefined(hash.get('detailedview'))) {
        $('.itemoverlay').hide();
        $('html,body').css('overflow','auto').css('height', '');
        if (_.isUndefined(sessionStorage.scrollpos) == false) {
          $('body').animate({ scrollTop: sessionStorage.scrollpos }, 0);
          delete(sessionStorage.scrollpos);
        }
      }

      // Clear any existing filter if our unique string is different
      if (current_page !== sessionStorage.currentpage) {
        productlist.filter();
        // Remove disabled class from color and attribute filters
        $('.filter-attributes label, .filter-color label, .filter-description label, .filter-use label').each(function(i) {
          $(this).removeClass('disabled');
        });
      }

      /*** IF PERFORMING A SEARCH ***/
      if (_.isUndefined(srch) == false) {
        // Show the search header bar and hide the others
        $('#products,#collection-menu-search,#collection-menu-search-collection').show();
        $('#products ul.list').addClass('search-layout clearfix');
        // Switch between search collections
        $("#collection-menu-search-collection button").on('click touch', function(e) {
          e.preventDefault();
          var col = $(this).data('collection');
          hash.add({collection: col });
        });
        $('#collection-menu-search-collection button').removeClass('active');
        $('button[data-collection="'+hash.get('collection')+'"]').addClass('active');
        // View different page sizes of items
        $('#search-view-number a,.search-view-number a').each(function(i) {
          $(this).on('click touch', function(e) {
            e.preventDefault();
            var items = $(this).data('show-items');
            var i = productlist.i;
            productlist.page = items;
            // Set position to the same page that would contain item with new quantity/page
            var newpos = parseInt(productlist.i / items) * items + 1;
            // Set the display value to the current number of items
            $('button .show-items').html(items);
            // Add our position to the hash and update the list
            hash.add({pos:newpos});
            productlist.update();
          });
        });
      // Show&hide header bars for search and default
      } else if (_.isUndefined(faves) == false) {
        $('#products,#collection-menu-faves').show();
      } else if (_.isUndefined(lid) == false) {
        $('#products,#collection-menu-project-list').show();
      } else {
        if (_.isUndefined(collection)) {
          $('#collection-menu-passementerie-inactive,#collection-menu-main-inactive,#collection-menu-leather-inactive').show();
        }
      }

      // If we have a project list, retrieve the items in that list
      var project_items = [];
      if (lid) {
        $('#collection-menu-project-list li:nth-of-type(3) > p').html(hash.get('name'));
        $('#products ul.list').addClass('project-list');
        $.getJSON(rg_options.api + '/_index/list/'+lid+'/index.json',{}, function(data) {
          project_items = _.pluck(data, 'id');
          productlist.sort('id', {
            sortFunction: function(a,b) {
              return _.indexOf(project_items, a.values().id) - _.indexOf(project_items, b.values().id);
            }
          });
        });
      } else {
        $('#products ul.list').removeClass('project-list');
      }

      /*** IF VIEWING ANONYMOUS FAVORITES ***/
      if (_.isUndefined(faves) == false) {
        favorites = hash.get('faves').split(',');
        var longurl = rg_options.api + '/collection.html#faves=' + faves;
        // Get the bit.ly url
        $.getJSON(
          "http://api.bitly.com/v3/shorten?callback=?",
          {
            "format": "json",
            "apiKey": "R_b83cfe54d0ecae82a9086a21fe834814",
            "login": "sundaysenergy",
            "longUrl": longurl
          },
          function(response) {
            // We're just throwing this information in one of the headers for now
            $('.anonymous-share-field input.anon-share')
            .val(response.data.url.replace('bit.ly', 'fav.rogersandgoffigon.com'))
            .on('click', function(e) { $(this).select(); });
          }
        );
      }

      /***********************************/
      /**** PROCESS FILTERS FROM HASH ****/
      /***********************************/
      var vals = [collection,f,srch,faves,color,desc,lid,use];
      var pass_filter = [ 'P-0101-01', 'P-0103-01', 'P-0103-02', 'P-0103-05' ];

      // Only process the filters if our string has changed
      if (current_page !== sessionStorage.currentpage) {
        // Process the filter if there are any terms other than undefined in our hash list
        if (_.some(vals, function(item) { return _.isUndefined(item) == false })) {
          productlist.filter(function(item) {
            // Set our default to false, and explicit define matches
            var match = false;

            if (_.isUndefined(hash.get('collection')) == false && hash.get('collection') == 'passementerie') {
              if (item.values().id.indexOf('P-') > -1) {
                if (_.isUndefined(item.values().img) == false) {
                  if (item.values().img.indexOf('img.cape.io.img.cape.io') > -1) return false;
                }
                if (_.indexOf(pass_filter, item.values().id) > -1) return false;
              }
            }

            /*** PROCESS THE FAVORITES LIST ***/
            if (_.isUndefined(faves) == false) {
              // Always return true/false since we don't need to go to the next step
              if (_.indexOf(favorites, item.values().id) >= 0) {
                return true;
              } else {
                return false;
              }
            }

            /*** PROCESS THE PROJECTS LIST ***/
            if (_.isUndefined(lid) == false) {
              // Always return true/false since we don't need to go to the next step
              if (_.indexOf(project_items, item.values().id) >= 0) {
                return true;
              } else {
                return false;
              }
            }

            /*** PROCESS SEARCH TERMS ***/
            if (_.isUndefined(srch) == false) {
              // This is a combination of all non-function values in the object
              var search_string = _.chain(item.values()).values().compact().filter(function(val) { return _.isFunction(val) == false; }).join(' ').value();
              // Split the search string and sort into two arrays for colors and not colors
              var search_terms = srch.split(' ');
              var color_search_terms = _.remove(search_terms, function(item) {
                                                                var col = _.indexOf(combined.color_words, item.toUpperCase());
                                                                return col >= 0;
                                                              });
              // Go through our non-color terms that will be treated as an OR search
              // If there are items in this list, at least one must match
              // If there are not items in this list, then true/false of colors will determine match
              for (var i=0; i<search_terms.length; i++) {
                var term = search_terms[i].toLowerCase();
                if (search_string.toLowerCase().indexOf(term) >= 0) {
                  // True and break on a match since we only need one from this list
                  match = true;
                  break;
                }
              }
              // Loop through colors. If there are terms here, they MUST be present
              if (match || search_terms.length == 0) {
                for (var i=0; i<color_search_terms.length; i++) {
                  var term = color_search_terms[i].toLowerCase();
                  // If we don't match, return false
                  if (search_string.toLowerCase().indexOf(term) == -1) {
                    return false;
                  // If we do match, set true and proceed to next step
                  } else {
                    match = true;
                  }
                }
              }
              // If we have a false value, then return. If true, proceed to next filter
              // This will allow true match to then be filtered for collection, while false means
              // that non-color search terms were present, but did not match, and there were not
              // any color search terms
              if (!match) return false;
            }

            /*** PROCESS COLLECTION FILTER ***/
            if (typeof(collection) != 'undefined') {
              if (item.values().collection.toLowerCase().indexOf(collection.toLowerCase()) >= 0) {
                match = true;
              } else {
                match = false; // Probably should just return false here?
              }
            }

            /* PROCESS ATTRIBUTES AND COLORS
               If we've either matched the collection, or there is no collection specified, proceed.
               Assumption is that anything else means the collection is specified, but failed to match. */
            if (match || (typeof(collection) == 'undefined')) {
              /*** PROCESS ATTRIBUTES ***/
              if (attributes.length > 0) {
                // For each attribute, see if we have a match. If not, set false and break.
                for (var i = 0; i<attributes.length; i++) {
                  // Search content field for anything other than leather; name field for leather
                  var content_field = (collection != 'leather' || _.isUndefined(collection)) ? item.values().content:item.values().name;
                  if (_.isUndefined(content_field)) content_field = "";
                  if (content_field.toLowerCase().indexOf(attributes[i].toLowerCase()) >= 0) {
                    // Explicitly set true if we have an attribute and it matches
                    match = true;
                  } else {
                    // We want all attributes to match, so return false if one does not
                    return false;
                  }
                }
              }
              /*** PROCESS DESCRIPTION ***/
              if (_.isUndefined(desc) == false) {
                var d = desc.split(',');
                for (var i = 0; i<d.length; i++) {
                  //console.log(d[i]);
                  var desc_field = item.values().design_descriptions || '';
                  //console.log(desc_field);
                  // If the desc field is present and matches
                  if (desc_field.toLowerCase().indexOf(d[i].toLowerCase()) >= 0) {
                    match = true;
                  } else {
                    // If the desc field is present, but does not match, return false.
                    return false;
                  }
                }
              }
              /*** PROCESS USE ***/
              if (_.isUndefined(use) == false) {
                var d = use.split(',');
                for (var i = 0; i<d.length; i++) {
                  var use_field = item.values().use || '';
                  // If the desc field is present and matches
                  if (use_field.toLowerCase().indexOf(d[i].toLowerCase()) >= 0) {
                    match = true;
                  } else {
                    // If the desc field is present, but does not match, return false.
                    return false;
                  }
                }
              }

              /*** PROCESS COLORS ***/
              if (_.isUndefined(color) == false) {
                var color_terms = color.split(',');
                for (var i = 0; i<color_terms.length; i++) {
                  var color_field = item.values().primarycolor || item.values().color || false;
                  // If color search is active, but the primary color is not defined, return false
                  if (!color_field) {
                    return false;
                  }
                  // If the color field is present and matches
                  else if (color_field.toLowerCase().indexOf(color_terms[i].toLowerCase()) >= 0) {
                    match = true;
                  } else {
                    // If the color field is present, but does not match, return false.
                    return false;
                  }
                }
              }
            }
            // If we're still operating, return the value of match
            return match;
          });

          // Trigger a re-filter of the filters
          $(document).trigger('filterFilters');
        } // END PROCESS FILTERS FROM HASH
      }
      sessionStorage.currentpage = current_page;

      /*** DEAL WITH LIST POSITIONING BASED ON HASH ***/
      var pos = hash.get('pos');
      // If position is undefined, start at either 0 or 1, depending on view mode
      if (_.isUndefined(pos)) {
        pos = (productlist.page == rg_options.horizontal_page) ? 0:1;
      } else {
        // If position is less than zero, set it to zero
        // Toggling between view modes can create this effect as we're offsetting each time we switch to the horizontal to center the active item
        if (parseInt(pos) < 0) hash.add({pos:0});
      }
      productlist.show(pos, parseInt(productlist.page));

      // If there are no items that are matching show the no results div
      if (productlist.matchingItems.length == 0) {
        $('div.search-noresults').show();
      } else {
        $('div.search-noresults').hide();
      }

      /**** THINGS TO DO IF WE'RE IN DETAILED VIEW ****/
      if (_.isUndefined(hash.get('detailedview')) == false) {
        // Regenerate the links in the related color slider since we're
        // only reloading the view when we change the item
        $('#related-products ul.list li a').each(function(i) {
          var old_href = $(this).attr('href');
          var new_href = '';
          var n = hash.get('dpos');
          if (_.isUndefined(n)) n = 1;
          // If dpos is present in url, replace it
          if (old_href.match(/dpos=/)) {
            new_href = old_href.replace(/dpos=[0-9]+/, 'dpos='+n);
            $(this).attr('href', new_href);
          // If it's not present, add it
          } else {
            $(this).attr('href', old_href+"&dpos="+n);
          }
        });

        // If the detailedview hash item is not the same as the session item
        if (hash.get('detailedview') != sessionStorage.detailedview && _.isUndefined(hash.get('detailedview')) == false) {
          // Reset the body height and overflow
          $('html,body').css('overflow','hidden').height($(window).height());
          var id = hash.get('detailedview');
          // Get the first item that matches the id...we're assuming there would only
          // ever be one item with a given id
          var item = { item : productlist.get('id', id)[0].values() };

          // Create the image url for the large image
          var ww = $(window).width();
          if ( ww >= 700 ) {
            item.item.img_large = item.item.img.replace('640','1536');
          }
          if ( ww >= 1800 ) {
            item.item.img_large = item.item.img.replace('640','2560');
          }

          item.pager = item.item.itemcolors().length > 5;
          // Show the detailed view mode and render the html from our mustache template
          $(window).on('loadDetailView', function() {

            // If we're in non-mobile mode
            if ($(window).width() > 768) {
              sessionStorage.detailed_view_mobile = false;
              sessionStorage.detailed_view_lastwidth = $(window).width();
              $('.itemoverlay').show().html(item_template.render(item));
              $('#related-products button.close').off('click touch').on('click touch', function(e) {
                $('.itemoverlay #related-products').hide();
                $('.itemoverlay .toggle-colors button').removeClass('active');
              });
              $('.toggle-colors button').on('click touch', function(e) {
                e.preventDefault();
                $(this).toggleClass('active');
                $('.toggle-far button').removeClass('active');
                $('.itemoverlay #related-products').toggle();
                $('.ruler-wrap').show();
                $('.img-large-container').show();
                $('.img-pattern-container').hide();
                $('.toggle-far span.pattern').show();
                $('.toggle-far span.detail').hide();
              });
              // added by KB in prep for multiple image views on some textiles 
              $('.toggle-far button').on('click touch', function(e) {
                e.preventDefault();
                $(this).toggleClass('active');
                $(this).find('span').toggle();
                $('.ruler-wrap').toggle();
                $('.img-large-container').toggle();
                $('.img-pattern-container').toggle();
                $('.toggle-colors button').removeClass('active');
                $('.itemoverlay #related-products').hide();
              });
              // Get the position in the mini slider
              var n = hash.get('dpos');
              if (_.isUndefined(n)) n = 1;
              // Create a list for alternate color options
              var options = {
                valueNames: [ 'related-item' ],
                page: 5,
                i: n
              };
              var relatedlist = new List('related-products', options);
              // Actions to perform when the list is updated -- mostly pagination
              relatedlist.on('updated', function() {
                var current_page = parseInt(relatedlist.i / 5 + 1);
                var total_pages = parseInt(relatedlist.matchingItems.length / 5);
                if (relatedlist.matchingItems.length % 5 > 0) total_pages = parseInt(total_pages) + 1;
                // Resize color box
                var thumbcount = $("#related-products > ul.list-inline").children("li").length;
                $('#related-products').css('width', (160+90*(thumbcount-1))).css('margin-left',-80+(-45*(thumbcount-1)));
                $('#related-products > ul.list-inline').css('width', 90*thumbcount);
                // when or if there is only one page, then it needs a slightly different equation

                $('#related-products .related-page-count').html(current_page + " / " + total_pages);
                $('.rel-previous, .rel-next').removeClass('disabled');
                $('.rel-next').off('click touch').on('click touch', function(e) {
                  // Add to the hash so that if we refresh the page it still has the correct starting position
                  hash.add({dpos:parseInt(relatedlist.i)+5});
                  // Manually update the list with a new start position since we'll ignore
                  // this code if session storage matches the view
                  relatedlist.i = parseInt(relatedlist.i)+5;
                  relatedlist.update();
                });
                // to make the padding for the <> arrows (which don't show on just a single page) go away
                if (total_pages <= 1) {
                  $('#related-products').css('width', (120+90*(thumbcount-1))).css('margin-left',-60+(-45*(thumbcount-1)));
                  $('#related-products .list').css('left', 20);
                }

                $('.rel-previous').off('click touch').on('click touch', function(e) {
                  // Works the same way as the lines above. See comments there.
                  hash.add({dpos:parseInt(relatedlist.i)-5});
                  relatedlist.i = parseInt(relatedlist.i)-5;
                  relatedlist.update();
                });
                if (parseInt(relatedlist.i)-1 == 0) {
                  $('.rel-previous').addClass('disabled').off('click touch');
                }
                if ((parseInt(relatedlist.i) + parseInt(relatedlist.page)) > relatedlist.matchingItems.length) {
                  $('.rel-next').addClass('disabled').off('click touch');
                }
              });
              relatedlist.update();
              $ruler_cm     = $('.rulers img.ruler-cm');
              $ruler_in     = $('.rulers img.ruler-inches');
              //$full_pattern = $('.img-pattern-container > div.full-pattern'); I think these are crashing the overlay when not on a far image
              if ($(window).width() > 1536) {
                $('.rulers img.ruler-cm').attr('src', $ruler_cm.attr('src').replace('1536.png', '2560.png'));
                $('.rulers img.ruler-inches').attr('src', $ruler_in.attr('src').replace('1536.png', '2560.png'));
                //$full_pattern.attr('style', $full_pattern.attr('style').replace('1536', '2560'));
              }
              else {
                $ruler_cm.attr('src', $ruler_cm.attr('src').replace('2560.png', '1536.png'));
                $ruler_in.attr('src', $ruler_in.attr('src').replace('2560.png', '1536.png'));
                //$full_pattern.attr('style', $full_pattern.attr('style').replace('2560', '1536'));
              }

              // Update our rulers
              $("a.ruler-inches").off().on('click touch', function(e) {
                e.preventDefault();
                $(".rulers img.ruler-inches").show();
                $(".rulers img.ruler-cm").hide();
                $(this).parent().addClass("active");
                $(this).parent().next("li").removeClass("active");
                sessionStorage.detailed_view_cm = false;
                return false;
              });

              $("a.ruler-cm").off().on('click touch', function(e) {
                e.preventDefault();
                $(".rulers img.ruler-cm").show();
                $(".rulers img.ruler-inches").hide();
                $(this).parent().addClass("active");
                $(this).parent().prev("li").removeClass("active");
                sessionStorage.detailed_view_cm = true;
                return false;
              });

            } else {
              sessionStorage.detailed_view_mobile = true;
              sessionStorage.detailed_view_lastwidth = $(window).width();
              $('.itemoverlay').show().html(item_mobile_template.render(item));
            }
            // Things to do on closing the detailed view mode
            $('table button.close, li.close > button.close').off('click touch').on('click touch', function(e) {
              $('.itemoverlay').hide(); // Hide the item
              hash.remove('detailedview'); // Remove from the hash
              hash.remove('dpos'); // Remove the position from the hash
              $('html,body').css('overflow','hidden').height($(window).height()); // Reset the body and overflow
              delete(sessionStorage.detailedview); // Remove the session value
              delete(sessionStorage.detailed_view_cm);
            });

            // Add to favorites from detailed view
            $('td.fav button.fav, li.fav button.fav').off().on('click touch', function(e) {
              e.preventDefault();
              addFaves($(this), id);
            });
            
          });

          $(window).trigger('loadDetailView');

          // Trigger a reload of the detailed view
          $(window).resize(function() {
            if (sessionStorage.detailed_view_lastwidth <= 1536 && ($(window).width() > 1536)) {
              $(window).trigger('loadDetailView');
            }
            else if (sessionStorage.detailed_view_lastwidth > 1536 && ($(window).width() <= 1536)) {
              $(window).trigger('loadDetailView');
            }
            if (_.isUndefined(hash.get('detailedview')) == false && ($(window).width() <= 768) != sessionStorage.detailed_view_mobile) {
              $(window).trigger('loadDetailView');
            }
            if (sessionStorage.detailed_view_cm == 'true') {
              $(".rulers img.ruler-cm").show();
              $(".rulers img.ruler-inches").hide();
              $('a.ruler-cm').parent().addClass('active');
              $('a.ruler-inches').parent().removeClass('active');
            } else {
              $(".rulers img.ruler-cm").hide();
              $(".rulers img.ruler-inches").show();
              $('a.ruler-cm').parent().removeClass('active');
              $('a.ruler-inches').parent().addClass('active');
            }
          });
        }
        sessionStorage.detailedview = hash.get('detailedview');
      } else {
        if (_.isUndefined(sessionStorage.scrollpos) == false) {
          $('body').animate({ scrollTop: sessionStorage.scrollpos }, 0);
          delete(sessionStorage.scrollpos);
        }
      }
      return false;
    });

    /*** JAVASCRIPT TWEAKS FOR SETTING IMAGE HEIGHT ***/
    // need this to be more dynamic and forgiving...
    $(window).on('resizeSlides', function() {
      $('ul.list li:visible .img,ul.list li:visible').attr('style','');
      if (_.isUndefined(hash.get('collection')) == false && hash.get('collection') !== 'passementerie') {
        if (rg_options.horizontal_page === productlist.page) {
          var slideWidth  = $('ul.slider > li:nth-of-type(2)').width();
          $('ul.slider > li > img').width(slideWidth-10);
        }
      } else {
        //this was the old passementerie script for their custom 3-up
        //$('ul.passementerie li:visible .img:visible,ul.passementerie li:visible').attr('style','');
        //var maxheight = $('ul.passementerie.slider li:visible:nth-of-type(2)').find('.img').height();
        //console.log(maxheight);
        //$('ul.passementerie.slider li:visible').each(function(index, value) {
          //var $li = $(this);
          //var $img = $li.find('.img');
          //var margin = (($li.height() - $img.height())/2);
          //$img.css('margin-top',margin); /* this is simpler for now with more reliable results, but I am setting the height initially of the ul and li in the css... will eventually need a dynamic solution */
        //});
      }
    });

    /**** THINGS TO DO WHEN THE LIST UPDATES (i.e. position, items, or filters change) ****/
    productlist.on('updated', function() {
      $('ul.anon-favorites li').attr('style','');
      // if (hash.get('collection') == 'passementerie') {
      //   $('#products ul.passementerie li').each(function() {
      //     var $image = $(this).find('.img');
      //     if (_.isUndefined($image.attr('src')) == false) {
      //       $image.attr('src', $image.attr('src').replace('640.jpg','1170.jpg'));
      //     }
      //   });
      // } else {
      //   // This was commented, but it was breaking toggling between passementerie and anything else.
      //   $('#products ul.list li').each(function() {
      //    var $image = $(this).find('.img');
      //     if (_.isUndefined($image.attr('src')) == false) {
      //       $image.attr('src', $image.attr('src').replace('1170.jpg','640.jpg'));
      //     }
      //   });
      // }
      // Update i if we have fewer items than the starting position
      if (productlist.i > productlist.matchingItems.length) {
        productlist.i = productlist.matchingItems.length;
      }
      // Page counter for slide view
      if (productlist.page == rg_options.horizontal_page) {
        $('.pagecount')
        .html(parseInt(productlist.i)+1)
        .append(' / ')
        .append(productlist.matchingItems.length);
        if ($('div.threeup div#products').length == 0) {
          $('div#products').appendTo('div.threeup');
        }
      // Page counter for thumbnail view
      } else {
        $('.pagecount, #search-page-counter')
        .html((parseInt(productlist.i / productlist.page) + 1))
        .append(' / ')
        .append(parseInt(productlist.matchingItems.length / productlist.page) + 1);
        if ($('div.threeup div#products').length > 0) {
          $('div#products').appendTo('main.container div#collection-row-textile');
        }
      }
      // Reset our paginator
      $('.previous, .next').removeClass('disabled');
      $('.next').off('click touch').on('click touch', function(e) {
        hash.remove('cpos');
        var n = parseInt(productlist.page);
        // If we're viewing three at a time, only increment by one item.
        // Otherwise, increment by one page.
        if (n == rg_options.horizontal_page) { n = 1; }
        var p = parseInt(productlist.i)+parseInt(n);
        if (p == productlist.matchingItems.length && n == 1) p = 0;
        hash.add({pos:p});
      });
      $('.previous').off('click touch').on('click touch', function(e) {
        hash.remove('cpos');
        var n = parseInt(productlist.page);
        // If we're viewing three at a time, only increment by one item
        if (n == rg_options.horizontal_page) { n = 1; }
        var p = parseInt(productlist.i)-n;
        if (p == -1) p = productlist.matchingItems.length-1;
        hash.add({pos:p});
      });
      // If our position is less than the number of entries per page, assume we are on page #1
      // Unless we're viewing three at a time -- go to zero then
      if (((parseInt(productlist.i) < parseInt(productlist.page)) &&
          (productlist.page != rg_options.horizontal_page))) {
        $('.previous').addClass('disabled').off('click touch');
      }
      // If our position plus the size of the page is greater than length, we're showing the last entries
      if ((parseInt(productlist.i) + parseInt(productlist.page)) > productlist.matchingItems.length) {
        if (productlist.page != rg_options.horizontal_page) {
          $('.next').addClass('disabled').off('click touch');
        }
      }
      // Add or remove dummy element for first item in slide view.
      var pos = hash.get('pos');
      if (_.isUndefined(pos)) pos = 0;
      if (pos <= 0) {
        if (productlist.matchingItems.length > 0) {
          var last_item = productlist.matchingItems.length-1;
          if (last_item < 0) last_item = 0;
          var template_data = productlist.matchingItems[last_item].values();
          //template_data.img_pass = productlist.matchingItems[last_item].values().img.replace('640.jpg','1170.jpg');
          var dummy_item = '';
          if (_.isUndefined(hash.get('collection')) == false && hash.get('collection') === 'passementerie') {
            dummy_item = dummy_template_pass.render(template_data);
          } else {
            dummy_item = dummy_template.render(template_data);
          }
          $('#products > ul.slider').prepend(dummy_item);
        }
      }
      if (productlist.i == productlist.matchingItems.length-1) {
        $('#products > ul.slider').append(dummy_template.render(productlist.matchingItems[0].values()));
      }
      if ((!((productlist.i == productlist.matchingItems.length-1) || (productlist.i <= 0)) && (productlist.matchingItems.length != 1)) ||
          (productlist.page == rg_options.vertical_page)) {
        $('#products > ul.slider li.item-bookends').remove();
      }

      // Add product details div
      if (productlist.page == rg_options.horizontal_page) {
        // Remove existing item details
        $('ul.list li .item-spotlight').remove();
        // Add the item detail information to the center slide
        var n = 1;
        // If we are on the first slide, our information is in the 0th item
        if (productlist.i == 0) n = 0;
        if (productlist.matchingItems.length == 1) n = 0;
        // Render the template with the correct data
        if (productlist.matchingItems.length > 0) {
          var itemvals = productlist.visibleItems[parseInt(n)].values();
          itemvals.pager = itemvals.itemcolors().length > 5;
          itemvals.repeat = (itemvals.repeat == '') ? false:itemvals.repeat;
          if (hash.get('collection')) {
            if (hash.get('collection') !== 'passementerie') {
              $('#products > ul.slider li:nth-child(2)').append(spotlight_template.render(itemvals));
            } else {
              $('#products > ul.slider li:nth-child(2)').append(spotlight_pass_template.render(itemvals));
            }
          }
          else {
            // Spent an hour trying to figure out why this is required...
            // For some reason this needs to be rendered even when nothing is selected.
            $('#products > ul.slider li:nth-child(2)').append(spotlight_pass_template.render([itemvals[0]]));
          }
          $.fn.editable.defaults.mode = 'inline';
          // Make fields editable
        }
        // For each visible li in the list, create a click handler that toggles visibility
        // and compiles the mustache for the current item.
        $('ul.slider li .img, ul.slider li, ul.list li .img').off('click touch');
        $('ul.slider li .item-spotlight').off('click touch').on('click touch', function(e) {
          if (e.target !== this) {
            return true;
          }
          var id = $(this).parent().find('.id').html();
          sessionStorage.scrollpos = document.body.scrollTop;
          if ((hash.get('collection') == 'passementerie') && ($(window).width() > 767)) {
            // Nothing here yet
          } else {
            hash.add({detailedview:id});
          }
        });
        // Fallback click handler for ie9 since you can't attach to absolute positioned element
        $('ul.slider li .item-spotlight').parent().find('.img').off('click touch').on('click touch', function(e) {
          var id = $(this).parent().find('.id').html();
          sessionStorage.scrollpos = document.body.scrollTop;
          if ((hash.get('collection') == 'passementerie') && ($(window).width() > 767)) {
            // Nothing here yet
          } else {
            hash.add({detailedview:id});
          }
        });

        // Create click handlers for the icon and the close button
        $('.item-spotlight .item-icons button.item-details, .item-spotlight .item-information button.item-toggle').off().on('click touch', function(e) {
          e.preventDefault();
          $(this).toggleClass( 'active' );
          $(this).siblings().removeClass( 'active' );
          $('.item-spotlight .item-information').toggle();
          $('#item-colors').hide();
          $('#project-list-select').hide();
          $('div.alert-dismissable button.close').trigger('click');
        });

        $('.item-spotlight button.item-toggle').click(function() {
          $('.item-spotlight .item-icons').find('button.active').removeClass('active');
        });

        // Handle closing the color list with an X
        $('#item-colors button.close').off('click touch').on('click touch', function(e) {
          $('#item-colors').hide();
          $('.item-spotlight .item-icons .item-colors').removeClass('active');
        });
        // Create click handler for favorite
        $('.item-spotlight .item-icons button.item-favorite').on('click touch', function(e) {
          e.preventDefault();
          var id = $('.list li:nth-child(2)').find('.id').html();
          //$(this).toggleClass( 'active' );
          $(this).siblings().removeClass( 'active' );
          $('.item-information,#item-colors').hide();
          addFaves($(this), id);
        });
        // Handle related colors list
        var n = hash.get('cpos');
        if (_.isUndefined(n)) {
          n = 1;
        } else {
          $('#item-colors').show();
        }
        var options = {
          valueNames: [ 'related-item' ],
          page: 5,
          i: n
        };
        var colorslist = new List('item-colors', options);
        // Click handler for colors
        $('button.item-colors').off().on('click touch', function(e) {
          e.preventDefault();
          $(this).toggleClass( 'active' );
          $(this).siblings().removeClass( 'active' );
          $('#item-colors').toggle();
          $('.item-information').hide();
          $('#project-list-select').hide();
          $('div.alert-dismissable button.close').trigger('click');
        });
        // Actions to perform when the list is updated -- mostly pagination
        colorslist.on('updated', function() {
          var current_page = parseInt(colorslist.i / 5 + 1);
          var total_pages = parseInt(colorslist.matchingItems.length / 5);
          if (colorslist.matchingItems.length % 5 > 0) total_pages = parseInt(total_pages) + 1;
          // Set the width of the color swatch thing
          var ww = $(window).width();
          var thumbcount = $("#item-colors > ul.list-inline").children("li").length;
          if ( ww <= 1100 ){
            $('#item-colors').css('width', (160+60*(thumbcount-1))).css('margin-left',-80+(-30*(thumbcount-1)));
            $('#item-colors > ul.list-inline').css('width', 60*thumbcount);
          } else {
            $('#item-colors').css('width', (160+90*(thumbcount-1))).css('margin-left',-80+(-45*(thumbcount-1)));
            $('#item-colors > ul.list-inline').css('width', 90*thumbcount);
          }
          $('#item-colors .related-page-count').html(current_page + " / " + total_pages);
          // to make the padding for the <> arrows (which don't show on just a single page) go away
          if (total_pages <= 1) {
            $('#item-colors').css('width', (120+90*(thumbcount-1))).css('margin-left',-60+(-45*(thumbcount-1)));
            $('#item-colors .list').css('left', 20);
          }
          $('#item-colors .rel-previous, #item-colors .rel-next').removeClass('disabled');
          $('#item-colors .rel-next').off('click touch').on('click touch', function(e) {
            // Add to the hash so that if we refresh the page it still has the correct starting position
            hash.add({cpos:parseInt(colorslist.i)+5});
            // Manually update the list with a new start position since we'll ignore
            // this code if session storage matches the view
            colorslist.i = parseInt(colorslist.i)+5;
            colorslist.update();
          });
          $('#item-colors .rel-previous').off('click touch').on('click touch', function(e) {
            // Works the same way as the lines above. See comments there.
            hash.add({cpos:parseInt(colorslist.i)-5});
            colorslist.i = parseInt(colorslist.i)-5;
            colorslist.update();
          });
          if (parseInt(colorslist.i)-1 == 0) {
            $('#item-colors .rel-previous').addClass('disabled').off('click touch');
          }
          if ((parseInt(colorslist.i) + parseInt(colorslist.page)) > colorslist.matchingItems.length) {
            $('#item-colors .rel-next').addClass('disabled').off('click touch');
          }
        });
        colorslist.update();

        // Swipe handler for mobile

        $('ul.slider li').each(function(i,obj) {
          $(this).attr('style', '');
        });
        $('ul.slider li:visible').swipe('destroy');
        $("ul.slider li:visible").swipe({
          swipeLeft:function(event, direction, distance, duration, fingerCount) {
            $('ul.slider li:visible').css('z-index',20).animate({ left : "-="+$(window).width()}, {
                duration: 800,
                start: function() {
                  $('ul.slider li:nth-of-type(3)').css('position','absolute').css('z-index',21).css('width','100%').css('max-width','100%').css('left',$(window).width()).show().animate({'left':0}, 800);
                },
                complete: function() {
                  hash.remove('cpos');
                  var p = parseInt(productlist.i)+1;
                  if (p == productlist.matchingItems.length) p = 0;
                  hash.add({pos:p});
                  $('ul.slider li').swipe('destroy');
                }
              }
            );
          },
          swipeRight:function(event, direction, distance, duration, fingerCount) {
            $('ul.slider li:visible').css('z-index',20).animate({ left : "+="+$(window).width()}, {
                duration: 800,
                start: function() {
                  $('ul.slider li:nth-of-type(1)').css('position','absolute').css('z-index',21).css('width','100%').css('max-width','100%').css('left',$(window).width()*-1).show().animate({'left':0}, 800);
                },
                complete: function() {
                  hash.remove('cpos');
                  var p = parseInt(productlist.i)-1;
                  if (p == -1) p = productlist.matchingItems.length-1;
                  hash.add({pos:p});
                  $('ul.slider li').swipe('destroy');
                }
              }
            );
          },
        });

        $(window).trigger('resizeSlides');

        // Click on the left image should decrement by one, while the right image should increment
        $('ul.slider li:nth-of-type(1) .img').off('click touch').on('click touch', function(e) {
          hash.remove('cpos');
          var p = parseInt(productlist.i)-1;
          if (p == -1) p = productlist.matchingItems.length-1;
          hash.add({pos:p});
        });
        $('ul.slider li:nth-of-type(3) .img').off('click touch').on('click touch', function(e) {
          hash.remove('cpos');
          var p = parseInt(productlist.i)+1;
          if (p == productlist.matchingItems.length) p = 0;
          hash.add({pos:p});
        });
      } else {

        // Click handler for detailed view from vertical view
        $('ul.list li .img').off('click touch').on('click touch', function(e) {
          var id = $(this).parent().find('.id').html();
          sessionStorage.scrollpos = document.body.scrollTop;
          if ((hash.get('collection') == 'passementerie') && ($(window).width() > 767)) {
            // Nothing here yet
          } else {
            hash.add({detailedview:id});
          }
        });

        // When hovering over list items, show a plus button!
        $('div.add-fave button,button.item-favorite').off('click touch').on('click touch', function(e) {
          e.preventDefault();
          var id = $(this).parent().siblings('.id').html();
          $('#anonymous-faves-alert').remove();
          addFaves($(this), id);
        });
        // If we're not in 3-up mode, make sure we don't have any stray item details
        if (_.isUndefined(hash.get('faves')) == false) {
          // Hide details for center slide in "horizontal" view
          productlist.page = rg_options.vertical_page;
          $('#products > ul.list').removeClass('slider search-layout clearfix');
          $('#products > ul.list').addClass('anon-favorites');
          $('ul.list li .item-spotlight').remove();

          $('ul.anon-favorites li').each(function(i) {
            $(this).find('.item-favorite-remove').remove();
            $(this).append(itemdel_template.render({}));
            var id = $(this).find('.id').html();
            $(this).find('.item-favorite-remove button').off().on('click touch', function(e) {
              e.preventDefault();
              var f = localStorage.faves.split(',');
              _.remove(f, function(item) {
                if (item == id) return true;
              });
              localStorage.faves = _.compact(_.uniq(f)).join(',');
              if (f.length == 0) {
                window.location = '/collection.html';
              } else {
                hash.add({faves:_.compact(_.uniq(f)).join(',')})
              }
              // alert("Item " + id + " removed from favorites!");
            });

            var $prodlist = $('#products ul.list');
            var anontxt = $('#anon-fav-text');
            var maintxt = $('#main-text');

            var show_favtxt = function() {
              if ($prodlist.hasClass('anon-favorites')) {
                console.log('show favtxt');
                anontxt.show();
                maintxt.hide();
              }
              else {
                console.log('hide favtxt');
                anontxt.hide();
                maintxt.show();
              }
            }

            show_favtxt();

          });
        }
        $('ul.list li .item-spotlight').remove();
        $(window).trigger('resizeSlides');
      }

      $('#products ul.passementerie li').each(function(i,el) {
        var $li = $(this);
        if ($(this).find('.item-icons-passementerie').length == 0) {
          $li.append('<div class="item-icons-passementerie item-icons pull-right"><button class="item-colors plain uppercase"> Colors </button> <button class="item-favorite plain hidden-xs"> <i class="fa fa-plus"></i> </button> <button class="item-details plain"> <i class="fa fa-align-justify"></i></button></div>');
          $li.find('.item-icons-passementerie .item-details').on('click touch', function(e) {
            e.preventDefault();
            $(this).toggleClass( 'active' );
            $(this).siblings().removeClass( 'active' );
            var id = $li.find('.id').html();
            var item_data = productlist.get('id',id)[0].values();
            $('.item-passementerie').remove();
            $li.append(item_passementerie.render(item_data));
            $li.find('.item-toggle').on('click touch', function(e) {
              $('.item-passementerie').remove();
              $('.item-icons').find('.active').removeClass( 'active' );
            });
            // Need to add something where clicking this button again removes the .item-passementerie details table as well
            // https://www.pivotaltracker.com/story/show/73769540
          });
        }
      });
    }); // end productlist.on('updated')

    $('ul.filter-list ul li.clear a').on('click touch', function(e) {
      hash.remove(['attributes', 'color', 'use', 'desc']);
    });

    // When we check or uncheck a box, recalculate search terms
    $('.filter-attributes input[type=checkbox]').on('click touch', function(e) {
      if ($(this).parent().hasClass('disabled')) {
        e.preventDefault();
        return false;
      }
      var f = [];
      $('.filter-attributes :checkbox:checked').each(function(i) {
        f.push($(this).val());
      });
      hash.remove('pos');
      // If we have terms filter, otherwise the filter reset will start us fresh
      if (f.length > 0) {
        hash.add({attributes : f.join(',') });
      } else {
        hash.remove('attributes');
      }
      if (productlist.page == rg_options.horizontal_page) { productlist.i = productlist.i-1; }
    });

    /*
    $('.filter-attributes input[type=checkbox]').on('click touch', function() {
      $('.filter-attributes input[type=checkbox]').each(function() {
        if ($(this).is(':checked')) {
            $(this).parent().addClass('checked');
        } else {
            $(this).parent().removeClass('checked');
        }
      });
    });
    */

    // When we check a color filter, do the same
    $('.filter-color input[type=checkbox]').on('click touch', function(e) {
      // If it's disabled, return false
      if ($(this).parent().hasClass('disabled')) {
        e.preventDefault();
        return false;
      }
      var f = [];
      $('.filter-color :checkbox:checked').each(function(i) {
        f.push($(this).val());
      });
      hash.remove('pos');
      // If we have terms filter, otherwise the filter reset will start us fresh
      if (f.length > 0) {
        hash.add({color : f.join(',') });
      } else {
        hash.remove('color');
      }
      if (productlist.page == rg_options.horizontal_page) { productlist.i = productlist.i-1; }
    });

    // When we check a description filter, do the same
    $('.filter-description input[type=checkbox]').on('click touch', function(e) {
      // If it's disabled, return false
      if ($(this).parent().hasClass('disabled')) {
        e.preventDefault();
        return false;
      }
      var f = [];
      $('.filter-description :checkbox:checked').each(function(i) {
        f.push($(this).val());
      });
      hash.remove('pos');
      // If we have terms filter, otherwise the filter reset will start us fresh
      if (f.length > 0) {
        hash.add({desc : f.join(',') });
      } else {
        hash.remove('desc');
      }
      if (productlist.page == rg_options.horizontal_page) { productlist.i = productlist.i-1; }
    });

    // When we check a description filter, do the same
    $('.filter-use input[type=checkbox]').on('click touch', function(e) {
      // If it's disabled, return false
      if ($(this).parent().hasClass('disabled')) {
        e.preventDefault();
        return false;
      }
      var f = [];
      $('.filter-use :checkbox:checked').each(function(i) {
        f.push($(this).val());
      });
      hash.remove('pos');
      // If we have terms filter, otherwise the filter reset will start us fresh
      if (f.length > 0) {
        hash.add({use : f.join(',') });
      } else {
        hash.remove('use');
      }
      if (productlist.page == rg_options.horizontal_page) { productlist.i = productlist.i-1; }
    });

    // Event for filtering the various lists of filters
    $(document).on('filterFilters', function() {
      // Check unchecked filter buttons for matches. Hide if no matches
      $('.filter-attributes :checkbox:not(:checked)').each(function(i) {
        var a = $(this)[0].value;
        // Determine if any potential matches exist from currently matched items. Breaks on first true
        var m = _.some(productlist.matchingItems, function(item) {
          var contentname = (hash.get('collection') != 'leather' || _.isUndefined(hash.get('collection'))) ? item.values().content:item.values().name;
          if (_.isUndefined(contentname)) contentname = '';
          if (contentname.toLowerCase().indexOf(a.toLowerCase()) >= 0) return true;
        });
        // Hide the parents of any item that does not have a match.
        if (m == false) $(this).parent().addClass('disabled');
      });
      // Do the same thing for color filters
      $('.filter-color :checkbox:not(:checked)').each(function(i) {
        var a = $(this)[0].value;
        // Determine if any potential matches exist from currently matched items. Breaks on first true
        var m = _.some(productlist.matchingItems, function(item) {
          var colorname = item.values().primarycolor || item.values().color || '';
          if (colorname.toLowerCase().indexOf(a.toLowerCase()) >= 0) return true;
        });
        // Hide the parents of any item that does not have a match.
        if (m == false) $(this).parent().addClass('disabled');
      });
      // Do the same thing for description filters
      $('.filter-description :checkbox:not(:checked)').each(function(i) {
        var a = $(this)[0].value;
        // Determine if any potential matches exist from currently matched items. Breaks on first true
        var m = _.some(productlist.matchingItems, function(item) {
          var ddesc = item.values().design_descriptions || '';
          if (ddesc.toLowerCase().indexOf(a.toLowerCase()) >= 0) return true;
        });
        // Hide the parents of any item that does not have a match.
        if (m == false) $(this).parent().addClass('disabled');
      });
      // Do the same thing for use filters
      $('.filter-use :checkbox:not(:checked)').each(function(i) {
        var a = $(this)[0].value;
        // Determine if any potential matches exist from currently matched items. Breaks on first true
        var m = _.some(productlist.matchingItems, function(item) {
          var use = item.values().use || '';
          if (use.toLowerCase().indexOf(a.toLowerCase()) >= 0) return true;
        });
        // Hide the parents of any item that does not have a match.
        if (m == false) $(this).parent().addClass('disabled');
      });
    });

    // Process the hash if we're just loading the page and have values
    if (window.location.hash.length > 0) {
      var g = hash.get('attributes');
      if (typeof(g) != 'undefined') {
        var f = g.split(',');
        // Toggle checkboxes for any attributes that are found.
        for (var i=0; i<f.length; i++) {
          $('.filter-attributes').find(':checkbox[value="' + f[i] +'"]').attr('checked',true);
        }
      }
      var h = hash.get('color');
      if (typeof(h) != 'undefined') {
        var f = h.split(',');
        // Toggle checkboxes for any attributes that are found.
        for (var i=0; i<f.length; i++) {
          $('.filter-color').find(':checkbox[value="' + f[i] +'"]').attr('checked',true);
        }
      }
      var e = hash.get('desc');
      if (typeof(e) != 'undefined') {
        var f = e.split(',');
        // Toggle checkboxes for any attributes that are found.
        for (var i=0; i<f.length; i++) {
          $('.filter-description').find(':checkbox[value="' + f[i] +'"]').attr('checked',true);
        }
      }
      var u = hash.get('desc');
      if (typeof(u) != 'undefined') {
        var f = u.split(',');
        // Toggle checkboxes for any attributes that are found.
        for (var i=0; i<f.length; i++) {
          $('.filter-use').find(':checkbox[value="' + f[i] +'"]').attr('checked',true);
        }
      }
      // Trigger a hashchange event to actually process the filter
      $(window).trigger('hashchange');
    }

    // Toggle to slide view mode
    $('button.slide').on('click touch', function(e) {
      e.preventDefault();
      productlist.page = rg_options.horizontal_page;
      var pos = parseInt(productlist.i)-1;
      // If it's the first item, simulate centering
      $('#products > ul.list').addClass('slider');
      // Only allow one button to be enabled at a time
      $('.slide').toggle();
      $('.thumbs').toggle();
      $('.collection-view-items').hide();
      hash.add({pos:pos});
      $(window).trigger('visRearrange');
    });

    // Toggle to thumb view mode
    $('button.thumbs').on('click touch', function(e) {
      e.preventDefault();
      // Hide details for center slide in "horizontal" view
      productlist.page = rg_options.vertical_page;
      productlist.update();
      var pos = 0;
      // If we have fewer visible items than page size and matching != visible (one page with only a few items)
      if ((productlist.visibleItems.length < productlist.page) &&
          (productlist.visibleItems.length != productlist.matchingItems.length)) {
        var remainder = productlist.matchingItems.length;
        var pagesize = productlist.page;
        // Calculate the remainder -- switch to math based method below sometime.
        while (remainder > pagesize) { remainder = remainder - pagesize; }
        pos = parseInt(productlist.matchingItems.length-remainder+1);
      }  else {
        // Calculate the nearest multiple of per page by casting as an integer without going over. Like The Price is Right.
        pos = parseInt(productlist.i / rg_options.vertical_page) * rg_options.vertical_page + 1;
      }
      $('#products > ul.list').removeClass('slider');
      $('.slide').toggle();
      $('.thumbs').toggle();
      $('.collection-view-items').show();
      $('.collection-view-items a').each(function(i) {
        $(this).on('click touch', function(e) {
          e.preventDefault();
          var items = $(this).data('show-items');
          var i = productlist.i;
          productlist.page = items;
          rg_options.vertical_page = items;
          // Set position to the same page that would contain item with new quantity/page
          var newpos = parseInt(productlist.i / items) * items + 1;
          // Set the display value to the current number of items
          $('button .show-items').html(items);
          // Add our position to the hash and update the list
          hash.add({pos:newpos});
          productlist.update();
        });
      });
      $('ul.list li .item-spotlight').remove();
      hash.add({pos:pos});
      productlist.update();
      $(window).trigger('visRearrange');
    });

    // Keep the dropdown menu from closing after an option is selected
    $('#collection-menu-main .dropdown-menu input, #collection-menu-main .dropdown-menu label, #collection-menu-passementerie .dropdown-menu input, #collection-menu-passementerie .dropdown-menu label, #collection-menu-leather .dropdown-menu input, #collection-menu-leather .dropdown-menu label').click(function(e) {
      e.stopPropagation();
    });

    $('ul.nav-tabs li a').on('click touch touchstart', function(e) {
      e.preventDefault();
      $(this).tab('show');
      return false;
    });

    $('.dropdown-toggle').click(function(e) {
      e.preventDefault();
      setTimeout($.proxy(function() {
        if ('ontouchstart' in document.documentElement) {
          $(this).siblings('.dropdown-backdrop').off().remove();
        }
      }, this), 0);
    });

    var $prodlist = $('#products ul.list');
    var anontxt = $('#anon-fav-text');
    var maintxt = $('#main-text');

    var show_favtxt = function() {
      if ($prodlist.hasClass('anon-favorites')) {
        console.log('show favtxt');
        anontxt.show();
        maintxt.hide();
      }
      else {
        console.log('hide favtxt');
        anontxt.hide();
        maintxt.show();
      }
    }

    show_favtxt();

    // Change viewing mode for passementerie on click
    $('a[href*="passementerie"]').on('click touch', function(e) {
      //$('#products').hide(); [#72916252]
      if (productlist.page == rg_options.horizontal_page) {
        productlist.page = rg_options.vertical_page;
        $('#products > ul.list').removeClass('slider');
        $('div.threeup').attr('style','');
        return true;
      }
      if ('#'+$(this).attr('href').split('#')[1] == window.location.hash) {
        $(window).trigger('visRearrange');
      }
    });

    // Change viewing mode back to 3up for textile and leather
    $('a[href*="leather"],a[href*="textile"]').on('click touch', function(e) {
      //$('#products').hide(); [#72916252]
      if (productlist.page == rg_options.vertical_page) {
        productlist.page = rg_options.horizontal_page;
        $('button.thumbs').show();
        $('button.slide').hide();
        $('#products > ul.list').addClass('slider');
        $('div.threeup').attr('style','');
        return true;
      }
      if ('#'+$(this).attr('href').split('#')[1] == window.location.hash) {
        $(window).trigger('visRearrange');
      }
    });
  });
});

// KB added this back, but we need to figure out where it goes, as this broke after doing everything else on 2014-07-16
$(window).resize(function() {
  var slideWidth  = $('ul.slider > li:nth-of-type(2)').width();
  $('ul.slider > li > img').width(slideWidth-10);
});

// try to capitalize roman numerals
$(window).load(function() {
  var romannum = function() {
    var lctxt    = $(this).text().toLowerCase();
    var regex    = /\b[MDCLXVI]+\b/ig;
    var testing  = lctxt.match(regex);
  
    if (testing != null ) {
      console.log('something');
      var rntxt    = testing[0].toUpperCase();
      var finished = lctxt.replace(regex, rntxt);
      $(this).text(finished);
    } else {
      console.log('nothing');
    }
  }
  $('.itemoverlay .name p').each(function() {
    romannum();
  });
  
  $('.item-information p span.name').each(function() {
    romannum();
  });
  
});

// figure out where to put this too:
$('.item-spotlight.leather .item-information p.name strong').replace('Fabric', 'Leather');
