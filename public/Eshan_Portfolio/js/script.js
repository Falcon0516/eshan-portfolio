(function(){
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- PRELOADER ---------- */
  (function(){
    var pre = document.getElementById('preloader');
    var mark = document.getElementById('preloaderMark');
    var rule = document.getElementById('preloaderRule');

    if (prefersReduced || !mark || !rule) {
      window.addEventListener('load', function(){
        setTimeout(function(){
          pre.classList.add('hide');
          document.body.style.overflow = '';
        }, 500);
      });
      return;
    }

    var chars = mark.textContent.split('');
    mark.innerHTML = chars.map(function(c, i){
      var ch = c === ' ' ? '&nbsp;' : c;
      return '<span class="preloader-letter" style="--li:' + i + '">' + ch + '</span>';
    }).join('');
    var letterEls = mark.querySelectorAll('.preloader-letter');

    var sequenceStart = performance.now();
    requestAnimationFrame(function(){
      letterEls.forEach(function(l){ l.classList.add('in'); });
    });

    var ruleDelay = letterEls.length * 45 + 500 + 100;
    setTimeout(function(){ rule.classList.add('in'); }, ruleDelay);

    var totalSequence = ruleDelay + 500 + 150; // ~900-1200ms end to end

    window.addEventListener('load', function(){
      var elapsed = performance.now() - sequenceStart;
      var remaining = Math.max(0, totalSequence - elapsed);
      setTimeout(function(){
        pre.classList.add('hide');
        document.body.style.overflow = '';
      }, remaining);
    });
  })();

  /* ---------- NAV: scroll state + mobile toggle ---------- */
  var nav = document.getElementById('nav');
  var onScrollNav = function(){
    if (window.scrollY > 8) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  document.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  var navToggle = document.getElementById('navToggle');
  var navMobile = document.getElementById('navMobile');
  navToggle.addEventListener('click', function(){
    navToggle.classList.toggle('open');
    navMobile.classList.toggle('open');
  });
  navMobile.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      navToggle.classList.remove('open');
      navMobile.classList.remove('open');
    });
  });

  /* ---------- REVEAL ON SCROLL ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-scale, .reveal-mask, .reveal-blur-pull');
  if (prefersReduced) {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  }

  /* ---------- HERO SPEC PILLS ---------- */
  var pills = document.querySelectorAll('[data-pill]');
  if (prefersReduced) {
    pills.forEach(function(p){ p.classList.add('in'); });
  } else {
    setTimeout(function(){
      pills.forEach(function(p){ p.classList.add('in'); });
    }, 650);
  }

  /* ---------- STAT COUNTERS ---------- */
  var counters = document.querySelectorAll('[data-count], [data-decimal]');
  var animateCounter = function(el){
    var isDecimal = el.hasAttribute('data-decimal');
    var target = parseFloat(el.getAttribute(isDecimal ? 'data-decimal' : 'data-count'));
    var plusEl = el.querySelector('.plus');
    var plusHTML = plusEl ? plusEl.outerHTML : '';
    var duration = 1400;
    var start = null;

    if (prefersReduced) {
      el.innerHTML = (isDecimal ? target.toFixed(2) : target) + plusHTML;
      return;
    }

    function step(ts){
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.innerHTML = (isDecimal ? value.toFixed(2) : Math.round(value)) + plusHTML;
      if (progress < 1) requestAnimationFrame(step);
      else el.innerHTML = (isDecimal ? target.toFixed(2) : target) + plusHTML;
    }
    requestAnimationFrame(step);
  };

  var counterIO = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting){
        animateCounter(entry.target);
        counterIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach(function(c){ counterIO.observe(c); });

  /* ---------- TROPHY STRIP: drag to scroll + 3D depth carousel + hover enlarge ---------- */
  var strip = document.getElementById('trophyStrip');
  var trophyPin = document.getElementById('trophyPin');
  var canHoverEarly = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (strip) {
    var trophyCards = Array.prototype.slice.call(strip.querySelectorAll('.trophy-card'));
    var hoveredTrophyCard = null;
    var depthTicking = false;

    var applyCardTransform = function(card, t){
      var isHovered = card === hoveredTrophyCard;
      var scale = 1 - Math.min(Math.abs(t), 1) * 0.1;
      var rotateY = t * 9;
      var opacity = 1 - Math.min(Math.abs(t), 1) * 0.28;
      if (isHovered && canHoverEarly && !prefersReduced) {
        scale = 1.1;
        rotateY = rotateY * 0.35;
        opacity = 1;
      }
      card.style.transform = 'perspective(1400px) rotateY(' + (-rotateY) + 'deg) scale(' + scale + ') translateY(' + (isHovered ? -14 : 0) + 'px)';
      card.style.opacity = String(opacity);
      card.style.zIndex = isHovered ? 5 : 1;
    };
    var updateCardDepth = function(){
      depthTicking = false;
      if (prefersReduced) return;
      var stripRect = strip.getBoundingClientRect();
      var center = stripRect.left + stripRect.width / 2;
      trophyCards.forEach(function(card){
        var r = card.getBoundingClientRect();
        var cardCenter = r.left + r.width / 2;
        var t = (cardCenter - center) / (stripRect.width / 2);
        t = Math.max(-1.4, Math.min(1.4, t));
        applyCardTransform(card, t);
      });
    };
    var onStripScroll = function(){
      if (!depthTicking){
        depthTicking = true;
        requestAnimationFrame(updateCardDepth);
      }
    };
    strip.addEventListener('scroll', onStripScroll, { passive: true });
    window.addEventListener('resize', onStripScroll);
    updateCardDepth();

    if (canHoverEarly && !prefersReduced) {
      trophyCards.forEach(function(card){
        card.addEventListener('mouseenter', function(){
          hoveredTrophyCard = card;
          updateCardDepth();
        });
        card.addEventListener('mouseleave', function(){
          hoveredTrophyCard = null;
          updateCardDepth();
        });
      });
    }

    var isDown = false, startX, scrollLeft;

    strip.addEventListener('mousedown', function(e){
      isDown = true;
      strip.style.cursor = 'grabbing';
      startX = e.pageX - strip.offsetLeft;
      scrollLeft = strip.scrollLeft;
    });
    ['mouseleave','mouseup'].forEach(function(evt){
      strip.addEventListener(evt, function(){
        isDown = false;
        strip.style.cursor = '';
      });
    });
    strip.addEventListener('mousemove', function(e){
      if (!isDown) return;
      e.preventDefault();
      var x = e.pageX - strip.offsetLeft;
      var walk = (x - startX) * 1.3;
      strip.scrollLeft = scrollLeft - walk;
    });

    /* ---- vertical scroll drives horizontal movement, pinned in place while it plays out ---- */
    if (trophyPin && canHoverEarly && !prefersReduced) {
      var setTrophyPinHeight = function(){
        var extra = Math.max(0, strip.scrollWidth - strip.clientWidth);
        trophyPin.style.height = (window.innerHeight + extra) + 'px';
        trophyPin.classList.add('pin-active');
      };
      setTrophyPinHeight();
      window.addEventListener('load', setTrophyPinHeight);
      window.addEventListener('resize', setTrophyPinHeight);

      var trophyTicking = false;
      var updateTrophyScroll = function(){
        trophyTicking = false;
        var total = trophyPin.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        var rect = trophyPin.getBoundingClientRect();
        var progress = Math.min(1, Math.max(0, -rect.top / total));
        var maxScroll = strip.scrollWidth - strip.clientWidth;
        if (!isDown) strip.scrollLeft = progress * maxScroll;
      };
      document.addEventListener('scroll', function(){
        if (!trophyTicking){ trophyTicking = true; requestAnimationFrame(updateTrophyScroll); }
      }, { passive: true });
      updateTrophyScroll();
    }
  }

  /* ---------- LIGHTBOX ---------- */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('[data-lightbox]').forEach(function(el){
    el.addEventListener('click', function(){
      var src = el.getAttribute('data-lightbox');
      var altSource = el.querySelector('img');
      lightboxImg.src = src;
      lightboxImg.alt = altSource ? altSource.alt : '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox(){
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function(e){
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeLightbox();
  });

  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- CUSTOM CURSOR ---------- */
  var cursorDot = document.getElementById('cursorDot');
  if (cursorDot && canHover && !prefersReduced) {
    var cursorX = 0, cursorY = 0, cursorTicking = false, cursorAwake = false;

    var paintCursor = function(){
      cursorTicking = false;
      cursorDot.style.transform = 'translate(' + cursorX + 'px,' + cursorY + 'px) translate(-50%,-50%)';
    };

    document.addEventListener('mousemove', function(e){
      cursorX = e.clientX;
      cursorY = e.clientY;
      if (!cursorAwake){
        cursorAwake = true;
        document.documentElement.classList.add('cursor-ready');
      }
      if (!cursorTicking){
        cursorTicking = true;
        requestAnimationFrame(paintCursor);
      }
    }, { passive: true });

    document.addEventListener('mouseleave', function(){
      document.documentElement.classList.remove('cursor-ready');
      cursorAwake = false;
    });

    var CURSOR_HOVER_SELECTOR = 'a, button, [role="button"], .tilt, .tilt-sm, .credential-card, .gallery-item, .cert-row, input, textarea, select, label';
    document.addEventListener('mouseover', function(e){
      var target = e.target.closest ? e.target.closest(CURSOR_HOVER_SELECTOR) : null;
      if (target) cursorDot.classList.add('hover');
    });
    document.addEventListener('mouseout', function(e){
      var target = e.target.closest ? e.target.closest(CURSOR_HOVER_SELECTOR) : null;
      var toTarget = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(CURSOR_HOVER_SELECTOR) : null;
      if (target && !toTarget) cursorDot.classList.remove('hover');
    });
  }

  /* ---------- SPLIT-TEXT HERO TITLE ---------- */
  document.querySelectorAll('[data-split]').forEach(function(el){
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function(w, i){
      return '<span class="split-word" style="--wi:' + i + '">' + w + '&nbsp;</span>';
    }).join('');
  });
  setTimeout(function(){
    document.querySelectorAll('.split-word').forEach(function(w){ w.classList.add('in'); });
  }, prefersReduced ? 0 : 550);

  /* ---------- SCROLL PROGRESS BAR ---------- */
  var progress = document.getElementById('scrollProgress');
  var onScrollProgress = function(){
    var h = document.documentElement;
    var scrolled = h.scrollTop;
    var height = h.scrollHeight - h.clientHeight;
    var ratio = height > 0 ? scrolled / height : 0;
    if (progress) progress.style.transform = 'scaleX(' + ratio + ')';
  };
  document.addEventListener('scroll', onScrollProgress, { passive: true });
  onScrollProgress();

  /* ---------- ACTIVE NAV INDICATOR ---------- */
  var navLinksWrap = document.getElementById('navLinks');
  var navIndicator = document.getElementById('navIndicator');
  var navAnchors = navLinksWrap ? Array.prototype.slice.call(navLinksWrap.querySelectorAll('a[data-nav]')) : [];
  var moveIndicator = function(link){
    if (!navIndicator || !link) return;
    navIndicator.style.width = link.offsetWidth + 'px';
    navIndicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    navIndicator.style.opacity = '1';
  };
  if (navAnchors.length) {
    var navSections = navAnchors.map(function(a){ return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
    var navIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          var id = '#' + entry.target.id;
          navAnchors.forEach(function(a){ a.classList.toggle('active', a.getAttribute('href') === id); });
          var active = navAnchors.filter(function(a){ return a.getAttribute('href') === id; })[0];
          if (active) moveIndicator(active);
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    navSections.forEach(function(s){ navIO.observe(s); });
    window.addEventListener('resize', function(){
      var activeLink = navLinksWrap.querySelector('a.active');
      if (activeLink) moveIndicator(activeLink);
    });
  }

  /* ---------- HERO PARALLAX ---------- */
  var heroBgCover = document.querySelector('.hero-bg-cover');
  var heroSection = document.getElementById('top');
  if (heroBgCover && heroSection && !prefersReduced) {
    var onHeroScroll = function(){
      var rect = heroSection.getBoundingClientRect();
      var progressY = Math.min(Math.max(-rect.top / (rect.height || 1), 0), 1);
      heroBgCover.style.transform = 'translateY(' + (progressY * 60) + 'px) scale(' + (1.02 + progressY * 0.06) + ')';
      heroBgCover.style.opacity = String(0.08 * (1 - progressY * 0.6));
    };
    document.addEventListener('scroll', onHeroScroll, { passive: true });
    onHeroScroll();
  }

  /* ---------- PORTRAIT TILT ---------- */
  var heroPortrait = document.getElementById('heroPortrait');
  if (heroPortrait && canHover && !prefersReduced) {
    var portraitImg = heroPortrait.querySelector('img');
    heroPortrait.addEventListener('mousemove', function(e){
      var r = heroPortrait.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      portraitImg.style.transform = 'translateZ(0) rotateY(' + (px * 16) + 'deg) rotateX(' + (py * -16) + 'deg)';
    });
    heroPortrait.addEventListener('mouseleave', function(){
      portraitImg.style.transform = 'translateZ(0) rotateY(0) rotateX(0)';
    });
  }

  /* ---------- 3D TILT CARDS ---------- */
  if (canHover && !prefersReduced) {
    document.querySelectorAll('.tilt:not(.trophy-card)').forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateY(' + (px * 8) + 'deg) rotateX(' + (py * -8) + 'deg) translateY(-2px)';
      });
      card.addEventListener('mouseleave', function(){
        card.style.transform = '';
      });
    });
  }

  /* ---------- 3D TILT CARDS — SMALL/LIGHT VARIANT (proj-grid) ----------
     Lighter angle (4-5deg vs 8deg) and a longer perspective distance so the
     smaller cards feel quick and precise rather than heavy like the flagship
     media / trophy cards. */
  if (canHover && !prefersReduced) {
    document.querySelectorAll('.tilt-sm').forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(1400px) rotateY(' + (px * 5) + 'deg) rotateX(' + (py * -4.5) + 'deg) translateY(-6px)';
      });
      card.addEventListener('mouseleave', function(){
        card.style.transform = '';
      });
    });
  }

  /* ---------- MAGNETIC BUTTONS ---------- */
  if (canHover && !prefersReduced) {
    document.querySelectorAll('.magnetic:not(.magnetic-strong)').forEach(function(btn){
      btn.addEventListener('mousemove', function(e){
        var r = btn.getBoundingClientRect();
        var mx = (e.clientX - r.left - r.width / 2) * 0.28;
        var my = (e.clientY - r.top - r.height / 2) * 0.4;
        btn.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      });
      btn.addEventListener('mouseleave', function(){
        btn.style.transform = '';
      });
    });
  }

  /* ---------- MAGNETIC BUTTONS — STRONG VARIANT (primary contact CTA) ----------
     Pulls from a wider capture radius than the element's own bounding box
     (not just on hover of the button itself), and with a stronger multiplier —
     this is the single most important click on the page. */
  if (canHover && !prefersReduced) {
    var strongMagnets = Array.prototype.slice.call(document.querySelectorAll('.magnetic-strong'));
    if (strongMagnets.length) {
      var MAGNET_RADIUS = 140; // extra px beyond the element's own edges
      var magnetTicking = false;
      var lastMagnetX = 0, lastMagnetY = 0;

      var updateMagnets = function(){
        magnetTicking = false;
        strongMagnets.forEach(function(btn){
          var r = btn.getBoundingClientRect();
          var cx = r.left + r.width / 2;
          var cy = r.top + r.height / 2;
          var dx = lastMagnetX - cx;
          var dy = lastMagnetY - cy;
          var reach = Math.max(r.width, r.height) / 2 + MAGNET_RADIUS;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < reach) {
            var pull = 1 - dist / reach; // 0 at edge of radius, 1 at center
            btn.style.transform = 'translate(' + (dx * 0.4 * pull) + 'px,' + (dy * 0.5 * pull) + 'px)';
          } else {
            btn.style.transform = '';
          }
        });
      };

      document.addEventListener('mousemove', function(e){
        lastMagnetX = e.clientX;
        lastMagnetY = e.clientY;
        if (!magnetTicking) {
          magnetTicking = true;
          requestAnimationFrame(updateMagnets);
        }
      }, { passive: true });
    }
  }

  /* ---------- SKILL TREE: scroll-scrubbed growth + 3D rotation, pinned ---------- */
  var skillTreePin = document.getElementById('skillTreePin');
  var skillTreeWrap = document.getElementById('skillTreeWrap');
  var treeScrollEnabled = !!(skillTreePin && skillTreeWrap && !prefersReduced && window.matchMedia('(min-width:761px)').matches);

  if (treeScrollEnabled) {
    skillTreeWrap.classList.add('scroll-mode');
    var treeSvgEl = skillTreeWrap.querySelector('.skill-tree-svg');
    var treeTicking = false;

    var updateTreeScroll = function(){
      treeTicking = false;
      var rect = skillTreePin.getBoundingClientRect();
      var total = skillTreePin.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      var progress = Math.min(1, Math.max(0, -rect.top / total));

      skillTreeWrap.style.setProperty('--tree-progress', progress.toFixed(4));

      if (treeSvgEl){
        // gentle 3D sway that resolves back to flat exactly as the tree finishes growing,
        // then the pin releases and normal scroll carries into the next section
        var rotY = Math.sin(progress * Math.PI) * 22;
        var rotX = Math.sin(progress * Math.PI * 1.5) * 7;
        var rise = (1 - progress) * 46;
        var scale = 0.82 + progress * 0.18;
        treeSvgEl.style.transform =
          'translateY(' + rise + 'px) scale(' + scale + ') rotateY(' + rotY + 'deg) rotateX(' + (-rotX) + 'deg)';
      }
    };

    document.addEventListener('scroll', function(){
      if (!treeTicking){ treeTicking = true; requestAnimationFrame(updateTreeScroll); }
    }, { passive:true });
    window.addEventListener('resize', updateTreeScroll);
    updateTreeScroll();
  } else if (skillTreeWrap && canHover && !prefersReduced) {
    /* mobile/no-JS-pin fallback: subtle hover parallax */
    var treeSvgElFallback = skillTreeWrap.querySelector('.skill-tree-svg');
    skillTreeWrap.addEventListener('mousemove', function(e){
      var r = skillTreeWrap.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      treeSvgElFallback.style.transform = 'rotateY(' + (px * 10) + 'deg) rotateX(' + (py * -10) + 'deg)';
    });
    skillTreeWrap.addEventListener('mouseleave', function(){
      treeSvgElFallback.style.transform = '';
    });
  }

  /* ---------- SKILL TREE: branch highlight ---------- */
  var treeSvg = document.querySelector('.skill-tree-svg');
  if (treeSvg) {
    var setBranch = function(branch){
      var all = treeSvg.querySelectorAll('[data-branch]');
      if (!branch){
        treeSvg.classList.remove('dimmed');
        all.forEach(function(el){ el.classList.remove('branch-active'); });
        document.querySelectorAll('.tree-legend-item').forEach(function(b){ b.classList.remove('active'); });
        return;
      }
      treeSvg.classList.add('dimmed');
      all.forEach(function(el){
        el.classList.toggle('branch-active', el.getAttribute('data-branch') === branch);
      });
      document.querySelectorAll('.tree-legend-item').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-branch') === branch);
      });
    };

    treeSvg.querySelectorAll('.tree-cat').forEach(function(node){
      node.addEventListener('mouseenter', function(){ setBranch(node.getAttribute('data-branch')); });
    });
    treeSvg.addEventListener('mouseleave', function(){ setBranch(null); });

    document.querySelectorAll('.tree-legend-item').forEach(function(btn){
      btn.addEventListener('click', function(){
        var isActive = btn.classList.contains('active');
        setBranch(isActive ? null : btn.getAttribute('data-branch'));
      });
      btn.addEventListener('mouseenter', function(){ setBranch(btn.getAttribute('data-branch')); });
      btn.addEventListener('mouseleave', function(){
        if (!document.querySelector('.tree-legend-item.active')) setBranch(null);
      });
    });
  }

  /* ---------- SMOOTH ANCHOR SCROLL (offset for fixed nav) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var navH = 52;
      var top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

})();
