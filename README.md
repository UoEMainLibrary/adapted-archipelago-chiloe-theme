## Archipelago Sub Theme Chiloé: Bootstrap 5 theme for Archipelago/Drupal 10/11

This is a [Bootstrap Barrio](https://www.drupal.org/project/bootstrap_sass) (Bootstrap 5) subtheme using SCSS/SASS.
Bootstrap 5 is a sleek, intuitive, and powerful front-end framework 
for faster and easier web development.

Named after Chiloé, a [mysterious](https://en.wikipedia.org/wiki/Chiloé_Archipelago), green, humid, rainy and kind-a-awesome Archipelago in southern Chile. 

### Features 

- Includes a few extra customization options not present in Bootstrap Barrio
  -   Tertiary and Quaternary Colors
  -   Dynamic CSS Variable injections (--bb and --bs prefixed, attached to the HTML element)
  -   You can set the Footer Height and also Footer Colors
  -   Automatic conversion of `select` input elements into Bootstrap Dropdowns for extra beauty (via JS)
  -   Overrides for many of Archipelago's most used theme templates (facets, etc)
  -   Pop, eye hurting, bright colors!
  -   Custom JS
- Layout is handle by Bootstrap.
- Two columns, with configurable widths.
- Fixed and fluid layouts.
- Configurable header behavior, using Bootstrap "fixed to top".
- Any block could be defined as "modal" with one click using Skinr.
- Full screen width slider region.

## Installation

`composer require archipelago/archipelago_subtheme_chiloe` 

or if using the standard Archipelago Commons way via

`docker exec -ti esmero-php bash -c "composer require archipelago/archipelago_subtheme_chiloe"`

Enable and customize using the UI.

## SASS

You can either override any of the [Bootstrap basic variables](https://getbootstrap.com/docs/5.3/customize/css-variables) using
The [Drupal Asset Injector Module](https://www.drupal.org/project/asset_injector) or edit/customize deeper by running
- npm install
- gulp

And edit the SCSS files (which will build css files in real time) to override even more.

## Caring & Coding + Fixing + Testing (and painting it pink/gree)

* [Diego Pino](https://github.com/DiegoPino)
* [Allison Sherrick](https://github.com/alliomeria)

## Acknowledgments

This software is a [Metropolitan New York Library Council](https://metro.org) Open-Source initiative and part of the Archipelago Commons project.

## License

[GPLv3](http://www.gnu.org/licenses/gpl-3.0.txt)



## Deployment
Test branch being created to run onto test digital collections using the relevant drush command above.

