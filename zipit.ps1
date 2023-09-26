$files = @{
    Path            = "css", "images", "scripts", "manifest.json", "readme.md", "popup.html", "update.html"
    DestinationPath = "~\Downloads\lae.zip"
}
Compress-Archive @files
