// General Functions
var transitioning = true;
//TiltJS has big problems with Safari, so we detect safari here
var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
               navigator.userAgent &&
               navigator.userAgent.indexOf('CriOS') == -1 &&
               navigator.userAgent.indexOf('FxiOS') == -1;
               
if(isSafari == "") {
  $('html').addClass('not-safari');
}

// Window resize with a buffer! Allows for plugins to initialize and be sized correctly
function resize() {
  $(window).trigger('resize');
  setTimeout( function() {
    $(window).trigger('resize');
  }, 3000);
}

// Load toggle - toggles the loading classes with slight delays to allow for layout changes
function toggleLoad() {
  if($('body').hasClass('loading') && transitioning) {
    setTimeout( function() {
      resize();
      $('body').removeClass("loading");
      $('body').addClass("loaded");
      transitioning = false;
    }, 250);
    
  } else {
    $('body').addClass("loading");
    $('body').removeClass("loaded");
    transitioning = true;
  }
}

// Product page functions 
//If there's a selection, enable button
function checkSelected() {
  if($('#selected').length) {
    $('#variation-submit').removeClass('disabled');
  } else {
    $('#variation-submit').addClass('disabled');
  }
}

//hides based on color selection
function selectColor(id) {
  $('.item-color-selector').removeClass('active-color');
  $('.color-based').addClass('hidden-color');
  $('.color-based.cid-' + id).removeClass('hidden-color');
  $('.item-color-selector.col-' + id).addClass('active-color');
  $('#selected').attr('id','');
  $('.variation-submit, #variation-submit').addClass('disabled');
  window.dispatchEvent(new Event('resize'));
  $(window).trigger('resize');
}

// Updates selected option size availability
function updateOption(el) {
  if(!$(el).hasClass('unavailable')) {
    var sizes = $('.size-array').data("sizes").split(", ");
    
    $('#product-images li:eq(' + ( $(el).data('index') - 1 ) + ')').trigger('click');
    $('.sizes-container').removeClass('unselected');
    $('.selected-option').removeClass('selected-option');
    el.addClass('selected-option');
    
    sizes.forEach(function(size){
      var currentSize = " ." + size;
      if(el.data(size)) {
        $(currentSize).removeClass('out-of-stock');
        $(currentSize).addClass('in-stock');
        $(currentSize).data('id', $("." + $(el).attr('id')).data(size)); //grab the id of the option selected, assign product ids from samp
        
      } else {
        $(currentSize).addClass('out-of-stock');
        $(currentSize).removeClass('in-stock');
        $(currentSize).attr('id','');
        $(currentSize).data('id', ''); //remove data id so wrong variations don't get added
      }
    });
  }
}

// Adds #selected on click, removes old
function selectSize(el) {
  if (!el.hasClass('out-of-stock') && !el.hasClass('item-color-selector')) {
    $('#selected').attr('id','');
    $(el).attr('id','selected');
    $('.variation-submit, #variation-submit').removeClass('disabled');
    
    if(el.data("index")) {
      $('#product-images li:eq(' + el.data('index') + ')').trigger('click');
    }
    
  }
}

// Initializations
// Window initializations
function initWindow() {
  Barba.Pjax.Dom.wrapperId = 'loader';
  Barba.Pjax.Dom.containerClass = 'loaded-content';
  Barba.Prefetch.init();
  Barba.Pjax.start();
  
  $('#nav-trigger').on('click', function() {
    $('html').addClass('nav-is-open');
  });
  
  $('#nav-closer, .nav-overlay').on('click', function() {
    $('html').removeClass('nav-is-open');
  });
  
  $('aside ul li:not(.special-nav li)').each(function(i, obj) {
    $(this).css('transition-duration', ((i+1) * 0.3) + 's');
  });
}

