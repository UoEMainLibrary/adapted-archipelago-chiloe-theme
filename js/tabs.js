(function (Drupal) {
  Drupal.behaviors.showAllTabs = {
    attach: function (context) {
      // Find all tab panes inside the context
      var panes = context.querySelectorAll('.custom-tab-pane');
      panes.forEach(function (pane) {
        pane.style.display = 'block';
      });

      // Make all buttons appear active
      var buttons = context.querySelectorAll('.tab-btn');
      buttons.forEach(function (btn) {
        btn.classList.add('active');
      });

      // Ensure the tab container itself is visible
      var tabContainer = context.querySelector('#customTabs');
      if (tabContainer) {
        tabContainer.style.display = 'block';
      }
    }
  };
})(Drupal);
