/* Registration page (register.html): 3-step form */
$(function () {
  var $form = $('#aiRegForm');
  if (!$form.length) { return; }
  var $alert = $('#aiRegAlert');
  var $submit = $('#aiRegSubmit');
  var GST = 0.18;   /* default GST for INR categories */
  var step = 1;

  /* Format an amount in the category's currency (INR or USD) */
  function money(n, cur) {
    return cur === 'USD'
      ? '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  /* Read currency / GST / label from the selected radio (with safe fallbacks) */
  function catInfo($c) {
    var v = String($c.val() || '').toLowerCase();
    var intl = /int|foreign/.test(v);
    var cur = String($c.data('currency') || (intl ? 'USD' : 'INR')).toUpperCase();
    var gstAttr = $c.data('gst');
    var gst = (gstAttr !== undefined && gstAttr !== '') ? +gstAttr : (cur === 'USD' ? 0 : GST);
    var label = $.trim($c.closest('.ai_reg_opt').find('.ai_reg_opt_row b').first().text()) || $c.data('label');
    return { cur: cur, gst: gst, label: label, base: +$c.data('price') };
  }
  function esc(s) { return $('<div>').text(s || '').html(); }
  function cat() { return $form.find('input[name=category]:checked'); }

  function updateCategory() {
    var $c = cat();
    $('.ai_reg_opt').removeClass('ai_sel');
    if (!$c.length) { return; }
    $c.closest('.ai_reg_opt').addClass('ai_sel');
    var i = catInfo($c);
    $('#aiSumLabel').text(i.label);
    $('#aiSumBase').text(money(i.base, i.cur));
    $('#aiSumGst').text(money(i.base * i.gst, i.cur));
    $('#aiSumGst').closest('.ai_reg_sum_row').toggleClass('d-none', i.gst === 0);
    $('#aiSumTotal').text(money(i.base * (1 + i.gst), i.cur));
    $('#aiRegtype').val(i.label + ' – ' + money(i.base, i.cur).replace('.00', '') + (i.gst ? ' + GST' : ''));
    var isMember = $c.val() === 'member';
    $('#aiVerify').toggleClass('d-none', !isMember);
    $('#aiMemberId').prop('required', isMember);
    $('#aiCatErr').addClass('d-none');
  }

  /* Preselect from ?category=member | non-member | international (default: member, as on the reference form) */
  var q = (new URLSearchParams(window.location.search).get('category') || 'member').toLowerCase();
  var $pre = $form.find('input[name=category]').filter(function () { return this.value.toLowerCase() === q; });
  if (!$pre.length) { $pre = $form.find('input[name=category][value="member"]'); }
  $pre.first().prop('checked', true);
  updateCategory();
  $form.on('change', 'input[name=category]', updateCategory);

  function showAlert(type, text) {
    $alert.removeClass('d-none alert-success alert-danger').addClass('alert-' + type).text(text);
    $alert[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function validStep(n) {
    var ok = true, first = null;
    if (n === 1 && !cat().length) { $('#aiCatErr').removeClass('d-none'); return false; }
    $form.find('[data-panel=' + n + '] input, [data-panel=' + n + '] select, [data-panel=' + n + '] textarea').each(function () {
      if (this.type === 'radio') { return; }
      var good = this.checkValidity() && !(this.required && $.trim(this.value) === '');
      $(this).toggleClass('is-invalid', !good);
      if (!good) { ok = false; if (!first) { first = this; } }
    });
    if (first) { first.focus(); }
    return ok;
  }

  $form.on('input change', 'input, select, textarea', function () {
    if ($(this).hasClass('is-invalid') && this.checkValidity() && $.trim(this.value) !== '') { $(this).removeClass('is-invalid'); }
  });

  function buildReview() {
    var f = $form[0], $c = cat();
    var rows = [
      ['Category', catInfo($c).label, 1],
      ['Member number / email', $c.val() === 'member' ? f.member_id.value : '', 1],
      ['Name', f.name.value, 2], ['Company', f.cname.value, 2], ['Mobile', f.contact.value, 2],
      ['Email', f.email.value, 2], ['Number of delegates', f.delegates.value, 2], ['Message', f.message.value, 2]
    ];
    var h = '<dl>';
    rows.forEach(function (r) {
      if (!r[1]) { return; }
      h += '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd><a href="#" data-next="' + r[2] + '">Edit</a></div>';
    });
    h += '<div class="ai_reg_review_tot"><dt>Total payable (per participant)</dt><dd>' + $('#aiSumTotal').text() + '</dd></div></dl>';
    $('#aiReview').html(h);
  }

  function go(n) {
    step = n;
    $form.find('.ai_reg_panel').addClass('d-none').filter('[data-panel=' + n + ']').removeClass('d-none');
    $('#aiSteps li').each(function () {
      var s = +$(this).data('step');
      $(this).toggleClass('ai_active', s === n).toggleClass('ai_done', s < n);
    });
    if (n === 3) { buildReview(); }
    $alert.addClass('d-none');
    $('html, body').animate({ scrollTop: Math.max(0, $('#aiSteps').offset().top - 130) }, 200);
  }

  $(document).on('click', '[data-next]', function (e) {
    e.preventDefault();
    var to = +$(this).data('next');
    if (to > step) {
      for (var i = step; i < to; i++) { if (!validStep(i)) { return; } }
    }
    go(to);
  });

  /* Submit: success is shown only when the server confirms (HTTP 2xx) */
  $form.on('submit', function (e) {
    e.preventDefault();
    if (!validStep(1) || !validStep(2)) { return; }
    $submit.prop('disabled', true).find('.ai_reg_btn_txt').text('Submitting…');
    $.ajax({ url: $form.attr('action'), method: 'POST', data: $form.serialize() })
      .done(function () {
        showAlert('success', 'Thank you. Your registration request has been submitted to the AMAI secretariat.');
      })
      .fail(function () {
        showAlert('danger', 'We could not submit your registration. Please try again, or use "Send on WhatsApp" or email hkanand@ama-india.org.');
      })
      .always(function () {
        $submit.prop('disabled', false).find('.ai_reg_btn_txt').text('Submit registration');
      });
  });

  /* WhatsApp: replaces the generic handler from ai_main.js */
  $('#waRegister').off('click').on('click', function () {
    if (!validStep(1) || !validStep(2)) { return; }
    var f = $form[0];
    var msg = 'Hello AMAI, I would like to register for the 12th AMAI Alkali Industry Conference (28-29 Jan 2027).' +
      '\nCategory: ' + $('#aiRegtype').val() +
      (cat().val() === 'member' ? '\nMember number/email: ' + f.member_id.value : '') +
      '\nName: ' + f.name.value + '\nCompany: ' + f.cname.value + '\nMobile: ' + f.contact.value +
      '\nEmail: ' + f.email.value + '\nDelegates: ' + f.delegates.value +
      (f.message.value ? '\nNote: ' + f.message.value : '');
    window.open('https://wa.me/' + AMAI_WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });
});
