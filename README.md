# Kestrel EFB website

The website for [Kestrel EFB](https://github.com/algophobic-dev/Kestrel-EFB-App), a free flight planning app for pilots.

- Website: https://efb.kestrelaviation.tech
- App: https://app.efb.kestrelaviation.tech
- Company: https://kestrelaviation.tech

## Put it on GitHub Pages

The repository is the site. There is nothing to build on GitHub.

1. Upload every file and folder here to the repository.
2. Open **Settings > Pages**, set the source to the `main` branch and the root folder, and save.

## Change a page

The four pages share one header and footer. Edit the page body in `tools/pages/`, then rebuild:

```bash
python3 tools/build.py
```

This writes `index.html`, `features.html`, `download.html` and `about.html`. Styles are in `css/site.css` and page behaviour is in `js/site.js`.

## Custom domain

The site is served at efb.kestrelaviation.tech. `CNAME` holds that name. In **Settings > Pages**, the custom domain must match it, with Enforce HTTPS on.

The company site is at kestrelaviation.tech and the app at app.efb.kestrelaviation.tech. Links to the app use the `APP` address in `tools/build.py`.

## Credits

- Photograph: "American Kestrel" by USFWS Mountain Prairie, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), via [Flickr](https://www.flickr.com/photos/51986662@N05/15290757126).
- Charts and plates in the screenshots: FAA.
- Live weather on the home page: National Weather Service (api.weather.gov).

Provided as is, with no warranty.
