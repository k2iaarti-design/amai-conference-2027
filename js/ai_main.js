
$('html').addClass('ai_js');

$(function () {

  /* ---------- Mobile menu: Bootstrap collapse, close after choosing a link ---------- */
  $('#aiNav .ai_menu_link, #aiNav .ai_dd_item, #aiNav a.ai_btn').on('click', function () {
    var el = document.getElementById('aiNav');
    if ($(el).hasClass('show')) { bootstrap.Collapse.getOrCreateInstance(el).hide(); }
  });

  /* ---------- Reliable in-page anchor scroll ----------
     Lazy images above the target change the page height while the browser's
     smooth scroll is running, so the first click stopped half way. Here the
     target position is re-measured on every frame, so it always lands right. */
  var aiScrolling = false;
  $(document).on('click', 'a[href^="#"]:not([data-bs-toggle])', function (e) {
    var hash = this.getAttribute('href');
    if (!hash || hash.length < 2) { return; }
    var $t = $(hash);
    if (!$t.length) { return; }
    e.preventDefault();
    if (hash === '#register') { $t = $t.closest('section'); }
    /* load every lazy image now so heights settle quickly */
    $('img[loading="lazy"]').attr('loading', 'eager');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var offset = parseInt($('html').css('scroll-padding-top'), 10) || 0;
    var start = window.pageYOffset, t0 = null, dur = 700;
    aiScrolling = true;
    function jump(y) { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); }
    function target() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      return Math.max(0, Math.min($t.offset().top - offset, max));
    }
    function frame(ts) {
      if (t0 === null) { t0 = ts; }
      var p = reduce ? 1 : Math.min((ts - t0) / dur, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      if (!aiScrolling) { return; }
      var to = target();
      jump(start + (to - start) * ease);
      if (!aiScrolling) { return; }
      if (p < 1) { requestAnimationFrame(frame); }
      else { settle(0); }
    }
    /* after the animation, keep correcting for ~1.5s in case images still load */
    function settle(n) {
      var to = target();
      if (!aiScrolling) { return; }
      if (Math.abs(window.pageYOffset - to) > 2) { jump(to); }
      if (n < 15) { setTimeout(function () { settle(n + 1); }, 100); }
      else { aiScrolling = false; }
    }
    $(window).one('wheel touchstart keydown', function () { aiScrolling = false; });
    requestAnimationFrame(frame);
    if (history.replaceState) { history.replaceState(null, '', hash); }
  });

  /* ---------- Countdown to 28 Jan 2027 (IST) ---------- */
  var target = new Date('2027-01-28T00:00:00+05:30').getTime();
  function pad(n) { return String(n).padStart(2, '0'); }
  function tick() {
    var t = Math.max(0, target - Date.now());
    $('#d').text(Math.floor(t / 864e5));
    $('#h').text(pad(Math.floor(t % 864e5 / 36e5)));
    $('#m').text(pad(Math.floor(t % 36e5 / 6e4)));
    $('#s').text(pad(Math.floor(t % 6e4 / 1e3)));
    $('[data-cd=d]').text(Math.floor(t / 864e5));
    $('[data-cd=h]').text(pad(Math.floor(t % 864e5 / 36e5)));
    $('[data-cd=m]').text(pad(Math.floor(t % 36e5 / 6e4)));
    $('[data-cd=s]').text(pad(Math.floor(t % 6e4 / 1e3)));
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- Reveal on scroll ---------- */
  var $rv = $('.ai_rv'), $win = $(window);
  function reveal() {
    var bottom = $win.scrollTop() + $win.height();
    $rv.not('.ai_in').each(function () {
      if ($(this).offset().top < bottom - 40) { $(this).addClass('ai_in'); }
    });
    if (!$rv.not('.ai_in').length) { $win.off('scroll resize', reveal); }
  }
  $win.on('scroll resize', reveal);
  reveal();

  /* ---------- FAQ accordion ---------- */
  $('.ai_acc_btn').on('click', function () {
    var $item = $(this).closest('.ai_acc_item');
    var opening = !$item.hasClass('ai_open');
    $('.ai_acc_item').removeClass('ai_open').find('.ai_acc_btn').attr('aria-expanded', false);
    if (opening) { $item.addClass('ai_open').find('.ai_acc_btn').attr('aria-expanded', true); }
  });


});




$('#ai_speaker_sldr').owlCarousel({
      loop: true,
      margin: 20,
      nav: false,
      dots: true,
      autoplay: true,
      responsive: {
         0: {
            items: 1
         },
         400: {
            items: 2
         },
         600: {
            items: 3
         },
         1000: {
            items: 3
         }
      }
   });


/* ---------- Registration helpers ---------- */
var AMAI_WA = '+919599117989'; /* WhatsApp Business number - replace if different */

function vs_onclick_form_get() {
  var f = document.forms['formget'];
  if (!f.contact.value || !f.email.value) { alert('Please enter your mobile number and email.'); return false; }
  return true;
}

$('#waRegister').on('click', function () {
  var f = document.forms['formget'];
  var msg = 'Hello AMAI, I would like to register for the 12th AMAI Alkali Industry Conference (28-29 Jan 2027).' +
    '\nName: ' + f.name.value + '\nCompany: ' + f.cname.value + '\nMobile: ' + f.contact.value +
    '\nEmail: ' + f.email.value + '\nRegistering as: ' + f.regtype.value + '\nDelegates: ' + f.delegates.value +
    (f.message.value ? '\nNote: ' + f.message.value : '');
  window.open('https://wa.me/' + AMAI_WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
});
