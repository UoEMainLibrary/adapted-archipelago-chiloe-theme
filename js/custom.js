/**
 * @file
 * Global utilities.
 *
 */
(function($, Drupal) {

  'use strict';

  /**
   * WCAG 2.2.2 Pause, Stop, Hide.
   *
   * Wires the pause/play toggle rendered by
   * templates/views/views-bootstrap-carousel.html.twig into the Bootstrap 5
   * Carousel API. Also honours prefers-reduced-motion by starting paused.
   */
  Drupal.behaviors.archipelago_subtheme_chiloe_carousel_pause = {
    attach: function (context) {
      const toggles = once('a11y-carousel-pause', '.carousel-pause-toggle', context);
      toggles.forEach(function (toggle) {
        const targetId = toggle.getAttribute('data-bs-target');
        const carouselEl = targetId ? document.querySelector(targetId) : toggle.closest('.carousel');
        if (!carouselEl || typeof bootstrap === 'undefined' || !bootstrap.Carousel) {
          return;
        }
        const carousel = bootstrap.Carousel.getOrCreateInstance(carouselEl);
        const label = toggle.querySelector('.carousel-pause-toggle__label');
        const pausedLabel = Drupal.t('Play');
        const playingLabel = Drupal.t('Pause');
        const pausedAria = Drupal.t('Play carousel automatic sliding');
        const playingAria = Drupal.t('Pause carousel automatic sliding');

        function setState(paused) {
          toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
          toggle.setAttribute('aria-label', paused ? pausedAria : playingAria);
          toggle.classList.toggle('is-paused', paused);
          if (label) {
            label.textContent = paused ? pausedLabel : playingLabel;
          }
        }

        toggle.addEventListener('click', function () {
          const paused = toggle.getAttribute('aria-pressed') === 'true';
          if (paused) {
            carousel.cycle();
            setState(false);
          } else {
            carousel.pause();
            setState(true);
          }
        });

        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          carousel.pause();
          setState(true);
        }
      });
    }
  };

  /**
   * Mobile nav coordination fix.
   *
   * The header exposes a single hamburger button that targets `.to-be-collapsed`
   * which matches both `#CollapsingNavbarTop` and `#CollapsingNavbar`. Bootstrap
   * 5's built-in collapse handling for a multi-target selector can leave the
   * two panels out of sync (one open, one closed) when a user closes just one
   * of them (e.g. via ESC or a dismiss button inside an offcanvas variant), and
   * the toggler's aria-expanded state stops matching what's on screen.
   *
   * This behaviour:
   *  - Intercepts clicks on the shared toggler and drives both Collapse
   *    instances in lockstep.
   *  - Keeps aria-expanded on the toggler in sync with the actual DOM state
   *    by listening to Bootstrap's `shown.bs.collapse` / `hidden.bs.collapse`
   *    events on either panel.
   *  - Constrains the open menu to the viewport with an internal scrollbar so
   *    it doesn't get cut off on short mobile screens (supports WCAG 1.4.10
   *    Reflow).
   *  - Moves focus into the newly opened panel and returns it to the toggler
   *    on close, giving keyboard-only users a coherent tab loop.
   */
  Drupal.behaviors.archipelago_subtheme_chiloe_mobile_nav = {
    attach: function (context) {
      const togglers = once(
        'a11y-mobile-nav',
        '.navbar-toggler[data-bs-target=".to-be-collapsed"]',
        context
      );
      togglers.forEach(function (toggler) {
        if (typeof bootstrap === 'undefined' || !bootstrap.Collapse) {
          return;
        }
        const panels = Array.from(document.querySelectorAll('.to-be-collapsed'));
        if (panels.length === 0) {
          return;
        }

        panels.forEach(function (panel) {
          panel.setAttribute('data-bs-parent', '');
          // Ensure aria attributes are set for AT users.
          if (!panel.hasAttribute('role')) {
            panel.setAttribute('role', 'region');
          }
          if (!panel.hasAttribute('aria-label') && panel.id) {
            panel.setAttribute('aria-label', panel.id === 'CollapsingNavbarTop' ? Drupal.t('Site utilities') : Drupal.t('Main navigation'));
          }
          panel.addEventListener('shown.bs.collapse', function () {
            toggler.setAttribute('aria-expanded', 'true');
            toggler.classList.remove('collapsed');
            const first = panel.querySelector('a, button, input, [tabindex]:not([tabindex="-1"])');
            if (first) {
              first.focus({preventScroll: true});
            }
          });
          panel.addEventListener('hidden.bs.collapse', function () {
            const anyOpen = panels.some(function (p) { return p.classList.contains('show'); });
            if (!anyOpen) {
              toggler.setAttribute('aria-expanded', 'false');
              toggler.classList.add('collapsed');
              // Return focus to toggler if it isn't currently focused elsewhere.
              if (document.activeElement === document.body) {
                toggler.focus({preventScroll: true});
              }
            }
          });
        });

        // Intercept the click BEFORE Bootstrap's default handler by using
        // capture phase so we can decide what to open/close ourselves.
        toggler.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          const anyOpen = panels.some(function (p) { return p.classList.contains('show'); });
          panels.forEach(function (panel) {
            const inst = bootstrap.Collapse.getOrCreateInstance(panel, {toggle: false});
            if (anyOpen) {
              inst.hide();
            } else {
              inst.show();
            }
          });
        }, true);

        // ESC on any focused element inside an open panel closes both panels.
        panels.forEach(function (panel) {
          panel.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' || event.key === 'Esc') {
              panels.forEach(function (p) {
                const inst = bootstrap.Collapse.getOrCreateInstance(p, {toggle: false});
                inst.hide();
              });
              toggler.focus({preventScroll: true});
            }
          });
        });
      });
    }
  };

  /**
   * WCAG 4.1.2 Name, Role, Value — hidden duplicate form controls.
   *
   * Drupal renders duplicate search-form inputs (once for desktop, once for
   * mobile) and marks the second copies with `aria-hidden="true"` + Drupal's
   * `.visually-hidden` class. That class only clips the element visually — it
   * doesn't remove the input from the tab order, so keyboard users can Tab
   * into a control that AT users can't see. Fix by marking any focusable
   * descendant of an aria-hidden container as `tabindex="-1"` and applying
   * `inert` on browsers that support it.
   */
  Drupal.behaviors.archipelago_subtheme_chiloe_hidden_focus_guard = {
    attach: function (context) {
      const hiddenContainers = once(
        'a11y-hidden-focus-guard',
        '[aria-hidden="true"]',
        context
      );
      hiddenContainers.forEach(function (el) {
        // If the element itself is a focusable form control, disable it.
        if (el.matches('input, button, select, textarea, a[href], [tabindex]')) {
          el.setAttribute('tabindex', '-1');
        }
        // Recurse into focusable descendants.
        el.querySelectorAll('input, button, select, textarea, a[href], [tabindex]').forEach(function (child) {
          child.setAttribute('tabindex', '-1');
        });
        // Modern browsers: `inert` removes the subtree from focus + AT.
        if ('inert' in HTMLElement.prototype && !el.hasAttribute('inert')) {
          el.inert = true;
        }
      });
    }
  };

  /**
   * WCAG 1.3.1 / 4.1.2 — Bootstrap tablist semantics fix.
   *
   * ADO detail pages render tab navigation as `<ul role="tablist">` with
   * `<li class="nav-item">` children (a Bootstrap 5 idiom). axe flags this as
   * both `aria-required-children` (tablist needs direct role="tab" children)
   * and `listitem` (li not inside a role="list" parent, because tablist
   * overrides the implicit list role). The right ARIA remedy is
   * `role="presentation"` on the intermediate <li>s so they're treated as
   * transparent wrappers.
   *
   * These tab lists are rendered by Metadata Display Twig entities stored in
   * the database, so fixing at the theme JS layer here is the cheapest place
   * to close the loop.
   */
  Drupal.behaviors.archipelago_subtheme_chiloe_tablist_a11y = {
    attach: function (context) {
      const tablists = once('a11y-tablist', '[role="tablist"]', context);
      tablists.forEach(function (tablist) {
        // Make <li> intermediaries transparent for aria-required-children.
        tablist.querySelectorAll(':scope > li').forEach(function (li) {
          if (!li.hasAttribute('role')) {
            li.setAttribute('role', 'presentation');
          }
        });
        // Move any <li> whose only descendant with an interactive role is NOT
        // `role="tab"` out of the tablist. This addresses the ADO detail page
        // pattern where a "Download" dropdown was rendered inside the same
        // <ul role="tablist"> as the actual tabs, breaking
        // `aria-required-children`. The non-tab child (e.g. a Bootstrap
        // dropdown) is unwrapped and re-parented as a sibling <div> so it
        // still renders in the same place visually.
        Array.from(tablist.children).forEach(function (child) {
          const hasTab = child.querySelector('[role="tab"]');
          if (!hasTab) {
            // Convert to a plain sibling wrapper outside the tablist.
            const wrapper = document.createElement('div');
            wrapper.className = child.className + ' tablist-adjacent-item';
            while (child.firstChild) {
              wrapper.appendChild(child.firstChild);
            }
            tablist.insertAdjacentElement('afterend', wrapper);
            child.remove();
          }
        });
      });
    }
  };

  Drupal.behaviors.archipelago_subtheme_chiloe = {
    attach: function (context, settings) {
      function SetFixedPositioning(ele) {
        let element = $(ele);
        element.css("position", "");
        element.css("left","");
        element.css("top","");
        var currentOffset = element.offset();
        element.css("position", "fixed");
        element.offset(currentOffset);
        /* For some reason when the page starts already scrolled, the offset v/s the top property are all messed up */
        /* 128 here is very specific to this theme. Sorry! */
        const topCss = +element.css('top').replace('px', '')
        if (topCss < 128) {
          element.css("top","128px");
        }
        var scrollSpyContentEl = document.querySelector('body');
        var scrollSpy = bootstrap.ScrollSpy.getInstance(scrollSpyContentEl);
        scrollSpy.refresh();
      }

      function ResetFixedPositioning(ele) {
        let element = $(ele);
        let currentFixedOffset = element.offset();
        // We want to keep the Vertical offset
        element.css("position", "");
        element.css("left","");
        element.css("top","");
        var currentOffset = element.offset();
        currentOffset.top = currentFixedOffset.top;
        element.css("position", "fixed");
        element.offset(currentOffset);
        /* For some reason when the page starts already scrolled, the offset v/s the top property are all messed up */
        /* 128 here is very specific to this theme. Sorry! */
        const topCss = +element.css('top').replace('px', '')
        if (topCss < 128) {
          element.css("top","128px");
        }
        var scrollSpyContentEl = document.querySelector('body');
        var scrollSpy = bootstrap.ScrollSpy.getInstance(scrollSpyContentEl);
        scrollSpy.refresh();
      }

      function SetAbsolutePositioning(ele) {
        const spiedOn = document.querySelector('#content div.content');
        const scrollspy = document.querySelector('#content div.content .list-scrollspy');
        if (spiedOn && scrollspy ) {
          var scrollSpyContentEl = document.querySelector('body');
          var scrollSpy = bootstrap.ScrollSpy.getInstance(scrollSpyContentEl);
          let Realtop = spiedOn.clientHeight - scrollspy.clientHeight;
          if (Realtop > 0) {
            let element = $(ele);
            element.css("position", "");
            element.css("left", "");
            element.css("top", "");
            element.css("position", "absolute");
            element.css("left", "");
            element.css("top",Realtop + 'px');
            scrollSpy.refresh();
          }
        }
        /* For some reason when the page starts already scrolled, the offset v/s the top property are all messed up */
        /* 128 here is very specific to this theme. Sorry! */
        /*const topCss = +element.css('top').replace('px', '')
        if (topCss < 128) {
          element.css("top","128px");
        } */
      }

      function UnSetFixedPositioning(ele) {
        let element = $(ele);
        element.css("position", "");
        element.css("left","");
        element.css("top","");
      }
      /* resize needs to be aware of this offset.
               Can't be any offset.
                */
      $(once('chiloe-list-scrollspy', '.list-scrollspy', context)).each(function () {
        var ele = this;
        // To make the fixed scrollspy absolute when we reach the end (imagine a scalled window)
        // or a another block after the content we are spying on
        // we will add an element just after the div.content and check intersection
        // This is extremely dependent on this themes/sites needs
        // see html.html.twig where we set up the scroll spy data elements at the body level.
        // and assumes only things inside ".content block" are spied on.
        let $content = document.querySelector('#content div.content');
        let trackerDiv = document.createElement("div");
        trackerDiv.setAttribute("id", "scrollspyAfter");
        $content.insertAdjacentElement('afterend', trackerDiv);

        $(window).on('resize', function () {
          if (ele.classList.contains('list-scrollspy-fixed')) {
            ResetFixedPositioning(ele);
          }
        });
      });

      if ($(context).is('.view') || context == document) {
        /* Initialize Popovers */
        var popoverTriggerList = [].slice.call(context.querySelectorAll('[data-bs-toggle="popover"]'))
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
          return new bootstrap.Popover(popoverTriggerEl)
        })
        $("#main-breadcrumbs").find('.views-display-link').remove();
        $(once('view-header', '.view-header .views-display-link', context)).each(function () {
          $(this).detach().appendTo("#main-breadcrumbs");
        });
      }
      /* Deals with Selects to Drop Downs */
      if ($(context).is('.view') || context == document || $(context).is('.views-exposed-form')) {
        // Observe accordions that have Leaflet inside. If so, on show trigger a global resize event
        // Depends on Leaflet 1.9.4

        // document.getElementById('iiif-0-704597d2-48f0-4dfe-8861-11c5e8cb4fcb-0-map').dispatchEvent(new Event('resize'));
        var CollapsibleList = [].slice.call(context.querySelectorAll('.accordion-collapse.collapse'));
        const CollapsibleThatMatches = CollapsibleList.map(function (collapseEl) {
          const el = collapseEl.querySelector('.strawberry-leaflet-item.leafletViewer');
          if (el) {
            collapseEl.addEventListener('shown.bs.collapse', function () {
              window.dispatchEvent(new Event('resize'));
            })
          }
        });

        // Only act on selects in exposed forms for now.
        $('.views-exposed-form .form-select').each(function(i, e) {
          if (!($(e).data('convert') == 'no')) {
            $(e).hide().removeClass('form-select');
            let selected = $(e).get(0).selectedIndex;
            let option = $(e).children('option:eq(' + selected + ')');
            let current =  option.html();
            let val = option.attr('value');
            let name = $(e).attr("name") || '';

            /* if we have multiple selects i could convert them all to a btn-group? */
            let el = document.createElement('div')
            el.classList.add('dropdown');
            let select = $(e).get(0).parentNode.appendChild(el);
            let dropdown = document.createElement('button')
            dropdown.classList.add('btn','btn-secondary','dropdown-toggle');
            dropdown.type = 'button';
            dropdown.setAttribute('tabindex', 0);
            /* Came case gets transformed into - so bsToggle becomes bs-toggle */
            dropdown.dataset.bsToggle = 'dropdown';
            dropdown.ariaExpanded = 'false';
            dropdown.textContent = current;
            let dropdownItems = document.createElement('div');
            dropdownItems.classList.add('dropdown-menu');
            let hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.value = val;
            hidden.name = name;
            hidden.id = $(e).attr('id');
            select.appendChild(dropdown);
            select.appendChild(dropdownItems);
            select.appendChild(hidden);
            for (const option of $(e).get(0).options) {
              // const item = document.createElement('li');
              // item.classList.add('dropdown-item');
              const link = document.createElement('a');
              link.classList.add('dropdown-item');
              link.dataset.value = option.value;
              link.textContent = option.label;
              link.href = '#';
              link.rel = 'nofollow';
              //item.appendChild(link);
              dropdownItems.appendChild(link);
            }
            var linkList = [].slice.call(select.querySelectorAll('.dropdown-menu a'))
            var dropdownList = linkList.map(function (menuItemLinks) {
              menuItemLinks.addEventListener('click',function (f) {
                let hidden = select.querySelector('input[type=hidden]');
                console.log(this);
                if (hidden && this.dataset?.value !== "undefined") {
                  console.log('clicked');
                  hidden.value = this.dataset.value;
                  let toggle = select.querySelector('.dropdown-toggle');
                  toggle.textContent = this.textContent;
                 // We tried to use events (dispatch 'change') but on ajax reload the listener on auto submit
                  // breaks. but we can always "click" the button!
                  let autosubmit =  hidden.closest('form').querySelector('[data-bef-auto-submit-click]');
                  if (autosubmit) {
                    autosubmit.click();
                    console.log('autosubmit');
                  }
                  else {
                    console.log('firing change event');
                    const ChangeEvent = new Event('change', { 'bubbles': true });
                    console.log(hidden.dispatchEvent(ChangeEvent));
                  }
                }
                f.preventDefault();
              }, false);
            });

            $(e).remove();
          }
        });
      }

      $(once('attache_observer', '#page-wrapper', context))
        .each(function (index, value) {
            /* Used to keep track only once we passed the fake div we added after div.content so
            we can position absolutely the scrollspy navigation
             */
            let passtThreasHold = false;
            var observer = new IntersectionObserver(function (entries) {
              const ratio = entries[0].intersectionRatio;
              //console.log(ratio);
              if (ratio < 0.1) {
                let $scrollspy = document.querySelector('.list-scrollspy');
                if ($scrollspy) {
                  if (!$scrollspy.classList.contains('list-scrollspy-fixed')) {
                    SetFixedPositioning($scrollspy);
                    $scrollspy.classList.add('list-scrollspy-fixed');
                    // reset to false so we can act against when scrolling down.
                    passtThreasHold = false;
                  }
                }
              }
              if (ratio < 0.4) {
                let $topbar = document.querySelector('#navbar-top');
                if (!$topbar.classList.contains('intersected')) {
                  $topbar.classList.add('intersected');
                }
              }
              else if (ratio > 0.6) {
                let $topbar = document.querySelector('#navbar-top');
                let $scrollspy = document.querySelector('.list-scrollspy');
                if ($topbar.classList.contains('intersected')) {
                  $topbar.classList.remove('intersected');

                }
              }
              if (ratio > 0.5) {
                let $scrollspy = document.querySelector('.list-scrollspy');
                if ($scrollspy) {
                  if ($scrollspy.classList.contains('list-scrollspy-fixed')) {
                      $scrollspy.classList.remove('list-scrollspy-fixed');
                      UnSetFixedPositioning($scrollspy);
                  }
                }
              }
            },{
              root: null,
              rootMargin: '0px 0px',
              threshold: [...Array(20).keys()].map(x => x / 20)
            });



            var observerAfter = new IntersectionObserver(function (entries) {
              const ratio = entries[0].intersectionRatio;

              if (ratio == 1 && !passtThreasHold) {
                //console.log(passtThreasHold);
                let $scrollspy = document.querySelector('.list-scrollspy');
                if ($scrollspy) {
                  if ($scrollspy.classList.contains('list-scrollspy-fixed')) {
                    passtThreasHold = true;
                    SetAbsolutePositioning($scrollspy);
                    $scrollspy.classList.remove('list-scrollspy-fixed');
                  }
                }
              }
              else if(ratio == 0 && passtThreasHold && document.querySelector("body").classList.contains('scrollup')) {
                let $scrollspy = document.querySelector('.list-scrollspy');
                if ($scrollspy) {
                  passtThreasHold = false;
                  SetFixedPositioning($scrollspy);
                  $scrollspy.classList.add('list-scrollspy-fixed');
                }
              }
              // So here is the hard thing. On scroll down we will move from 0 to 1 but then again to 0
              // which might trigger again a "fixed". So we need a 3 state thing
              // where once 1 and scrolling down we stay there and only a 0 from 1 when scrolling up should
              // re-fix the nav. Too much engineering.
              // Also, this threshold is in 10 increments to make it less sensitive and also less CPU
              // consuming.
            },{
              root: null,
              rootMargin: '-35% 0% -35% 0%',
              threshold: 1
            });

            let $observedElement = document.querySelector("#navbar-main");
            if ($observedElement) {
              observer.observe($observedElement)
            }
            let $observedAfterElement = document.querySelector("#scrollspyAfter");
            if ($observedAfterElement) {
              observerAfter.observe($observedAfterElement)
            }

          }
        );
    }
  }
})(jQuery, Drupal);
