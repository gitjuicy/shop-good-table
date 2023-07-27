// var links = document.links;
// for (let i = 0, linksLength = links.length ; i < linksLength ; i++) {
//   if (links[i].hostname !== window.location.hostname) {
//     links[i].target = '_blank';
//     links[i].rel = 'noreferrer noopener';
//   }
// }

/* ========================================================================== */
/* ADD CUSTOM JS BELOW */
/* ========================================================================== */

/*
 * OneTrust
 */
document.querySelectorAll('a[href="#preference-center"]').forEach(function(v) {
  v.addEventListener('click', function(e) {
    e.preventDefault();
    if (typeof(OneTrust) != 'undefined')
      OneTrust.ToggleInfoDisplay();
  });
});

/*
 * Custom Checkout Functionality and Analytics
 */

// remove me when GA is added
if (typeof(ga) === "undefined")
  function ga() {};

const ShopifyAPI = {
  getCart: function(callback) {
    fetch('/cart.json').then((r) => r.json()).then(callback);
  }
};

let notAvailableItemsProductIDs = [];
let notAvailableItemsProductNames = [];
let notAvailableItemsQuantities = [];
let availableItemsProductIDs = [];
let availableItemsProductNames = [];
let availableItemsQuantities = [];
let unavailableListText = '';

let uniqueIdentifier;

if (getCookie('ga_unique_id') == null) {
  uniqueIdentifier = new Date().getTime();
  setCookie('ga_unique_id', uniqueIdentifier, 1);
}

$(function() {
  let ga_unique_id = getCookie('ga_unique_id');

  $('#ga_unique_id_input').val(ga_unique_id);

  $('.js-cart-item-unavailable .cart__checkout').click(function() {
    ga('send', 'event', 'Special Checkout Events', 'Continue to Checkout pressed', ga_unique_id);
    $('.cart-form .cart__checkout').click();
  });

  $('.browse-more-products').click(function() {
    ga('send', 'event', 'Special Checkout Events', 'Browse More Products pressed', ga_unique_id);
  });

  $('form#cart').on('submit', function(e) {
    if ($('.not-available').length > 0) {
      e.preventDefault();

      $('.cart-item').each(function() {
        if ($(this).hasClass('not-available')) {
          notAvailableItemsProductIDs.push($(this).attr('data-variant-id'));
        } else {
          availableItemsProductIDs.push($(this).attr('data-variant-id'));
        }
      });

      ShopifyAPI.getCart(function(c) {
        console.log(c)
        for (i = 0; i < c.items.length; i++) {
          let id = c.items[i].id.toString();
          if (notAvailableItemsProductIDs.includes(id)) {
            notAvailableItemsProductNames.push(c.items[i].product_title);
            notAvailableItemsQuantities.push(c.items[i].quantity);
          } else {
            availableItemsProductNames.push(c.items[i].product_title);
            availableItemsQuantities.push(c.items[i].quantity);
          }
        }

        unavailableListText = "Thanks for popping ";
        unavailableListText += notAvailableItemsProductNames.join(', ');
        unavailableListText += " in your cart!";

        if (notAvailableItemsProductNames.length > 1) {
          unavailableListText += ' These products are the ones we told you have not yet been created, but we have noted your interest. They have,'
        } else {
          unavailableListText += ' This product is the one we told you has not yet been created, but we have noted your interest. It has,'
        }

        $('.unavailable-list').text(unavailableListText);

        let notAvailableGAAction = '';
        let availableGAAction = '';
        for (i = 0; i < notAvailableItemsProductNames.length; i++) {
          notAvailableGAAction += notAvailableItemsQuantities[i].toString() + 'x' + notAvailableItemsProductNames[i];
          if (notAvailableItemsProductNames.length > 1 && i < notAvailableItemsProductNames.length - 1) {
            notAvailableGAAction += ', ';
          }
        }
        for (i = 0; i < availableItemsProductNames.length; i++) {
          availableGAAction += availableItemsQuantities[i].toString() + 'x' + availableItemsProductNames[i];
          if (availableItemsProductNames.length > 1 && i < availableItemsProductNames.length - 1) {
            availableGAAction += ', ';
          }
        }

        ga('send', 'event', 'Special Checkout Events', 'Checkout attempted. Unavailable items: ' + notAvailableGAAction, ga_unique_id);

        ga('send', 'event', 'Special Checkout Events', 'Checkout attempted. Available items: ' + availableGAAction, ga_unique_id);

      });

      function removeItems(items) {
        let qty = 0;
        let data = { updates: {} };

        for (i = 0; i < items.length; i++) {
          data.updates[items[i]] = qty;
        }

        jQuery.ajax({
          type: 'POST',
          url: '/cart/update.js',
          data: data,
          dataType: 'json',
          success: function() {
            $('.not-available').each(function() {
              $(this).remove();
            });
            updateCartTotal();
          }
        });
      }

      function updateCartTotal() {
        ShopifyAPI.getCart(function(c) {
          let subtotalText = "";
          let subtotal = c.items_subtotal_price / 100;
          subtotal = (Math.round(subtotal * 100) / 100).toFixed(2);
          if (c.currency == 'USD') {
            subtotalText += '$' + subtotal;
          }
          $('.cart__footer-total .money').text(subtotalText);
          $('#CartCount').text(c.item_count);
        });
      }

      let closeBtn = '<button title="Close (Esc)" type="button" class="mfp-close mfp-close--custom js-close-mfp" aria-label="close"><i class="icon icon--close"></i></button>';

      $.magnificPopup.open({
        items: {
          src: ".js-cart-item-unavailable"
        },
        type: "inline",
        mainClass: "mfp-medium",
        fixedContentPos: true,
        midClick: true,
        closeMarkup: closeBtn,
        removalDelay: 200,
        callbacks: {
          open: function(item) {
            removeItems(notAvailableItemsProductIDs);
          },
          close: function(item) {
            ga('send', 'event', 'Special Checkout Events', 'Popup Closed', ga_unique_id);
          }
        }
      });
    }
  });
});

function setCookie(name,value,days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

function eraseCookie(name) {
  document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
