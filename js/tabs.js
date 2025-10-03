(function (Drupal) {
  Drupal.behaviors.customTabs = {
    attach: function (context, settings) {
      // only run once per page load
      if (context.querySelector('[data-tabs-initialized]')) return;

      var tabContainer = context.querySelector('#customTabs');
      if (!tabContainer) {
        return; // nothing to do
      }

      tabContainer.setAttribute('data-tabs-initialized', 'true');

      var allButtons = Array.prototype.slice.call(tabContainer.querySelectorAll('.tab-btn'));
      if (!allButtons.length) return;

      var validButtons = [];

      allButtons.forEach(function (btn) {
        var targetId = String(btn.dataset.target || '').trim();
        if (!targetId) {
          var li = btn.closest('li');
          if (li) li.style.display = 'none';
          else btn.style.display = 'none';
          return;
        }

        var pane = document.getElementById(targetId);
        if (pane) {
          validButtons.push(btn);
          var li = btn.closest('li');
          if (li) li.style.display = '';
          btn.style.display = '';
        } else {
          var li2 = btn.closest('li');
          if (li2) li2.style.display = 'none';
          else btn.style.display = 'none';
        }
      });

      if (!validButtons.length) {
        tabContainer.style.display = 'none';
        return;
      }

      tabContainer.style.display = '';

      var firstBtn = validButtons[0];
      validButtons.forEach(function (b) {
        b.classList.remove('active');
      });
      firstBtn.classList.add('active');

      var firstPane = document.getElementById(firstBtn.dataset.target);
      if (firstPane) firstPane.style.display = 'block';

      function hideAllValidPanes() {
        validButtons.forEach(function (b) {
          var p = document.getElementById(b.dataset.target);
          if (p) p.style.display = 'none';
        });
      }

      validButtons.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var targetId = btn.dataset.target;
          if (!targetId) return;

          hideAllValidPanes();
          var target = document.getElementById(targetId);
          if (target) {
            target.style.display = 'block';
            if (typeof Drupal.attachBehaviors === 'function') {
              try {
                Drupal.attachBehaviors(target, settings);
              } catch (err) {
                console.warn('Drupal.attachBehaviors failed for', targetId, err);
              }
            }
          }

          validButtons.forEach(function (b) {
            b.classList.remove('active');
          });
          btn.classList.add('active');
        });
      });
    }
  };
})(Drupal);
