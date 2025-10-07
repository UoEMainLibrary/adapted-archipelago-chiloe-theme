// (function (Drupal) {
//   Drupal.behaviors.customTabs = {
//     attach: function (context) {
//       const tabContainer = context.querySelector('#customTabs');
//       const buttons = context.querySelectorAll('.tab-btn');
//       const panes = context.querySelectorAll('.custom-tab-pane');
//
//       // If there are no panes or no buttons, hide the tab bar and stop
//       if (!panes.length || !buttons.length) {
//         if (tabContainer) tabContainer.style.display = 'none';
//         return;
//       }
//
//       // Ensure the tab bar is visible
//       if (tabContainer) tabContainer.style.display = 'block';
//
//       // Hide all panes initially
//       panes.forEach((pane) => (pane.style.display = 'none'));
//
//       // Show first tab by default
//       const firstTab = document.getElementById(buttons[0].dataset.target);
//       if (firstTab) firstTab.style.display = 'block';
//       buttons[0].classList.add('active');
//
//       // Attach click events to tab buttons
//       buttons.forEach((button) => {
//         button.addEventListener('click', () => {
//           const targetId = button.dataset.target;
//
//           // Hide all panes
//           panes.forEach((pane) => (pane.style.display = 'none'));
//
//           // Show the selected pane
//           const target = document.getElementById(targetId);
//           if (target) target.style.display = 'block';
//
//           // Update active button styles
//           buttons.forEach((btn) => btn.classList.remove('active'));
//           button.classList.add('active');
//
//           // Re-run Drupal behaviors for the visible pane
//           if (typeof Drupal !== 'undefined' && Drupal.attachBehaviors) {
//             Drupal.attachBehaviors(target);
//           }
//         });
//       });
//     },
//   };
// })(Drupal);