// Per-page initializations
function init() {
  $('.item-color-selector:eq(0)').trigger('click');
  $('.gc-startr').glassCase();
	$('select').formSelect();
	
  if($('.carousel').length){
    $('.carousel').slick({
      adaptiveHeight: true,
      arrows: true,
      init: function (e, slick) {
        slick.$slider.find('img').first().on('load', function () {
          $(window).trigger('resize');
        });
      }
    });
  }
  
  $('.product-item').unveil(300);
  
  $('.option-selector').on('click', function(e){
    var $this = $(this);
    updateOption($this);
    checkSelected();
    if ($(window).width() < 700) {
      document.getElementById('sizes-block').scrollIntoView()
    }
  });
  
  $('.option-selector[href^="#"]').on('click', function (e) {
  	e.preventDefault();
  });
  
  $('.size-selector').on('click', function(){
    var $this = $(this);
    selectSize($this);
  });
  
  $('.color-selector').off();
  $('.color-selector').on('click', function(){
    if($('html').attr('id') == $(this).data('color')) {
      $('html').attr('id', '');
      $('.active-color').removeClass('active-color');
    } else {
      $('html').attr('id', $(this).data('color'));
      $('.active-color').removeClass('active-color');
      $(this).addClass('active-color');
    }
      
    if($(window).height() > 900) {
      $('.product-grid')[0].scrollIntoView(false);
    } else {
      $('.product-grid')[0].scrollIntoView();
    }
  });
  
  var j = new Date(0);
  j.setUTCSeconds(1605340860);
  
  $("#inner-countdown")
  .countdown(j, function(event) {
    $(this).text(
      event.strftime('%D:%H:%M:%S')
    );
  });
  
  $("#variation-submit").on('click', function(){
    var id = $('#selected').data('id');
    $.ajax({
      type: 'POST', 
      url: '/cart/add.js',
      dataType: 'json', 
      data: {id:id,quantity:1},
      success: function(){
            location.href="/cart";
      }
   });
  });
}

$(document).ready(function(){
  initWindow();
  init();
});

//Initial loader removal - 
$(window).on("load", function() {
  $('body').removeClass("initial-load");
  $('.new-content').removeClass('new-content');
  $('body').attr('id',$('#pageid').data('val'));
  $('#pageid').remove();
  toggleLoad();
});

//Barba Transitions/Events
var FadeTransition = Barba.BaseTransition.extend({
  start: function() {
    $('html, body').scrollTop(0);
    $('body').css('overflow', 'hidden');
    $('html').removeClass('nav-is-open');
    $('body').attr('id', "loading");
    $('html').attr('id', '');
    
    toggleLoad();
    $('#product-images').remove();
    $('.carousel').slick('unslick');
    Promise
      .all([this.newContainerLoading, this.fadeOut()])
      .then(this.fadeIn.bind(this));
  },

  fadeOut: function() {
    return $(this.oldContainer).animate({ opacity: 0 }, 'slow').promise();
  },

  fadeIn: function() {
    var _this = this;
    var $el = $(this.newContainer);
    
    $('.new-content').removeClass('new-content');
    $('body').attr('id',$('#pageid').data('val'));
    $('#pageid').remove();

    $(this.oldContainer).hide();

    $el.css({
      visibility : 'visible',
      opacity : 0
    });
    
    toggleLoad();
    
    $('.carousel').slick('slickGoTo', 0);
    
    $el.animate({ opacity: 1 }, 400, function() {  
      $('body').css('overflow-y', 'auto');
      $('html, body').scrollTop(0);
      _this.done(); });
  }
});

Barba.Pjax.getTransition = function() { return FadeTransition; };

Barba.Dispatcher.on('newPageReady', function() {
  init();
});

Barba.Dispatcher.on('newPageReady', function(currentStatus, oldStatus, container) {
    var js = container.querySelector("script");
    if(js != null){
        eval(js.innerHTML);
    }
});

Barba.Dispatcher.on('transitionCompleted', function() {
    if($("#product-content").hasClass('drop-12-the-end')) {
      console.log('got it');
      $('html').attr('id', 'black');
    } else {
      console.log('dont got it');
      $('html').attr('id', '');
    }
});

Barba.Dispatcher.on('initStateChange', function() {
  if (window.ga) { 
    gtag('config', 'G-SS0G6DM2GY', {'page_path': location.pathname}); 
  } 
});