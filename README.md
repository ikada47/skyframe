## Overview

A simple web tool that allows users to overlay WebP (or PNG) images to create custom social media icons.

🔗 Published webpage: https://skyframe.ikada.net

## Project name

SkyFrame

## Author

ikada

## Features

- Client-side image processing

- Multiple overlay images can be selected

## Project Structure

- [src/](src/) – HTML and related frontend assets
- [media/](media/) – Image assets (hosted on a separate CDN due to file size)
- [wrangler.jsonc](wrangler.jsonc) – Configuration for CDN deployment

## Overlay Themes

It currently provides three overlay themes:

- **Pop**  
  Uses the *Inter* font  
  No GenAI tools were used to draw the bird logo

- **Subtle**  
  Uses the *Montserrat* font

- **Strong**  
  Uses the *Jost* font

All overlay images were created using Affinity (vector graphic editor).
## Release Notes

- December 2025: Published a web page

- May 2026: Added a Japanese page, added overlay images (light blue and navy blue), tweaked the appearance of the 'Strong' theme

## License

This project is licensed under the MIT License.
