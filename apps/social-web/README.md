# Social web extraction workspace

This directory contains only code owned by the AliaSpaces first-party social
product. It is not included in the production GitHub Pages artifact.

The initial vertical slice is the profile-image cropper used for avatar,
banner, page-background, and feed-header placement. It is intentionally local:
it does not authenticate, upload, watermark, call an API, or retain the selected
image. Those behaviors will be connected through reviewed shared contracts.

Open `index.html` in a current browser, choose a slot and local image, and use
the crop dialog. The result exists only as a temporary browser object URL until
the page closes or another image is selected.
