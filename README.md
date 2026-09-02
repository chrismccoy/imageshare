# Image Share

A lightweight, self-hosted image service for sharing screenshots instantly in the browser.

## Features

### Uploading and sharing
- **Drag and drop** drop a PNG, JPEG, or GIF onto the page, or click to pick one from your computer
- **Paste from clipboard** take a screenshot and press Ctrl/Cmd-V it uploads straight away
- **Upload progress** a progress bar while larger images transfer
- **Shareable links** every image gets its own short link you can send to anyone
- **Open in a new tab** view the raw image on its own
- **Image info** each share page shows dimensions, file size, and how long until it expires
- **Metadata stripped** GPS, camera, and timestamp data is removed on upload, losslessly and without re-encoding, so image quality is untouched. Rotation is preserved.
- **Automatic expiry** images are deleted after 1 year so old ones don't pile up forever
- **Self-cleaning** the app removes expired images and orphaned files in the background

### Admin
- **Admin area** log in at `/admin` with a username and password to manage all images
- **Image list** thumbnails, key, dimensions, size, TTL, and creation time, across multiple pages
- **Delete images** remove any image right from the list; a two-click confirmation stops accidents
- **Stay logged in** your admin session is remembered until you sign out
- **Brute-force protection** too many wrong password attempts temporarily locks out the login page

## Limits

- Accepted formats: PNG, JPEG, GIF. SVG is rejected it can carry scripts.
- Maximum upload size: 5 MB.
- Uploads are rate limited per IP address.
